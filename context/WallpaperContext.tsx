'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';
import { nanoid } from 'nanoid';
import type {
  DynamicWallpaperFrameConfig,
  TimeDistributionPreset,
  WallpaperFrameItem,
} from '@/lib/types/wallpaper';

// ─── Types ────────────────────────────────────────────────────────────────────

interface WallpaperContextValue {
  frames: WallpaperFrameItem[];
  isGenerating: boolean;
  generationError: string | null;

  addFiles: (files: File[]) => Promise<void>;
  removeFrame: (id: string) => void;
  moveFrameUp: (id: string) => void;
  moveFrameDown: (id: string) => void;
  updateFrameTime: (id: string, time: string) => void;
  setPrimary: (id: string) => void;
  setLight: (id: string) => void;
  setDark: (id: string) => void;
  autoDistributeTimes: (preset: TimeDistributionPreset) => void;
  clearError: () => void;
  generateAndDownload: () => Promise<void>;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Returns the natural dimensions of an image file via an off-screen Image element.
 */
function getImageDimensions(
  file: File
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`Failed to load image: ${file.name}`));
    };
    img.src = url;
  });
}

/**
 * Formats a fractional day value (0–1) back to "HH:MM" string.
 */
function fractionToTime(fraction: number): string {
  const totalMinutes = Math.round(fraction * 24 * 60);
  const h = Math.floor(totalMinutes / 60) % 24;
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Generates evenly-distributed time strings across 24h for N frames.
 */
function generatePresetTimes(
  count: number,
  preset: TimeDistributionPreset
): string[] {
  if (preset === 'equalSpread') {
    return Array.from({ length: count }, (_, i) =>
      fractionToTime(i / count)
    );
  }

  if (preset === 'dayNightBimodal') {
    const half = Math.ceil(count / 2);
    const dayTimes = Array.from({ length: half }, (_, i) =>
      fractionToTime(0.25 + (i / (half - 1 || 1)) * 0.5)
    );
    const nightTimes = Array.from({ length: count - half }, (_, i) =>
      fractionToTime(0.75 + (i / (count - half - 1 || 1)) * 0.25)
    );
    return [...dayTimes, ...nightTimes];
  }

  // sunriseSunset: 05:00 to 20:00
  return Array.from({ length: count }, (_, i) =>
    fractionToTime(5 / 24 + (i / (count - 1 || 1)) * (15 / 24))
  );
}

// ─── Context ──────────────────────────────────────────────────────────────────

const WallpaperContext = createContext<WallpaperContextValue | null>(null);

export function WallpaperProvider({ children }: { children: React.ReactNode }) {
  const [frames, setFrames] = useState<WallpaperFrameItem[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  // Track preview URLs to revoke on removal
  const previewUrlsRef = useRef<Map<string, string>>(new Map());

  // ── addFiles ──────────────────────────────────────────────────────────────

  const addFiles = useCallback(async (files: File[]) => {
    const supported = files.filter((f) =>
      ['image/png', 'image/jpeg'].includes(f.type)
    );

    const newFrames = await Promise.all(
      supported.map(async (file) => {
        const id = nanoid();
        const previewUrl = URL.createObjectURL(file);
        previewUrlsRef.current.set(id, previewUrl);

        let dimensions: { width: number; height: number } | undefined;
        try {
          dimensions = await getImageDimensions(file);
        } catch {
          // Non-critical, proceed without dimensions
        }

        const item: WallpaperFrameItem = {
          id,
          file,
          previewUrl,
          fileName: file.name,
          fileSize: file.size,
          dimensions,
          index: 0, // will be recalculated below
          time: '08:00',
          isPrimary: false,
          isLight: false,
          isDark: false,
        };

        return item;
      })
    );

    setFrames((prev) => {
      const combined = [...prev, ...newFrames].map((f, i) => ({
        ...f,
        index: i,
      }));
      // Auto-assign primary/light/dark if not yet set
      if (!combined.some((f) => f.isPrimary) && combined.length > 0) {
        combined[0]!.isPrimary = true;
      }
      if (!combined.some((f) => f.isLight) && combined.length > 0) {
        combined[0]!.isLight = true;
      }
      if (!combined.some((f) => f.isDark) && combined.length > 0) {
        combined[combined.length - 1]!.isDark = true;
      }
      return combined;
    });
  }, []);

  // ── removeFrame ───────────────────────────────────────────────────────────

  const removeFrame = useCallback((id: string) => {
    const url = previewUrlsRef.current.get(id);
    if (url) {
      URL.revokeObjectURL(url);
      previewUrlsRef.current.delete(id);
    }
    setFrames((prev) =>
      prev
        .filter((f) => f.id !== id)
        .map((f, i) => ({ ...f, index: i }))
    );
  }, []);

  // ── reorder ───────────────────────────────────────────────────────────────

  const moveFrame = useCallback((id: string, direction: 'up' | 'down') => {
    setFrames((prev) => {
      const idx = prev.findIndex((f) => f.id === id);
      if (idx === -1) return prev;
      const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (swapIdx < 0 || swapIdx >= prev.length) return prev;

      const next = [...prev];
      [next[idx], next[swapIdx]] = [next[swapIdx]!, next[idx]!];
      return next.map((f, i) => ({ ...f, index: i }));
    });
  }, []);

  const moveFrameUp = useCallback(
    (id: string) => moveFrame(id, 'up'),
    [moveFrame]
  );
  const moveFrameDown = useCallback(
    (id: string) => moveFrame(id, 'down'),
    [moveFrame]
  );

  // ── updateFrameTime ───────────────────────────────────────────────────────

  const updateFrameTime = useCallback((id: string, time: string) => {
    setFrames((prev) =>
      prev.map((f) => (f.id === id ? { ...f, time } : f))
    );
  }, []);

  // ── Exclusive toggles ─────────────────────────────────────────────────────

  const setPrimary = useCallback((id: string) => {
    setFrames((prev) =>
      prev.map((f) => ({ ...f, isPrimary: f.id === id }))
    );
  }, []);

  const setLight = useCallback((id: string) => {
    setFrames((prev) =>
      prev.map((f) => ({ ...f, isLight: f.id === id }))
    );
  }, []);

  const setDark = useCallback((id: string) => {
    setFrames((prev) =>
      prev.map((f) => ({ ...f, isDark: f.id === id }))
    );
  }, []);

  // ── autoDistributeTimes ───────────────────────────────────────────────────

  const autoDistributeTimes = useCallback(
    (preset: TimeDistributionPreset) => {
      setFrames((prev) => {
        if (prev.length === 0) return prev;
        const times = generatePresetTimes(prev.length, preset);
        return prev.map((f, i) => ({ ...f, time: times[i] ?? '08:00' }));
      });
    },
    []
  );

  // ── clearError ────────────────────────────────────────────────────────────

  const clearError = useCallback(() => setGenerationError(null), []);

  // ── generateAndDownload ───────────────────────────────────────────────────

  const generateAndDownload = useCallback(async () => {
    if (frames.length < 2) {
      setGenerationError('Please add at least 2 images to generate a dynamic wallpaper.');
      return;
    }
    if (!frames.some((f) => f.isLight)) {
      setGenerationError('Please mark a Light Mode default frame.');
      return;
    }
    if (!frames.some((f) => f.isDark)) {
      setGenerationError('Please mark a Dark Mode default frame.');
      return;
    }

    setIsGenerating(true);
    setGenerationError(null);

    try {
      const formData = new FormData();

      const configs: DynamicWallpaperFrameConfig[] = frames.map((f) => ({
        index: f.index,
        time: f.time,
        isPrimary: f.isPrimary,
        isLight: f.isLight,
        isDark: f.isDark,
      }));

      formData.append('config', JSON.stringify(configs));

      for (let i = 0; i < frames.length; i++) {
        const frame = frames[i];
        if (frame) {
          formData.append(`image_${i}`, frame.file, frame.fileName);
        }
      }

      const response = await fetch('/api/generate-wallpaper', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        let errorMessage = `Server error ${response.status}`;
        try {
          const json = (await response.json()) as { error?: string };
          if (json.error) errorMessage = json.error;
        } catch {
          // Use status code message
        }
        throw new Error(errorMessage);
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = downloadUrl;
      anchor.download = 'dynamic_wallpaper.heic';
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Download failed. Please try again.';
      setGenerationError(message);
    } finally {
      setIsGenerating(false);
    }
  }, [frames]);

  // ─────────────────────────────────────────────────────────────────────────

  const value = useMemo<WallpaperContextValue>(
    () => ({
      frames,
      isGenerating,
      generationError,
      addFiles,
      removeFrame,
      moveFrameUp,
      moveFrameDown,
      updateFrameTime,
      setPrimary,
      setLight,
      setDark,
      autoDistributeTimes,
      clearError,
      generateAndDownload,
    }),
    [
      frames,
      isGenerating,
      generationError,
      addFiles,
      removeFrame,
      moveFrameUp,
      moveFrameDown,
      updateFrameTime,
      setPrimary,
      setLight,
      setDark,
      autoDistributeTimes,
      clearError,
      generateAndDownload,
    ]
  );

  return (
    <WallpaperContext.Provider value={value}>
      {children}
    </WallpaperContext.Provider>
  );
}

/**
 * Custom hook providing access to the WallpaperContext.
 * Must be used within a <WallpaperProvider>.
 */
export function useWallpaperContext(): WallpaperContextValue {
  const ctx = useContext(WallpaperContext);
  if (!ctx) {
    throw new Error('useWallpaperContext must be used within a <WallpaperProvider>.');
  }
  return ctx;
}
