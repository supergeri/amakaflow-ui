/**
 * Unified Workout Types
 *
 * Normalizes WorkoutHistoryItem and FollowAlongWorkout into a single
 * unified format for display, filtering, and search in the My Workouts page.
 */

import type { WorkoutHistoryItem } from '../lib/workout-history';
import type { FollowAlongWorkout, FollowAlongStep, VideoPlatform } from './follow-along';
import type { WorkoutStructure, Block, Exercise } from './workout';

// =============================================================================
// Source Types
// =============================================================================

/** How the workout was created/imported */
export type WorkoutSourceType = 'device' | 'video' | 'manual' | 'ai';

/** Device platforms for synced workouts */
export type DevicePlatform = 'garmin' | 'apple' | 'strava' | 'zwift' | 'manual';

// Re-export VideoPlatform from follow-along types
export type { VideoPlatform };

// =============================================================================
// Workout Categories
// =============================================================================

/** High-level workout categories for filtering */
export type WorkoutCategory =
  | 'strength'
  | 'cardio'
  | 'hiit'
  | 'run'
  | 'cycling'
  | 'yoga'
  | 'mobility'
  | 'swimming'
  | 'walking'
  | 'other';

// =============================================================================
// Sync Status
// =============================================================================

export interface SyncStatusEntry {
  synced: boolean;
  id?: string;
  syncedAt?: string;
}

export interface SyncStatus {
  garmin?: SyncStatusEntry;
  apple?: SyncStatusEntry;
  strava?: SyncStatusEntry;
  ios?: SyncStatusEntry;
}

// =============================================================================
// Unified Workout
// =============================================================================

/**
 * Unified workout representation for display.
 *
 * This is the normalized format that both WorkoutHistoryItem and
 * FollowAlongWorkout are converted to for the unified workouts page.
 */
export interface UnifiedWorkout {
  /** Unique identifier */
  id: string;

  /** Workout title */
  title: string;

  /** High-level category (strength, cardio, etc.) */
  category: WorkoutCategory;

  // ---------------------------------------------------------------------------
  // Source Information
  // ---------------------------------------------------------------------------

  /** How the workout was created (device, video, manual, ai) */
  sourceType: WorkoutSourceType;

  /** Device platform for device-synced workouts */
  devicePlatform?: DevicePlatform;

  /** Video platform for video workouts */
  videoPlatform?: VideoPlatform;

  /** Source URL (video URL or content URL) */
  sourceUrl?: string;

  /** Creator name (video creator or content source) */
  creator?: string;

  // ---------------------------------------------------------------------------
  // Timing
  // ---------------------------------------------------------------------------

  /** Total workout duration in seconds */
  durationSec: number;

  /** When the workout was completed (ISO timestamp) */
  completedAt?: string;

  /** When the workout was created (ISO timestamp) */
  createdAt: string;

  /** When the workout was last updated (ISO timestamp) */
  updatedAt: string;

  // ---------------------------------------------------------------------------
  // Content Summary
  // ---------------------------------------------------------------------------

  /** Number of exercises in the workout */
  exerciseCount: number;

  /** List of exercise names (for search) */
  exerciseNames: string[];

  /** Thumbnail URL for video workouts */
  thumbnailUrl?: string;

  /** Description or notes */
  description?: string;

  // ---------------------------------------------------------------------------
  // Sync Status
  // ---------------------------------------------------------------------------

  /** Sync status for each device platform */
  syncStatus: SyncStatus;

  // ---------------------------------------------------------------------------
  // Original Data Reference
  // ---------------------------------------------------------------------------

  /**
   * Reference to original data for actions (view details, edit, sync, delete).
   * This allows us to perform actions on the original data without
   * losing type information.
   */
  _original: {
    type: 'history' | 'follow-along';
    data: WorkoutHistoryItem | FollowAlongWorkout;
  };

  // ---------------------------------------------------------------------------
  // Search
  // ---------------------------------------------------------------------------

  /**
   * Pre-computed searchable text combining title, exercise names,
   * creator, platform names, etc. for fast search filtering.
   */
  searchableText: string;
}

// =============================================================================
// Type Guards
// =============================================================================

export function isHistoryWorkout(
  workout: UnifiedWorkout
): workout is UnifiedWorkout & { _original: { type: 'history'; data: WorkoutHistoryItem } } {
  return workout._original.type === 'history';
}

export function isFollowAlongWorkout(
  workout: UnifiedWorkout
): workout is UnifiedWorkout & { _original: { type: 'follow-along'; data: FollowAlongWorkout } } {
  return workout._original.type === 'follow-along';
}

// =============================================================================
// Helper Types for Normalization
// =============================================================================

/** Input types that can be normalized to UnifiedWorkout */
export type NormalizableWorkout = WorkoutHistoryItem | FollowAlongWorkout;

/** Type guard for WorkoutHistoryItem */
export function isWorkoutHistoryItem(item: NormalizableWorkout): item is WorkoutHistoryItem {
  return 'workout' in item && 'device' in item;
}

/** Type guard for FollowAlongWorkout */
export function isFollowAlongWorkoutType(item: NormalizableWorkout): item is FollowAlongWorkout {
  return 'steps' in item && 'source' in item;
}

// =============================================================================
// Constants
// =============================================================================

/** Display names for workout categories */
export const CATEGORY_DISPLAY_NAMES: Record<WorkoutCategory, string> = {
  strength: 'Strength',
  cardio: 'Cardio',
  hiit: 'HIIT',
  run: 'Running',
  cycling: 'Cycling',
  yoga: 'Yoga',
  mobility: 'Mobility',
  swimming: 'Swimming',
  walking: 'Walking',
  other: 'Other',
};

/** Display names for source types */
export const SOURCE_TYPE_DISPLAY_NAMES: Record<WorkoutSourceType, string> = {
  device: 'Device Sync',
  video: 'Video Workout',
  manual: 'Manual Entry',
  ai: 'AI Generated',
};

/** Display names for device platforms */
export const DEVICE_PLATFORM_DISPLAY_NAMES: Record<DevicePlatform, string> = {
  garmin: 'Garmin',
  apple: 'Apple Watch',
  strava: 'Strava',
  zwift: 'Zwift',
  manual: 'Manual',
};

/** Display names for video platforms */
export const VIDEO_PLATFORM_DISPLAY_NAMES: Record<VideoPlatform, string> = {
  youtube: 'YouTube',
  instagram: 'Instagram',
  tiktok: 'TikTok',
  vimeo: 'Vimeo',
  other: 'Other',
};
