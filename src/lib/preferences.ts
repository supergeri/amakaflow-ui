/**
 * User preferences storage utilities
 */

const PREFERENCES_KEY = 'amakaflow_preferences';

export type ImageProcessingMethod = 'ocr' | 'vision';

export interface UserPreferences {
  imageProcessingMethod: ImageProcessingMethod;
}

const DEFAULT_PREFERENCES: UserPreferences = {
  imageProcessingMethod: 'ocr', // Default to OCR (free)
};

/**
 * Get user preferences from localStorage
 */
export function getPreferences(): UserPreferences {
  try {
    const stored = localStorage.getItem(PREFERENCES_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...DEFAULT_PREFERENCES, ...parsed };
    }
  } catch (error) {
    console.error('Failed to load preferences from localStorage:', error);
  }
  return { ...DEFAULT_PREFERENCES };
}

/**
 * Save user preferences to localStorage
 */
export function savePreferences(preferences: Partial<UserPreferences>): void {
  try {
    const current = getPreferences();
    const updated = { ...current, ...preferences };
    localStorage.setItem(PREFERENCES_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Failed to save preferences to localStorage:', error);
  }
}

/**
 * Get the current image processing method preference
 */
export function getImageProcessingMethod(): ImageProcessingMethod {
  return getPreferences().imageProcessingMethod;
}

/**
 * Set the image processing method preference
 */
export function setImageProcessingMethod(method: ImageProcessingMethod): void {
  savePreferences({ imageProcessingMethod: method });
}

