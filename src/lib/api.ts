import { WorkoutStructure, SourceType, Block, Superset } from '../types/workout';

// API base URL - defaults to localhost:8004 (workout-ingestor-api)
const API_BASE_URL = import.meta.env.VITE_INGESTOR_API_URL || 'http://localhost:8004';

/**
 * Normalize workout structure to ensure all blocks have supersets
 * If a block has exercises directly but no supersets, convert them to a superset
 */
function normalizeWorkoutStructure(workout: WorkoutStructure): WorkoutStructure {
  // Ensure workout has blocks
  if (!workout.blocks || workout.blocks.length === 0) {
    return {
      ...workout,
      title: workout.title || 'Imported Workout',
      source: workout.source || 'unknown',
      blocks: [
        {
          label: 'Workout',
          structure: null,
          rest_between_sec: null,
          time_work_sec: null,
          default_reps_range: null,
          default_sets: null,
          exercises: [],
          supersets: [
            {
              exercises: [],
              rest_between_sec: null,
            } as Superset,
          ],
        } as Block,
      ],
    };
  }
  
  const normalizedBlocks = workout.blocks.map((block: Block, index: number) => {
    // Ensure block has a label (use label, structure, or default)
    const blockLabel = block.label || block.structure || `Block ${index + 1}`;
    
    // If block has exercises but no supersets, create a superset with those exercises
    if (block.exercises && block.exercises.length > 0 && (!block.supersets || block.supersets.length === 0)) {
      return {
        ...block,
        label: blockLabel,
        supersets: [
          {
            exercises: block.exercises,
            rest_between_sec: block.rest_between_sec || null,
          } as Superset,
        ],
        exercises: [], // Clear exercises since they're now in supersets
      };
    }
    
    // If block has no supersets and no exercises, create an empty superset
    if (!block.supersets || block.supersets.length === 0) {
      return {
        ...block,
        label: blockLabel,
        supersets: [
          {
            exercises: [],
            rest_between_sec: null,
          } as Superset,
        ],
        exercises: [],
      };
    }
    
    // Block already has supersets, ensure label is set and all fields are properly initialized
    return {
      label: blockLabel,
      structure: block.structure || null,
      rest_between_sec: block.rest_between_sec || null,
      time_work_sec: block.time_work_sec || null,
      default_reps_range: block.default_reps_range || null,
      default_sets: block.default_sets || null,
      exercises: block.exercises || [],
      supersets: block.supersets || [],
    };
  });
  
  return {
    ...workout,
    blocks: normalizedBlocks,
    title: workout.title || 'Imported Workout',
    source: workout.source || 'unknown',
  };
}

/**
 * Real API client for workout-ingestor-api
 */

async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  // Don't set Content-Type for FormData (browser will set it with boundary)
  const headers: HeadersInit = { ...options.headers };
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }
  
  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(error.detail || `API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

/**
 * Generate workout structure from sources
 */
export async function generateWorkoutStructure(
  sources: Array<{ type: SourceType; content: string }>,
  instagramCredentials?: { username: string; password: string }
): Promise<WorkoutStructure> {
  let workout: WorkoutStructure;
  
  // Handle different source types
  for (const source of sources) {
    if (source.type === 'instagram') {
      if (!instagramCredentials) {
        throw new Error('Instagram credentials required. Please provide username and password in settings.');
      }
      
      workout = await apiCall<WorkoutStructure>('/ingest/instagram_test', {
        method: 'POST',
        body: JSON.stringify({
          username: instagramCredentials.username,
          password: instagramCredentials.password,
          url: source.content,
        }),
      });
      break;
    }

    if (source.type === 'youtube') {
      workout = await apiCall<WorkoutStructure>('/ingest/youtube', {
        method: 'POST',
        body: JSON.stringify({
          url: source.content,
        }),
      });
      break;
    }

    if (source.type === 'image') {
      // Handle image URL or blob URL - fetch the image and send it to the API
      try {
        // Fetch the image from the URL (works for both http/https URLs and blob URLs)
        const imageResponse = await fetch(source.content);
        if (!imageResponse.ok) {
          throw new Error(`Failed to fetch image from URL: ${imageResponse.statusText}`);
        }
        
        const imageBlob = await imageResponse.blob();
        
        // Create FormData with the image file
        const formData = new FormData();
        // Extract filename from URL, or use default
        let fileName = 'image.jpg';
        if (source.content.startsWith('blob:')) {
          // For blob URLs, use a generic filename
          const mimeType = imageBlob.type;
          const extension = mimeType.split('/')[1] || 'jpg';
          fileName = `image.${extension}`;
        } else {
          // For regular URLs, try to extract filename
          try {
            const urlPath = new URL(source.content).pathname;
            fileName = urlPath.split('/').pop() || 'image.jpg';
          } catch {
            // If URL parsing fails, use last part of path
            const parts = source.content.split('/');
            fileName = parts[parts.length - 1] || 'image.jpg';
          }
          // Ensure filename has extension
          if (!fileName.includes('.')) {
            const mimeType = imageBlob.type;
            const extension = mimeType.split('/')[1] || 'jpg';
            fileName = `${fileName}.${extension}`;
          }
        }
        formData.append('file', imageBlob, fileName);
        
        // Check user preference for image processing method
        const { getImageProcessingMethod } = await import('./preferences');
        const method = getImageProcessingMethod();
        
        let endpoint = '/ingest/image';
        if (method === 'vision') {
          endpoint = '/ingest/image_vision';
          formData.append('vision_provider', 'openai');
          formData.append('vision_model', 'gpt-4o-mini');
        }
        
        // Call the API with FormData (don't set Content-Type header)
        workout = await apiCall<WorkoutStructure>(endpoint, {
          method: 'POST',
          body: formData,
          headers: {}, // Let browser set Content-Type with boundary
        });
        break;
      } catch (error: any) {
        if (error.message.includes('Failed to fetch image')) {
          throw error;
        }
        throw new Error(`Error processing image: ${error.message}`);
      }
    }

    if (source.type === 'ai-text') {
      workout = await apiCall<WorkoutStructure>('/ingest/ai_workout', {
        method: 'POST',
        body: source.content,
        headers: {
          'Content-Type': 'text/plain',
        },
      });
      break;
    }
  }

  if (!workout) {
    throw new Error('Unsupported source type');
  }

  // Normalize the workout structure to ensure it's compatible with StructureWorkout component
  return normalizeWorkoutStructure(workout);
}

/**
 * Check if the API is available
 */
export async function checkApiHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    return response.ok;
  } catch (error) {
    return false;
  }
}

