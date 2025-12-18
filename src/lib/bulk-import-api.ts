/**
 * Bulk Import API Client
 *
 * API client for the bulk import workflow endpoints.
 * Connects to mapper-api /import/* endpoints.
 */

import {
  BulkInputType,
  BulkDetectRequest,
  BulkDetectResponse,
  BulkMapRequest,
  BulkMapResponse,
  BulkMatchRequest,
  BulkMatchResponse,
  BulkPreviewRequest,
  BulkPreviewResponse,
  BulkExecuteRequest,
  BulkExecuteResponse,
  BulkStatusResponse,
  ColumnMapping,
} from '../types/bulk-import';

// API base URL - defaults to localhost:8001 (mapper-api)
const MAPPER_API_BASE_URL = import.meta.env.VITE_MAPPER_API_URL || 'http://localhost:8001';

// ============================================================================
// API Client Class
// ============================================================================

class BulkImportApiClient {
  private userId: string | null = null;

  setUserId(userId: string): void {
    this.userId = userId;
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    if (this.userId) {
      headers['X-User-Id'] = this.userId;
    }
    return headers;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${MAPPER_API_BASE_URL}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: response.statusText }));
      throw new Error(error.detail || `API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Step 1: Detect items from sources
   * Parses files, URLs, or images and returns detected workout items
   */
  async detect(
    profileId: string,
    sourceType: BulkInputType,
    sources: string[]
  ): Promise<BulkDetectResponse> {
    const request: BulkDetectRequest = {
      profile_id: profileId,
      source_type: sourceType,
      sources,
    };

    return this.request<BulkDetectResponse>('/import/detect', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  /**
   * Step 1b: Upload file for detection
   * Uploads a file and returns detected items
   */
  async detectFile(profileId: string, file: File): Promise<BulkDetectResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('profile_id', profileId);

    const url = `${MAPPER_API_BASE_URL}/import/detect/file`;

    const response = await fetch(url, {
      method: 'POST',
      headers: this.userId ? { 'X-User-Id': this.userId } : {},
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: response.statusText }));
      throw new Error(error.detail || `Upload error: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Step 2: Apply column mappings (for file imports)
   * Maps detected columns to workout fields
   */
  async applyMappings(
    jobId: string,
    profileId: string,
    columnMappings: ColumnMapping[]
  ): Promise<BulkMapResponse> {
    const request: BulkMapRequest = {
      job_id: jobId,
      profile_id: profileId,
      column_mappings: columnMappings,
    };

    return this.request<BulkMapResponse>('/import/map', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  /**
   * Step 3: Match exercises to Garmin database
   * Returns exercise matching suggestions
   */
  async matchExercises(
    jobId: string,
    profileId: string,
    userMappings?: Record<string, string>
  ): Promise<BulkMatchResponse> {
    const request: BulkMatchRequest = {
      job_id: jobId,
      profile_id: profileId,
      user_mappings: userMappings,
    };

    return this.request<BulkMatchResponse>('/import/match', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  /**
   * Step 4: Generate preview
   * Returns preview workouts with validation
   */
  async preview(
    jobId: string,
    profileId: string,
    selectedIds: string[]
  ): Promise<BulkPreviewResponse> {
    const request: BulkPreviewRequest = {
      job_id: jobId,
      profile_id: profileId,
      selected_ids: selectedIds,
    };

    return this.request<BulkPreviewResponse>('/import/preview', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  /**
   * Step 5: Execute import
   * Starts the import process (async or sync)
   */
  async execute(
    jobId: string,
    profileId: string,
    workoutIds: string[],
    device: string,
    asyncMode: boolean = true
  ): Promise<BulkExecuteResponse> {
    const request: BulkExecuteRequest = {
      job_id: jobId,
      profile_id: profileId,
      workout_ids: workoutIds,
      device,
      async_mode: asyncMode,
    };

    return this.request<BulkExecuteResponse>('/import/execute', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  /**
   * Get import job status
   * Used for polling during async import
   */
  async getStatus(jobId: string): Promise<BulkStatusResponse> {
    return this.request<BulkStatusResponse>(`/import/status/${jobId}`, {
      method: 'GET',
    });
  }

  /**
   * Cancel a running import
   */
  async cancel(jobId: string): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>(
      `/import/cancel/${jobId}`,
      {
        method: 'POST',
      }
    );
  }
}

// ============================================================================
// Singleton Export
// ============================================================================

export const bulkImportApi = new BulkImportApiClient();

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Convert File to base64 string
 */
export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data URL prefix (e.g., "data:image/png;base64,")
      const base64 = result.split(',')[1] || result;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Validate URL format
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if URL is a supported video platform
 */
export function isSupportedVideoUrl(url: string): boolean {
  const supportedDomains = [
    'youtube.com',
    'youtu.be',
    'instagram.com',
    'tiktok.com',
  ];

  try {
    const urlObj = new URL(url);
    return supportedDomains.some(domain => urlObj.hostname.includes(domain));
  } catch {
    return false;
  }
}

/**
 * Get supported file extensions
 */
export function getSupportedFileExtensions(): string[] {
  return ['.xlsx', '.xls', '.csv', '.json', '.txt'];
}

/**
 * Check if file is supported
 */
export function isSupportedFile(file: File): boolean {
  const extensions = getSupportedFileExtensions();
  const fileName = file.name.toLowerCase();
  return extensions.some(ext => fileName.endsWith(ext));
}
