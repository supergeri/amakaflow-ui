# AMA-46: Unified Workouts Page Implementation Plan

## Overview

Consolidate Workout History and Follow-Along Workouts into a single unified "My Workouts" page with robust filtering, search, and grouping by date.

## Current State Analysis

### Two Separate Systems

| System | Data Model | Storage | API Endpoint | Features |
|--------|------------|---------|--------------|----------|
| Workout History | `WorkoutHistoryItem` | API + localStorage | `/workouts` | Search, Device filter, Pagination, Bulk ops |
| Follow-Along | `FollowAlongWorkout` | API only | `/follow-along` | Grid display, Device sync, No filtering |

### Key Differences
- **WorkoutHistory**: Has `WorkoutStructure` with blocks/exercises/supersets
- **FollowAlong**: Has flat `steps` array with video-specific metadata
- Different sync tracking: `isExported`/`exportedToDevice` vs `garminWorkoutId`/`appleWatchWorkoutId`

---

## Implementation Plan

### Phase 1: Create Unified Types

**File: `src/types/unified-workout.ts`**

```typescript
// Unified workout representation for display
export type WorkoutSourceType = 'device' | 'video' | 'manual' | 'ai';
export type WorkoutCategory = 'run' | 'strength' | 'hiit' | 'cycling' | 'yoga' | 'swimming' | 'walking' | 'other';
export type DevicePlatform = 'garmin' | 'apple' | 'strava' | 'zwift' | 'manual';
export type VideoPlatform = 'youtube' | 'tiktok' | 'instagram' | 'vimeo' | 'other';

export interface UnifiedWorkout {
  id: string;
  title: string;
  category: WorkoutCategory;

  // Source info
  sourceType: WorkoutSourceType;
  devicePlatform?: DevicePlatform;
  videoPlatform?: VideoPlatform;
  sourceUrl?: string;
  creator?: string; // Video creator name

  // Timing
  durationSec: number;
  completedAt?: string; // ISO timestamp
  createdAt: string;

  // Content summary
  exerciseCount: number;
  exerciseNames: string[]; // For search
  thumbnailUrl?: string;

  // Sync status
  syncStatus: {
    garmin?: { synced: boolean; id?: string; syncedAt?: string };
    apple?: { synced: boolean; id?: string; syncedAt?: string };
    strava?: { synced: boolean; id?: string };
    ios?: { synced: boolean; syncedAt?: string };
  };

  // Original data reference (for actions)
  _original: {
    type: 'history' | 'follow-along';
    data: WorkoutHistoryItem | FollowAlongWorkout;
  };

  // Searchable text (pre-computed)
  searchableText: string;
}
```

### Phase 2: Create Data Normalization Layer

**File: `src/lib/unified-workouts.ts`**

Functions to normalize both workout types into `UnifiedWorkout`:

```typescript
// Convert WorkoutHistoryItem to UnifiedWorkout
function normalizeHistoryWorkout(item: WorkoutHistoryItem): UnifiedWorkout

// Convert FollowAlongWorkout to UnifiedWorkout
function normalizeFollowAlongWorkout(item: FollowAlongWorkout): UnifiedWorkout

// Fetch and combine all workouts
async function fetchAllWorkouts(userId: string): Promise<UnifiedWorkout[]>

// Build searchable text from workout data
function buildSearchableText(workout: UnifiedWorkout): string
```

### Phase 3: Create Filter State & Logic

**File: `src/lib/workout-filters.ts`**

```typescript
export interface WorkoutFilters {
  search: string;
  sourceTypes: WorkoutSourceType[];      // device, video, manual
  devicePlatforms: DevicePlatform[];     // garmin, apple, strava
  videoPlatforms: VideoPlatform[];       // youtube, instagram, tiktok
  categories: WorkoutCategory[];         // run, strength, hiit, etc.
  dateRange: 'today' | 'week' | 'month' | '30days' | 'all' | 'custom';
  customDateStart?: string;
  customDateEnd?: string;
  syncStatus: 'all' | 'synced' | 'not-synced';
}

export const DEFAULT_FILTERS: WorkoutFilters = {
  search: '',
  sourceTypes: [],
  devicePlatforms: [],
  videoPlatforms: [],
  categories: [],
  dateRange: 'all',
  syncStatus: 'all',
};

// Filter function
export function filterWorkouts(
  workouts: UnifiedWorkout[],
  filters: WorkoutFilters
): UnifiedWorkout[]

// Group by date
export function groupWorkoutsByDate(
  workouts: UnifiedWorkout[]
): Map<string, UnifiedWorkout[]>  // 'Today', 'Yesterday', 'This Week', etc.
```

### Phase 4: Create UI Components

#### 4.1 Filter Bar Component
**File: `src/components/workouts/WorkoutFilterBar.tsx`**

- Search input with debounce
- Multi-select dropdowns for each filter type
- Active filter chips with remove buttons
- "Clear all" button
- Mobile-responsive (collapsible on small screens)

#### 4.2 Unified Workout Card
**File: `src/components/workouts/UnifiedWorkoutCard.tsx`**

Contextual display based on source type:
- Icon based on category (run, strength, etc.)
- Source badge (Garmin, YouTube, etc.)
- Duration, exercise count
- Thumbnail for video workouts
- Quick actions: View, Follow Along (video), Sync, Delete

#### 4.3 Main Unified Workouts Page
**File: `src/components/UnifiedWorkouts.tsx`**

- Fetch workouts from both sources
- Apply filters and grouping
- Render grouped sections (Today, Yesterday, This Week, etc.)
- Infinite scroll or "Load More" pagination
- Empty state with suggestions
- Loading skeleton

---

## Detailed Component Structure

```
src/
├── components/
│   ├── workouts/
│   │   ├── WorkoutFilterBar.tsx      # Filter controls
│   │   ├── WorkoutFilterChips.tsx    # Active filter display
│   │   ├── UnifiedWorkoutCard.tsx    # Single workout display
│   │   ├── WorkoutDateGroup.tsx      # Date section header + cards
│   │   └── WorkoutEmptyState.tsx     # No results UI
│   └── UnifiedWorkouts.tsx           # Main page component
├── lib/
│   ├── unified-workouts.ts           # Data fetching & normalization
│   └── workout-filters.ts            # Filter logic
└── types/
    └── unified-workout.ts            # Type definitions
```

---

## Implementation Steps

### Step 1: Types & Normalization (1 file)
- [ ] Create `src/types/unified-workout.ts` with all type definitions
- [ ] Create `src/lib/unified-workouts.ts` with normalization functions

### Step 2: Filter Logic (1 file)
- [ ] Create `src/lib/workout-filters.ts` with filter state and functions
- [ ] Add date grouping logic

### Step 3: Filter UI Components (2 files)
- [ ] Create `src/components/workouts/WorkoutFilterBar.tsx`
- [ ] Create `src/components/workouts/WorkoutFilterChips.tsx`

### Step 4: Workout Card (1 file)
- [ ] Create `src/components/workouts/UnifiedWorkoutCard.tsx`
- [ ] Handle both workout types with contextual display

### Step 5: Main Page (2 files)
- [ ] Create `src/components/workouts/WorkoutDateGroup.tsx`
- [ ] Create `src/components/UnifiedWorkouts.tsx`

### Step 6: Integration
- [ ] Add route/view for UnifiedWorkouts in App.tsx
- [ ] Update navigation to use new unified page
- [ ] Consider keeping legacy pages accessible or deprecating

---

## Filter Options Breakdown

### Source Type Filter
```
[ ] Device Sync (Garmin, Apple Watch, etc.)
[ ] Video Follow-Along (YouTube, Instagram, TikTok)
[ ] Manual Entry
```

### Device Platform Filter (when "Device Sync" selected)
```
[ ] Garmin
[ ] Apple Watch
[ ] Strava
[ ] Zwift
```

### Video Platform Filter (when "Video" selected)
```
[ ] YouTube
[ ] Instagram
[ ] TikTok
```

### Workout Category Filter
```
[ ] Running
[ ] Strength
[ ] HIIT
[ ] Cycling
[ ] Yoga/Mobility
[ ] Swimming
[ ] Walking
[ ] Other
```

### Date Range Filter
```
○ Today
○ This Week
○ This Month
○ Last 30 Days
○ All Time
○ Custom Range...
```

---

## Search Behavior

Search across:
- Workout title
- Exercise names (all exercises in the workout)
- Creator name (for video workouts)
- Device name
- Source platform

Implementation:
- Pre-compute `searchableText` during normalization
- Case-insensitive substring match
- Debounce 300ms on input

---

## Date Grouping Logic

Groups:
1. **Today** - Same calendar day
2. **Yesterday** - Previous calendar day
3. **This Week** - Same ISO week (Mon-Sun)
4. **Last Week** - Previous ISO week
5. **This Month** - Same calendar month
6. **Older** - Everything else

Sort: Most recent first within each group

---

## Quick Actions Per Card

### Video Workout Actions
- **Follow Along** - Opens video URL
- **View Details** - Opens detail modal
- **Sync to Device** - Opens sync options
- **Delete** - Confirmation dialog

### Device Workout Actions
- **View Details** - Opens full workout view
- **Load to Editor** - Opens workout in builder
- **Export** - Shows export options
- **Delete** - Confirmation dialog

---

## Performance Considerations

1. **Parallel fetch**: Fetch history and follow-along simultaneously
2. **Memoization**: Cache normalized workouts, only re-normalize on data change
3. **Virtual scrolling**: Consider for very long lists (100+ workouts)
4. **Debounced search**: 300ms delay before filtering
5. **Pagination**: "Load More" button instead of infinite scroll initially

---

## Migration Strategy

1. **Keep existing pages**: WorkoutHistory.tsx and FollowAlongWorkouts.tsx remain accessible
2. **Add new unified page**: New "My Workouts" becomes primary
3. **Update navigation**: Make unified page the default
4. **Gradual deprecation**: Remove old pages after validation

---

## Out of Scope (Future)

- Analytics/insights dashboard
- Workout comparison
- Social sharing
- Export all functionality
- Workout plans/programs
