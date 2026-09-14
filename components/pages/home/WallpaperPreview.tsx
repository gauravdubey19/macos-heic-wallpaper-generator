"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useWallpaperContext } from "@/context/WallpaperContext";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Clock, Film, Pause, Play, Sparkles, Zap } from "lucide-react";
import Image from "next/image";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

const DEFAULT_INTERVAL_MS = 2500;
const MIN_INTERVAL_MS = 500;
const MAX_INTERVAL_MS = 8000;

interface IntervalPreset {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
}

const PRESETS: IntervalPreset[] = [
  { label: "1s Fast", value: 1000, icon: Zap },
  { label: "2.5s Normal", value: 2500, icon: Sparkles },
  { label: "5s Cinematic", value: 5000, icon: Film },
];

/**
 * Enhanced live wallpaper preview with responsive transition interval handling.
 * - Dynamic crossfade duration scaled proportionally to the playback interval
 * - Elapsed-time aware timer rescheduling: adjusting the slider updates playback tempo instantly
 * - Linear countdown progress bar displaying elapsed frame time
 * - Quick-select interval presets (1s, 2.5s, 5s)
 * - Play/Pause, Step Previous/Next, and direct frame dot selection
 */
export default function WallpaperPreview() {
  const { frames } = useWallpaperContext();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [intervalMs, setIntervalMs] = useState(DEFAULT_INTERVAL_MS);
  const [activeSlot, setActiveSlot] = useState<0 | 1>(0);
  const [slots, setSlots] = useState<[string | null, string | null]>([null, null]);
  const [cycleKey, setCycleKey] = useState(0);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTransitioningRef = useRef(false);
  const lastFrameTimeRef = useRef<number>(Date.now());

  // Dynamic crossfade duration: snappy for quick intervals, cinematic for longer pauses
  const transitionDurationMs = useMemo(() => {
    return Math.min(1000, Math.max(200, Math.round(intervalMs * 0.32)));
  }, [intervalMs]);

  // ── Synchronise active slot when frames or currentIndex change ─────────────
  useEffect(() => {
    if (frames.length === 0) {
      setSlots([null, null]);
      return;
    }
    const safeIndex = currentIndex % frames.length;
    const currentFrame = frames[safeIndex];
    if (!currentFrame) return;

    setSlots((prev) => {
      const next: [string | null, string | null] = [...prev];
      next[activeSlot] = currentFrame.previewUrl;
      return next;
    });
  }, [frames, currentIndex, activeSlot]);

  // ── Reset on frame length change ──────────────────────────────────────────
  useEffect(() => {
    setCurrentIndex(0);
    setActiveSlot(0);
    setCycleKey(0);
    isTransitioningRef.current = false;
    lastFrameTimeRef.current = Date.now();
  }, [frames.length]);

  // ── Crossfade jump to targetIndex ─────────────────────────────────────────
  const goToIndex = useCallback(
    (targetIndex: number) => {
      if (frames.length <= 1 || isTransitioningRef.current || targetIndex === currentIndex) return;
      const targetFrame = frames[targetIndex];
      if (!targetFrame) return;

      isTransitioningRef.current = true;
      const nextSlot: 0 | 1 = activeSlot === 0 ? 1 : 0;

      // Preload target frame in background slot
      setSlots((prev) => {
        const next: [string | null, string | null] = [...prev];
        next[nextSlot] = targetFrame.previewUrl;
        return next;
      });

      // Trigger crossfade transition
      setTimeout(() => {
        setActiveSlot(nextSlot);
        setCurrentIndex(targetIndex);
        setCycleKey((k) => k + 1);
        lastFrameTimeRef.current = Date.now();

        // Unlock after active transition duration + small safety margin
        setTimeout(() => {
          isTransitioningRef.current = false;
        }, transitionDurationMs + 40);
      }, 50);
    },
    [currentIndex, frames, activeSlot, transitionDurationMs],
  );

  // ── Advance relative (+1 or -1) ───────────────────────────────────────────
  const advance = useCallback(
    (direction: 1 | -1 = 1) => {
      if (frames.length <= 1) return;
      const nextIndex = (((currentIndex + direction) % frames.length) + frames.length) % frames.length;
      goToIndex(nextIndex);
    },
    [currentIndex, frames.length, goToIndex],
  );

  // ── Smart auto-play timer with elapsed-time awareness ─────────────────────
  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    if (!isPlaying || frames.length <= 1) return;

    // Calculate how much time already elapsed since current frame was displayed
    const elapsed = Date.now() - lastFrameTimeRef.current;
    const remaining = Math.max(0, intervalMs - elapsed);

    // If remaining time has already elapsed due to slider change, advance right away
    if (remaining === 0) {
      lastFrameTimeRef.current = Date.now();
      advance(1);
      return;
    }

    timerRef.current = setTimeout(() => {
      lastFrameTimeRef.current = Date.now();
      advance(1);
    }, remaining);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isPlaying, intervalMs, advance, frames.length, cycleKey]);

  if (frames.length === 0) return null;

  const currentFrame = frames[currentIndex];

  return (
    <Card id="wallpaper-preview-panel" className="overflow-hidden py-0 border border-border/60 bg-card shadow-md transition-all duration-300 h-fit">
      <CardContent className="p-0 relative">
        {/* ── Image Stage with Dual-Slot Crossfade ── */}
        <div
          className="relative overflow-hidden bg-muted/40 group"
          style={{ aspectRatio: "16/10" }}
          aria-label={`Wallpaper preview: frame ${currentIndex + 1} of ${frames.length}`}
          role="img"
        >
          {/* Slot 0 */}
          {slots[0] && (
            <div
              className={cn("absolute inset-0 ease-in-out", activeSlot === 0 ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none")}
              style={{
                transition: `opacity ${transitionDurationMs}ms cubic-bezier(0.4, 0, 0.2, 1)`,
              }}
            >
              <Image
                src={slots[0]}
                alt="Preview frame slot 0"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 360px"
                unoptimized
                priority
              />
            </div>
          )}

          {/* Slot 1 */}
          {slots[1] && (
            <div
              className={cn("absolute inset-0 ease-in-out", activeSlot === 1 ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none")}
              style={{
                transition: `opacity ${transitionDurationMs}ms cubic-bezier(0.4, 0, 0.2, 1)`,
              }}
            >
              <Image src={slots[1]} alt="Preview frame slot 1" fill className="object-cover" sizes="(max-width: 768px) 100vw, 360px" unoptimized />
            </div>
          )}

          {/* Empty state */}
          {!slots[0] && !slots[1] && (
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/40 text-xs">No preview</div>
          )}

          {/* Frame dots indicator */}
          {frames.length > 1 && (
            <div className="absolute bottom-2.5 left-0 right-0 z-20 flex justify-center gap-1.5 px-4">
              {frames.map((_, i) => (
                <button
                  key={i}
                  className={cn(
                    "rounded-full transition-all duration-300 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white",
                    i === currentIndex ? "w-5 h-1.5 bg-white shadow-sm" : "w-1.5 h-1.5 bg-white/50 hover:bg-white/80",
                  )}
                  onClick={() => goToIndex(i)}
                  aria-label={`Go to frame ${i + 1}`}
                />
              ))}
            </div>
          )}
        </div>
        <CardHeader className="px-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <div className="relative flex items-center justify-center">
                <span
                  className={cn("w-2 h-2 rounded-full", isPlaying && frames.length > 1 ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground/40")}
                />
              </div>
              Live Preview
              {/* Frame indicator badges */}
              <div className="flex items-center gap-1.5">
                {currentFrame && (
                  <Badge variant="outline" className="text-[10px] font-mono h-5 px-1.5">
                    <Clock className="w-2.5 h-2.5 mr-0.5" />
                    {currentFrame.time}
                  </Badge>
                )}
                <Badge variant="secondary" className="text-[10px] font-mono h-5 px-1.5">
                  {currentIndex + 1} / {frames.length}
                </Badge>
              </div>
            </CardTitle>
            {/* Playback Transport Row */}
            <div className="flex items-center justify-center gap-2">
              <Tooltip>
                <TooltipTrigger>
                  <Button
                    id="preview-prev-btn"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => advance(-1)}
                    aria-label="Previous frame"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Previous frame</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger>
                  <Button
                    id="preview-play-pause-btn"
                    variant={isPlaying ? "default" : "outline"}
                    size="icon"
                    className="h-8 w-8 transition-transform active:scale-95"
                    onClick={() => setIsPlaying((v) => !v)}
                    aria-label={isPlaying ? "Pause preview" : "Play preview"}
                    aria-pressed={isPlaying}
                  >
                    {isPlaying ?
                      <Pause className="w-3.5 h-3.5" />
                    : <Play className="w-3.5 h-3.5" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{isPlaying ? "Pause" : "Play"}</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger>
                  <Button id="preview-next-btn" variant="ghost" size="icon" className="h-7 w-7" onClick={() => advance(1)} aria-label="Next frame">
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Next frame</TooltipContent>
              </Tooltip>
            </div>
          </div>
        </CardHeader>

        {/* ── Controls & Tempo Adjustment ── */}
        {frames.length > 1 && (
          <div className="px-4 pb-4 space-y-3.5">
            {/* Quick Presets */}
            <div className="flex items-center justify-between gap-1.5 pt-0.5">
              {PRESETS.map((preset) => {
                const Icon = preset.icon;
                const isSelected = Math.abs(intervalMs - preset.value) < 150;
                return (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => setIntervalMs(preset.value)}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-1 py-1 px-1.5 rounded-md text-[11px] font-medium transition-colors border",
                      isSelected ?
                        "bg-primary text-primary-foreground border-primary shadow-xs"
                      : "bg-muted/40 text-muted-foreground border-border/50 hover:bg-muted hover:text-foreground",
                    )}
                  >
                    <Icon className="w-3 h-3" />
                    <span>{preset.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Transition Interval Slider */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-muted-foreground font-medium">Slide Interval</span>
                <span className="font-mono text-foreground font-semibold">
                  {(intervalMs / 1000).toFixed(1)}s
                  <span className="text-[10px] text-muted-foreground font-normal ml-1">(fade: {transitionDurationMs}ms)</span>
                </span>
              </div>

              <Slider
                id="preview-speed-slider"
                min={MIN_INTERVAL_MS}
                max={MAX_INTERVAL_MS}
                step={100}
                value={[intervalMs]}
                onValueChange={(val) => {
                  const v =
                    Array.isArray(val) ? val[0]
                    : typeof val === "number" ? val
                    : undefined;
                  if (typeof v === "number") setIntervalMs(v);
                }}
                className="w-full cursor-pointer"
                aria-label="Preview transition interval slider"
              />

              <div className="flex items-center justify-between text-[10px] text-muted-foreground/80 font-mono">
                <span>0.5s (Fast)</span>
                <span>8.0s (Slow)</span>
              </div>
            </div>
          </div>
        )}
        {/* Top Progress Countdown Bar */}
        {isPlaying && frames.length > 1 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/20 z-30 overflow-hidden pointer-events-none">
            <div
              key={`progress-${cycleKey}-${intervalMs}`}
              className="h-full bg-primary origin-left transition-none"
              style={{
                animation: `progress-fill ${intervalMs}ms linear forwards`,
                animationPlayState: isPlaying ? "running" : "paused",
              }}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
