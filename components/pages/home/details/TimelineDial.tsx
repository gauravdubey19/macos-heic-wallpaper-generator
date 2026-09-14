"use client";

import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { timeToDayFraction } from "@/lib/appleMetadata";
import type { WallpaperFrameItem } from "@/lib/types/wallpaper";
import { Clock, Moon, RotateCcw, Star, Sun, Sunrise, Sunset } from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

interface TimelineDialProps {
  frames: WallpaperFrameItem[];
  onSelectFrame?: (index: number) => void;
}

// Convert fractional day (0..1) to "HH:MM"
function fractionToTimeString(frac: number): string {
  const totalMins = Math.round((((frac % 1) + 1) % 1) * 24 * 60);
  const h = Math.floor(totalMins / 60) % 24;
  const m = totalMins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

// Format duration between two time fractions
// function formatDuration(startFrac: number, endFrac: number): string {
//   let diff = endFrac - startFrac;
//   if (diff <= 0) diff += 1;
//   const totalMinutes = Math.round(diff * 24 * 60);
//   const hours = Math.floor(totalMinutes / 60);
//   const minutes = totalMinutes % 60;
//   if (hours === 0) return `${minutes}m`;
//   if (minutes === 0) return `${hours}h`;
//   return `${hours}h ${minutes}m`;
// }

export default function TimelineDial({ frames, onSelectFrame }: TimelineDialProps) {
  const SIZE = 260;
  const R = 94;
  const CX = SIZE / 2;
  const CY = SIZE / 2;

  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isScrubbing, setIsScrubbing] = useState(false);

  // Live real-time fraction
  const [currentHourFraction, setCurrentHourFraction] = useState<number>(() => {
    const now = new Date();
    return (now.getHours() + now.getMinutes() / 60 + now.getSeconds() / 3600) / 24;
  });

  // Scrubbed time fraction (defaults to live time)
  const [scrubFraction, setScrubFraction] = useState<number>(currentHourFraction);

  // Update live clock every 10 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const frac = (now.getHours() + now.getMinutes() / 60 + now.getSeconds() / 3600) / 24;
      setCurrentHourFraction(frac);
      if (!isScrubbing) {
        setScrubFraction(frac);
      }
    }, 10000);
    return () => clearInterval(timer);
  }, [isScrubbing]);

  // Coordinate converter: 0 = 00:00 (top, -PI/2)
  const fractionToXY = (fraction: number, radius: number) => {
    const angle = fraction * 2 * Math.PI - Math.PI / 2;
    return {
      x: CX + radius * Math.cos(angle),
      y: CY + radius * Math.sin(angle),
    };
  };

  // Sort frames chronologically by time
  const sortedFrames = useMemo(() => {
    return [...frames].sort((a, b) => timeToDayFraction(a.time) - timeToDayFraction(b.time));
  }, [frames]);

  // Determine active frame based on scrubFraction
  const activeFrameAtScrub = useMemo(() => {
    if (sortedFrames.length === 0) return null;
    const scrub = ((scrubFraction % 1) + 1) % 1;
    // Find the latest frame whose time is <= scrub
    let active = sortedFrames[sortedFrames.length - 1]; // wraps around midnight
    for (let i = 0; i < sortedFrames.length; i++) {
      const fTime = timeToDayFraction(sortedFrames[i].time);
      if (fTime <= scrub) {
        active = sortedFrames[i];
      } else {
        break;
      }
    }
    return active;
  }, [sortedFrames, scrubFraction]);

  // Active frame to display in center hub
  const displayedFrame = useMemo(() => {
    if (hoveredIndex !== null) {
      return frames.find((f) => f.index === hoveredIndex) ?? null;
    }
    if (selectedIndex !== null) {
      return frames.find((f) => f.index === selectedIndex) ?? null;
    }
    if (isScrubbing && activeFrameAtScrub) {
      return activeFrameAtScrub;
    }
    return null;
  }, [hoveredIndex, selectedIndex, isScrubbing, activeFrameAtScrub, frames]);

  // Calculate active time span for each frame
  // const frameSectors = useMemo(() => {
  //   if (sortedFrames.length < 2) return [];
  //   return sortedFrames.map((frame, i) => {
  //     const startFrac = timeToDayFraction(frame.time);
  //     const nextFrame = sortedFrames[(i + 1) % sortedFrames.length];
  //     const endFrac = timeToDayFraction(nextFrame.time);
  //     const durationStr = formatDuration(startFrac, endFrac);
  //     return {
  //       frame,
  //       startFrac,
  //       endFrac,
  //       durationStr,
  //     };
  //   });
  // }, [sortedFrames]);

  // Hour tick marks: 24 total
  const ticks = useMemo(() => {
    return Array.from({ length: 24 }, (_, i) => {
      const f = i / 24;
      const isMajor = i % 6 === 0;
      const isMedium = i % 2 === 0;
      const outer = fractionToXY(
        f,
        R +
          (isMajor ? 8
          : isMedium ? 5
          : 3),
      );
      const inner = fractionToXY(f, R - 1);
      return { outer, inner, hour: i, isMajor, isMedium };
    });
  }, [R, CX, CY]);

  // Current system time position
  const currentTimePos = fractionToXY(currentHourFraction, R - 6);
  // Scrub time needle position
  const scrubTimePos = fractionToXY(scrubFraction, R + 4);

  return (
    <div className="flex flex-col items-center gap-4 w-full select-none">
      {/* ── Circular Dial Container ── */}
      <div className="relative flex items-center justify-center">
        <svg
          width={SIZE}
          height={SIZE}
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          className="overflow-visible drop-shadow-sm"
          aria-label="24-Hour Circular Wallpaper Timeline"
          role="img"
        >
          <defs>
            {/* Daytime Sky Arc Gradient (06:00 -> 18:00) */}
            <linearGradient id="timelineDayGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#f59e0b" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#f97316" stopOpacity="0.8" />
            </linearGradient>

            {/* Nighttime Sky Arc Gradient (18:00 -> 06:00) */}
            <linearGradient id="timelineNightGradient" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.7" />
              <stop offset="50%" stopColor="#312e81" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.7" />
            </linearGradient>

            {/* Center Dial Hub Shadow */}
            <radialGradient id="centerHubGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="hsl(var(--card))" stopOpacity="0.95" />
              <stop offset="75%" stopColor="hsl(var(--card))" stopOpacity="0.85" />
              <stop offset="100%" stopColor="hsl(var(--muted)/0.5)" stopOpacity="0.9" />
            </radialGradient>

            <filter id="markerGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="0" stdDeviation="2.5" floodColor="currentColor" floodOpacity="0.4" />
            </filter>
          </defs>

          {/* Background Outer Ring Track */}
          <circle cx={CX} cy={CY} r={R} fill="none" stroke="hsl(var(--border))" strokeWidth="2" strokeDasharray="3 3" opacity="0.6" />

          {/* Day Arc (06:00 to 18:00 - bottom half) */}
          <path
            d={`M ${CX + R} ${CY} A ${R} ${R} 0 0 1 ${CX - R} ${CY}`}
            fill="none"
            stroke="url(#timelineDayGradient)"
            strokeWidth="3.5"
            strokeLinecap="round"
            className="opacity-80"
          />

          {/* Night Arc (18:00 to 06:00 - top half) */}
          <path
            d={`M ${CX - R} ${CY} A ${R} ${R} 0 0 1 ${CX + R} ${CY}`}
            fill="none"
            stroke="url(#timelineNightGradient)"
            strokeWidth="3.5"
            strokeLinecap="round"
            className="opacity-80"
          />

          {/* Hour Ticks */}
          {ticks.map(({ outer, inner, hour, isMajor, isMedium }) => (
            <line
              key={hour}
              x1={inner.x}
              y1={inner.y}
              x2={outer.x}
              y2={outer.y}
              stroke={isMajor ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))"}
              strokeWidth={
                isMajor ? 2
                : isMedium ?
                  1.25
                : 0.75
              }
              strokeOpacity={
                isMajor ? 0.9
                : isMedium ?
                  0.45
                : 0.25
              }
            />
          ))}

          {/* Celestial Cardinal Anchors */}
          {/* 00:00 (Midnight) */}
          <g transform={`translate(${CX}, ${CY - R - 13})`} className="text-violet-400">
            <text
              x="0"
              y="0"
              textAnchor="middle"
              dominantBaseline="central"
              fontSize="9"
              fontWeight="700"
              fill="currentColor"
              className="font-mono tracking-tight"
            >
              00
            </text>
          </g>

          {/* 06:00 (Dawn) */}
          <g transform={`translate(${CX + R + 13}, ${CY})`} className="text-sky-400">
            <text
              x="0"
              y="0"
              textAnchor="middle"
              dominantBaseline="central"
              fontSize="9"
              fontWeight="700"
              fill="currentColor"
              className="font-mono tracking-tight"
            >
              06
            </text>
          </g>

          {/* 12:00 (Noon) */}
          <g transform={`translate(${CX}, ${CY + R + 13})`} className="text-amber-500">
            <text
              x="0"
              y="0"
              textAnchor="middle"
              dominantBaseline="central"
              fontSize="9"
              fontWeight="700"
              fill="currentColor"
              className="font-mono tracking-tight"
            >
              12
            </text>
          </g>

          {/* 18:00 (Dusk) */}
          <g transform={`translate(${CX - R - 13}, ${CY})`} className="text-orange-400">
            <text
              x="0"
              y="0"
              textAnchor="middle"
              dominantBaseline="central"
              fontSize="9"
              fontWeight="700"
              fill="currentColor"
              className="font-mono tracking-tight"
            >
              18
            </text>
          </g>

          {/* Live System Time Needle */}
          <line
            x1={CX}
            y1={CY}
            x2={currentTimePos.x}
            y2={currentTimePos.y}
            stroke="hsl(var(--primary))"
            strokeWidth="1.5"
            strokeDasharray="2 2"
            strokeOpacity="0.55"
          />
          <circle cx={currentTimePos.x} cy={currentTimePos.y} r="3" fill="hsl(var(--primary))" className="animate-pulse" />

          {/* Scrub Needle (when scrubbing) */}
          {isScrubbing && (
            <g>
              <line x1={CX} y1={CY} x2={scrubTimePos.x} y2={scrubTimePos.y} stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" />
              <circle cx={scrubTimePos.x} cy={scrubTimePos.y} r="4" fill="#f59e0b" />
            </g>
          )}

          {/* Frame Markers & Spokes */}
          {sortedFrames.map((frame) => {
            const fraction = timeToDayFraction(frame.time);
            const pos = fractionToXY(fraction, R);
            const isHovered = hoveredIndex === frame.index;
            const isSelected = selectedIndex === frame.index;
            const isActiveAtScrub = activeFrameAtScrub?.index === frame.index;

            const markerColor =
              frame.isPrimary ? "#f59e0b"
              : frame.isLight ? "#38bdf8"
              : frame.isDark ? "#a855f7"
              : "hsl(var(--primary))";

            return (
              <g
                key={frame.id}
                className="cursor-pointer transition-all duration-200"
                onMouseEnter={() => setHoveredIndex(frame.index)}
                onMouseLeave={() => setHoveredIndex(null)}
                onClick={() => {
                  setSelectedIndex((prev) => (prev === frame.index ? null : frame.index));
                  onSelectFrame?.(frame.index);
                }}
              >
                {/* Spoke connector */}
                <line
                  x1={CX}
                  y1={CY}
                  x2={pos.x}
                  y2={pos.y}
                  stroke={markerColor}
                  strokeWidth={isHovered || isSelected || isActiveAtScrub ? 2 : 1}
                  strokeOpacity={isHovered || isSelected || isActiveAtScrub ? 0.8 : 0.25}
                />

                {/* Pulsing ring on hover/selected */}
                {(isHovered || isSelected || isActiveAtScrub) && (
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={isSelected ? 13 : 11}
                    fill={markerColor}
                    fillOpacity={isSelected ? 0.35 : 0.2}
                    className="animate-pulse"
                  />
                )}

                {/* Marker Outer Circle */}
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={isHovered || isSelected ? 8 : 6.5}
                  fill={markerColor}
                  stroke="hsl(var(--card))"
                  strokeWidth="2"
                  className="transition-all duration-200"
                />

                {/* Frame Index text */}
                <text
                  x={pos.x}
                  y={pos.y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={isHovered || isSelected ? "7.5" : "6.5"}
                  fontWeight="bold"
                  fill="#ffffff"
                  className="pointer-events-none select-none font-mono"
                >
                  {frame.index + 1}
                </text>
              </g>
            );
          })}
        </svg>

        {/* ── Center Dial Hub (HTML Overlay for crisp graphics) ── */}
        <div className="absolute inset-0 m-auto w-34 h-34 rounded-full flex flex-col items-center justify-center p-2 text-center pointer-events-none transition-all duration-300 border border-border/50 bg-card/90 backdrop-blur-xs shadow-inner">
          {displayedFrame ?
            <div className="flex flex-col items-center justify-center gap-1 animate-in fade-in zoom-in-95 duration-200">
              {/* Miniature Frame Image Thumbnail */}
              <div className="relative w-11 h-7 rounded-sm overflow-hidden border border-border/70 shadow-xs">
                <Image
                  src={displayedFrame.previewUrl}
                  alt={`Frame ${displayedFrame.index + 1}`}
                  fill
                  className="object-cover"
                  sizes="44px"
                  unoptimized
                />
              </div>

              <div className="flex flex-col items-center leading-none">
                <span className="text-[11px] font-bold text-foreground font-mono">Frame {displayedFrame.index + 1}</span>
                <span className="text-[12px] font-black font-mono text-primary mt-0.5">{displayedFrame.time}</span>
              </div>

              {/* Role badge */}
              <div className="flex items-center gap-1">
                {displayedFrame.isPrimary && (
                  <Badge variant="outline" className="h-4 px-1 text-[8.5px] border-amber-500/40 text-amber-500 bg-amber-500/10 gap-0.5">
                    <Star className="w-2 h-2 fill-amber-500/40" /> Primary
                  </Badge>
                )}
                {displayedFrame.isLight && (
                  <Badge variant="outline" className="h-4 px-1 text-[8.5px] border-sky-500/40 text-sky-400 bg-sky-500/10 gap-0.5">
                    <Sun className="w-2 h-2" /> Light
                  </Badge>
                )}
                {displayedFrame.isDark && (
                  <Badge variant="outline" className="h-4 px-1 text-[8.5px] border-violet-500/40 text-violet-400 bg-violet-500/10 gap-0.5">
                    <Moon className="w-2 h-2" /> Dark
                  </Badge>
                )}
                {!displayedFrame.isPrimary && !displayedFrame.isLight && !displayedFrame.isDark && (
                  <span className="text-[9px] text-muted-foreground font-medium">Scheduled</span>
                )}
              </div>
            </div>
          : <div className="flex flex-col items-center justify-center gap-0.5 text-center">
              <div className="flex items-center gap-1 text-primary">
                <Clock className="w-3 h-3 animate-spin-slow" />
                <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Local Time</span>
              </div>
              <span className="text-sm font-bold font-mono text-foreground tracking-tight">{fractionToTimeString(currentHourFraction)}</span>
              <span className="text-[9px] font-medium text-muted-foreground">
                {frames.length} Frame{frames.length !== 1 ? "s" : ""}
              </span>
              <span className="text-[8px] text-muted-foreground/75 mt-0.5 italic">Hover or scrub to test</span>
            </div>
          }
        </div>
      </div>

      {/* ── 24-Hour Scrubbing Slider ── */}
      <div className="w-full max-w-65 flex flex-col gap-1.5 px-2">
        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1 font-mono">
            <Sunrise className="w-3 h-3 text-sky-400" /> 06:00
          </span>
          <span className="font-mono font-semibold text-foreground text-[11px] px-1.5 py-0.2 rounded bg-muted/60">
            {fractionToTimeString(scrubFraction)}
          </span>
          <span className="flex items-center gap-1 font-mono">
            <Sunset className="w-3 h-3 text-orange-400" /> 18:00
          </span>
        </div>

        <Slider
          value={[scrubFraction * 100]}
          min={0}
          max={100}
          step={0.5}
          onValueChange={(val) => {
            const v =
              Array.isArray(val) ? val[0]
              : typeof val === "number" ? val
              : undefined;
            if (typeof v === "number") {
              setIsScrubbing(true);
              setScrubFraction(v / 100);
            }
          }}
          className="cursor-pointer"
          aria-label="Scrub 24-Hour Timeline"
        />

        <div className="flex items-center justify-between text-[9px] text-muted-foreground/80 pt-0.5">
          <span>00:00 Midnight</span>
          {isScrubbing && (
            <button
              onClick={() => {
                setIsScrubbing(false);
                setScrubFraction(currentHourFraction);
                setSelectedIndex(null);
                setHoveredIndex(null);
              }}
              className="text-[9px] text-primary hover:underline flex items-center gap-1"
            >
              <RotateCcw className="w-2.5 h-2.5" /> Reset to Now
            </button>
          )}
          <span>24:00</span>
        </div>
      </div>

      {/* ── Legend Chips ── */}
      <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
        <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-500 text-[9px] font-medium border border-amber-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
          Primary
        </span>
        <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-sky-500/10 text-sky-400 text-[9px] font-medium border border-sky-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-sky-400 inline-block" />
          Light Mode
        </span>
        <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-violet-500/10 text-violet-400 text-[9px] font-medium border border-violet-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-violet-400 inline-block" />
          Dark Mode
        </span>
        <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-muted/70 text-muted-foreground text-[9px] font-medium border border-border/50">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse inline-block" />
          Live Now
        </span>
      </div>
    </div>
  );
}
