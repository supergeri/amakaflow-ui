/**
 * Export API Client
 *
 * Client for exporting workouts to various formats via the workout-ingestor-api.
 * Supports CSV (Strong-compatible and Extended formats), FIT, TCX, and text.
 */

const WORKOUT_INGESTOR_API_URL = import.meta.env.VITE_INGESTOR_API_URL || 'http://localhost:8004';

export type CsvStyle = 'strong' | 'extended';
export type ExportFormat = 'csv' | 'fit' | 'tcx' | 'text';

export interface WorkoutExportData {
  title: string;
  source?: string;
  blocks: Array<{
    label?: string;
    structure?: string;
    exercises: Array<{
      name: string;
      sets?: number;
      reps?: number;
      reps_range?: string;
      duration_sec?: number;
      rest_sec?: number;
      distance_m?: number;
      notes?: string;
    }>;
    supersets?: Array<{
      exercises: Array<{
        name: string;
        sets?: number;
        reps?: number;
        reps_range?: string;
        duration_sec?: number;
        rest_sec?: number;
        distance_m?: number;
        notes?: string;
      }>;
      rest_between_sec?: number;
    }>;
    time_work_sec?: number;
    rest_between_sec?: number;
  }>;
}

/**
 * Export a single workout to CSV format
 *
 * @param workout - Workout data to export
 * @param style - CSV format style:
 *   - 'strong': Strong-compatible format for Hevy/HeavySet import
 *   - 'extended': AmakaFlow extended format with additional metadata
 * @returns Blob containing the CSV file
 */
export async function exportWorkoutToCsv(
  workout: WorkoutExportData,
  style: CsvStyle = 'strong'
): Promise<Blob> {
  const response = await fetch(`${WORKOUT_INGESTOR_API_URL}/export/csv?style=${style}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(workout),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(error.detail || `CSV export failed: ${response.statusText}`);
  }

  return response.blob();
}

/**
 * Export multiple workouts to a single CSV file
 *
 * @param workouts - Array of workout data to export
 * @param style - CSV format style ('strong' or 'extended')
 * @returns Blob containing the merged CSV file
 */
export async function exportWorkoutsToCsvBulk(
  workouts: WorkoutExportData[],
  style: CsvStyle = 'strong'
): Promise<Blob> {
  const response = await fetch(`${WORKOUT_INGESTOR_API_URL}/export/csv/bulk?style=${style}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(workouts),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(error.detail || `Bulk CSV export failed: ${response.statusText}`);
  }

  return response.blob();
}

/**
 * Export a workout to FIT format
 *
 * @param workout - Workout data to export
 * @returns Blob containing the FIT file
 */
export async function exportWorkoutToFit(workout: WorkoutExportData): Promise<Blob> {
  const response = await fetch(`${WORKOUT_INGESTOR_API_URL}/export/fit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(workout),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(error.detail || `FIT export failed: ${response.statusText}`);
  }

  return response.blob();
}

/**
 * Export a workout to TCX format
 *
 * @param workout - Workout data to export
 * @returns Blob containing the TCX file
 */
export async function exportWorkoutToTcx(workout: WorkoutExportData): Promise<Blob> {
  const response = await fetch(`${WORKOUT_INGESTOR_API_URL}/export/tcx`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(workout),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(error.detail || `TCX export failed: ${response.statusText}`);
  }

  return response.blob();
}

/**
 * Export a workout to TrainingPeaks text format
 *
 * @param workout - Workout data to export
 * @returns Blob containing the text file
 */
export async function exportWorkoutToText(workout: WorkoutExportData): Promise<Blob> {
  const response = await fetch(`${WORKOUT_INGESTOR_API_URL}/export/tp_text`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(workout),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(error.detail || `Text export failed: ${response.statusText}`);
  }

  return response.blob();
}

/**
 * Helper to download a blob as a file
 *
 * @param blob - File blob to download
 * @param filename - Name for the downloaded file
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Export and download a workout in the specified format
 *
 * @param workout - Workout data to export
 * @param format - Export format ('csv', 'fit', 'tcx', 'text')
 * @param options - Additional options
 *   - csvStyle: 'strong' or 'extended' (only for CSV format)
 *   - filename: Custom filename (without extension)
 */
export async function exportAndDownload(
  workout: WorkoutExportData,
  format: ExportFormat,
  options: {
    csvStyle?: CsvStyle;
    filename?: string;
  } = {}
): Promise<void> {
  const baseFilename = options.filename || (workout.title || 'workout').replace(/\s+/g, '_');

  let blob: Blob;
  let extension: string;

  switch (format) {
    case 'csv':
      blob = await exportWorkoutToCsv(workout, options.csvStyle || 'strong');
      extension = 'csv';
      break;
    case 'fit':
      blob = await exportWorkoutToFit(workout);
      extension = 'fit';
      break;
    case 'tcx':
      blob = await exportWorkoutToTcx(workout);
      extension = 'tcx';
      break;
    case 'text':
      blob = await exportWorkoutToText(workout);
      extension = 'txt';
      break;
    default:
      throw new Error(`Unsupported export format: ${format}`);
  }

  downloadBlob(blob, `${baseFilename}.${extension}`);
}
