/**
 * useBulkImportApi Hook
 *
 * React hook for integrating with the bulk import API.
 * Provides methods for each workflow step with automatic state updates.
 * Includes polling logic for async imports.
 */

import { useCallback, useEffect, useRef } from 'react';
import { useBulkImport } from '../context/BulkImportContext';
import {
  bulkImportApi,
  fileToBase64,
  isSupportedFile,
} from '../lib/bulk-import-api';
import {
  BulkInputType,
  ColumnMapping,
  ExerciseMatch,
} from '../types/bulk-import';

// ============================================================================
// Types
// ============================================================================

interface UseBulkImportApiOptions {
  userId: string;
  pollingInterval?: number; // ms, default 2000
  onError?: (error: Error) => void;
}

interface UseBulkImportApiReturn {
  // Step 1: Detection
  detectFromFiles: (files: File[]) => Promise<void>;
  detectFromUrls: (urls: string[]) => Promise<void>;
  detectFromImages: (images: File[]) => Promise<void>;

  // Step 2: Column mapping
  applyColumnMappings: (mappings: ColumnMapping[]) => Promise<void>;

  // Step 3: Exercise matching
  matchExercises: (userMappings?: Record<string, string>) => Promise<void>;
  updateExerciseMatch: (exerciseId: string, garminName: string) => void;

  // Step 4: Preview
  generatePreview: () => Promise<void>;
  toggleWorkoutSelection: (workoutId: string) => void;

  // Step 5: Import
  executeImport: (device: string, asyncMode?: boolean) => Promise<void>;
  cancelImport: () => Promise<void>;

  // Status
  refreshStatus: () => Promise<void>;
  isPolling: boolean;
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function useBulkImportApi({
  userId,
  pollingInterval = 2000,
  onError,
}: UseBulkImportApiOptions): UseBulkImportApiReturn {
  const { state, dispatch, goNext } = useBulkImport();
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const isPollingRef = useRef(false);

  // Set user ID on API client
  useEffect(() => {
    if (userId) {
      bulkImportApi.setUserId(userId);
    }
  }, [userId]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, []);

  // Error handler
  const handleError = useCallback(
    (error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      dispatch({ type: 'SET_ERROR', error: errorMessage });
      dispatch({ type: 'SET_LOADING', loading: false });
      onError?.(error instanceof Error ? error : new Error(errorMessage));
    },
    [dispatch, onError]
  );

  // ============================================================================
  // Step 1: Detection
  // ============================================================================

  const detectFromFiles = useCallback(
    async (files: File[]) => {
      if (files.length === 0) return;

      // Validate files
      const unsupported = files.filter(f => !isSupportedFile(f));
      if (unsupported.length > 0) {
        handleError(new Error(`Unsupported file type: ${unsupported[0].name}`));
        return;
      }

      dispatch({ type: 'SET_LOADING', loading: true });
      dispatch({ type: 'SET_INPUT_TYPE', inputType: 'file' });
      dispatch({ type: 'SET_INPUT_SOURCES', sources: files });

      try {
        // For now, use the first file (multi-file support can be added later)
        const response = await bulkImportApi.detectFile(userId, files[0]);

        dispatch({ type: 'SET_JOB_ID', jobId: response.job_id });
        dispatch({
          type: 'SET_DETECTED_ITEMS',
          items: response.items,
          metadata: response.metadata,
        });
        dispatch({ type: 'SET_LOADING', loading: false });
        goNext();
      } catch (error) {
        handleError(error);
      }
    },
    [userId, dispatch, goNext, handleError]
  );

  const detectFromUrls = useCallback(
    async (urls: string[]) => {
      if (urls.length === 0) return;

      dispatch({ type: 'SET_LOADING', loading: true });
      dispatch({ type: 'SET_INPUT_TYPE', inputType: 'urls' });
      dispatch({ type: 'SET_INPUT_SOURCES', sources: urls });

      try {
        const response = await bulkImportApi.detect(userId, 'urls', urls);

        dispatch({ type: 'SET_JOB_ID', jobId: response.job_id });
        dispatch({
          type: 'SET_DETECTED_ITEMS',
          items: response.items,
          metadata: response.metadata,
        });
        dispatch({ type: 'SET_LOADING', loading: false });
        goNext();
      } catch (error) {
        handleError(error);
      }
    },
    [userId, dispatch, goNext, handleError]
  );

  const detectFromImages = useCallback(
    async (images: File[]) => {
      if (images.length === 0) return;

      dispatch({ type: 'SET_LOADING', loading: true });
      dispatch({ type: 'SET_INPUT_TYPE', inputType: 'images' });
      dispatch({ type: 'SET_INPUT_SOURCES', sources: images });

      try {
        // Convert images to base64
        const base64Images = await Promise.all(images.map(fileToBase64));

        const response = await bulkImportApi.detect(userId, 'images', base64Images);

        dispatch({ type: 'SET_JOB_ID', jobId: response.job_id });
        dispatch({
          type: 'SET_DETECTED_ITEMS',
          items: response.items,
          metadata: response.metadata,
        });
        dispatch({ type: 'SET_LOADING', loading: false });
        goNext();
      } catch (error) {
        handleError(error);
      }
    },
    [userId, dispatch, goNext, handleError]
  );

  // ============================================================================
  // Step 2: Column Mapping
  // ============================================================================

  const applyColumnMappings = useCallback(
    async (mappings: ColumnMapping[]) => {
      if (!state.jobId) {
        handleError(new Error('No active import job'));
        return;
      }

      dispatch({ type: 'SET_LOADING', loading: true });

      try {
        const response = await bulkImportApi.applyMappings(
          state.jobId,
          userId,
          mappings
        );

        // The response includes parsed workouts - we'll use them in preview
        dispatch({ type: 'SET_LOADING', loading: false });
        goNext();
      } catch (error) {
        handleError(error);
      }
    },
    [state.jobId, userId, dispatch, goNext, handleError]
  );

  // ============================================================================
  // Step 3: Exercise Matching
  // ============================================================================

  const matchExercises = useCallback(
    async (userMappings?: Record<string, string>) => {
      if (!state.jobId) {
        handleError(new Error('No active import job'));
        return;
      }

      dispatch({ type: 'SET_LOADING', loading: true });

      try {
        const response = await bulkImportApi.matchExercises(
          state.jobId,
          userId,
          userMappings
        );

        dispatch({
          type: 'SET_EXERCISE_MATCHES',
          exercises: response.exercises,
        });
        dispatch({ type: 'SET_LOADING', loading: false });

        // Auto-advance if all exercises are matched
        if (response.unmapped === 0 && response.needs_review === 0) {
          goNext();
        }
      } catch (error) {
        handleError(error);
      }
    },
    [state.jobId, userId, dispatch, goNext, handleError]
  );

  const updateExerciseMatch = useCallback(
    (exerciseId: string, garminName: string) => {
      const exercise = state.matches.exercises.find(e => e.id === exerciseId);
      if (!exercise) return;

      const updates: Partial<ExerciseMatch> = {
        matchedGarminName: garminName,
        userSelection: garminName,
        status: garminName ? 'matched' : 'unmapped',
        confidence: garminName ? 100 : 0,
      };

      dispatch({ type: 'UPDATE_EXERCISE_MATCH', id: exerciseId, updates });
    },
    [state.matches.exercises, dispatch]
  );

  // ============================================================================
  // Step 4: Preview
  // ============================================================================

  const generatePreview = useCallback(async () => {
    if (!state.jobId) {
      handleError(new Error('No active import job'));
      return;
    }

    dispatch({ type: 'SET_LOADING', loading: true });

    try {
      const response = await bulkImportApi.preview(
        state.jobId,
        userId,
        state.detected.selectedIds
      );

      dispatch({
        type: 'SET_PREVIEW_WORKOUTS',
        workouts: response.workouts,
        stats: response.stats,
      });
      dispatch({ type: 'SET_LOADING', loading: false });
      goNext();
    } catch (error) {
      handleError(error);
    }
  }, [state.jobId, state.detected.selectedIds, userId, dispatch, goNext, handleError]);

  const toggleWorkoutSelection = useCallback(
    (workoutId: string) => {
      dispatch({ type: 'TOGGLE_WORKOUT_SELECTION', id: workoutId });
    },
    [dispatch]
  );

  // ============================================================================
  // Step 5: Import
  // ============================================================================

  const startPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
    }

    isPollingRef.current = true;

    pollingRef.current = setInterval(async () => {
      if (!state.import.jobId) return;

      try {
        const status = await bulkImportApi.getStatus(state.import.jobId);

        dispatch({
          type: 'UPDATE_IMPORT_PROGRESS',
          progress: status.progress,
          currentItem: status.current_item,
        });
        dispatch({
          type: 'SET_IMPORT_RESULTS',
          results: status.results,
        });

        if (status.status === 'complete') {
          dispatch({ type: 'COMPLETE_IMPORT' });
          if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
          }
          isPollingRef.current = false;
        } else if (status.status === 'failed' || status.status === 'cancelled') {
          dispatch({
            type: 'SET_IMPORT_STATUS',
            status: status.status,
            error: status.error,
          });
          if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
          }
          isPollingRef.current = false;
        }
      } catch (error) {
        console.error('Polling error:', error);
        // Don't stop polling on transient errors
      }
    }, pollingInterval);
  }, [state.import.jobId, pollingInterval, dispatch]);

  const executeImport = useCallback(
    async (device: string, asyncMode: boolean = true) => {
      if (!state.jobId) {
        handleError(new Error('No active import job'));
        return;
      }

      const selectedWorkoutIds = state.preview.workouts
        .filter(w => w.selected)
        .map(w => w.id);

      if (selectedWorkoutIds.length === 0) {
        handleError(new Error('No workouts selected for import'));
        return;
      }

      dispatch({ type: 'SET_LOADING', loading: true });

      try {
        const response = await bulkImportApi.execute(
          state.jobId,
          userId,
          selectedWorkoutIds,
          device,
          asyncMode
        );

        dispatch({ type: 'START_IMPORT', jobId: response.job_id });
        dispatch({ type: 'SET_LOADING', loading: false });

        if (asyncMode) {
          startPolling();
        }
      } catch (error) {
        handleError(error);
      }
    },
    [state.jobId, state.preview.workouts, userId, dispatch, startPolling, handleError]
  );

  const cancelImport = useCallback(async () => {
    if (!state.import.jobId) return;

    try {
      await bulkImportApi.cancel(state.import.jobId);
      dispatch({ type: 'SET_IMPORT_STATUS', status: 'cancelled' });

      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
      isPollingRef.current = false;
    } catch (error) {
      handleError(error);
    }
  }, [state.import.jobId, dispatch, handleError]);

  const refreshStatus = useCallback(async () => {
    if (!state.import.jobId) return;

    try {
      const status = await bulkImportApi.getStatus(state.import.jobId);

      dispatch({
        type: 'UPDATE_IMPORT_PROGRESS',
        progress: status.progress,
        currentItem: status.current_item,
      });
      dispatch({
        type: 'SET_IMPORT_RESULTS',
        results: status.results,
      });
      dispatch({
        type: 'SET_IMPORT_STATUS',
        status: status.status,
        error: status.error,
      });
    } catch (error) {
      handleError(error);
    }
  }, [state.import.jobId, dispatch, handleError]);

  return {
    // Step 1
    detectFromFiles,
    detectFromUrls,
    detectFromImages,

    // Step 2
    applyColumnMappings,

    // Step 3
    matchExercises,
    updateExerciseMatch,

    // Step 4
    generatePreview,
    toggleWorkoutSelection,

    // Step 5
    executeImport,
    cancelImport,

    // Status
    refreshStatus,
    isPolling: isPollingRef.current,
  };
}

export default useBulkImportApi;
