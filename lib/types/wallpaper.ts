// Shared TypeScript contracts for the Dynamic Wallpaper Creator

/**
 * A single frame configuration for the Apple Dynamic Wallpaper plist.
 * This is what gets sent to the API route as JSON.
 */
export interface DynamicWallpaperFrameConfig {
  /** Zero-based index of this frame within the HEIC container */
  index: number;
  /** Trigger time in "HH:MM" format (24-hour clock) */
  time: string;
  /** Whether this frame is the primary/cover thumbnail */
  isPrimary: boolean;
  /** Whether this frame is the Light Mode default */
  isLight: boolean;
  /** Whether this frame is the Dark Mode default */
  isDark: boolean;
}

/**
 * A frame item managed by the WallpaperContext on the client side.
 * Extends the config with browser File object and preview URL.
 */
export interface WallpaperFrameItem extends DynamicWallpaperFrameConfig {
  /** Stable unique ID for React key management */
  id: string;
  /** Browser File object (only available client-side) */
  file: File;
  /** Object URL for the thumbnail preview */
  previewUrl: string;
  /** Original file name */
  fileName: string;
  /** File size in bytes */
  fileSize: number;
  /** Image dimensions (populated asynchronously after load) */
  dimensions?: { width: number; height: number };
}

/**
 * The payload shape posted to /api/generate-wallpaper.
 * Images are sent as FormData files; configs are sent as JSON string.
 */
export interface WallpaperGenerationPayload {
  frames: DynamicWallpaperFrameConfig[];
}

/**
 * Possible preset time distribution modes for the FormModal
 */
export type TimeDistributionPreset = "equalSpread" | "dayNightBimodal" | "sunriseSunset";
