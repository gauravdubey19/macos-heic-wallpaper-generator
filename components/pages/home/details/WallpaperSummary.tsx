"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { WallpaperFrameItem } from "@/lib/types/wallpaper";
import { CheckCircle2, HardDrive, HelpCircle, Image as ImageIcon, Layers, Monitor, Moon, Sparkles, Star, Sun } from "lucide-react";
import Image from "next/image";
import { useMemo } from "react";

interface WallpaperSummaryProps {
  frames: WallpaperFrameItem[];
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

export default function WallpaperSummary({ frames }: WallpaperSummaryProps) {
  const primaryFrame = useMemo(() => frames.find((f) => f.isPrimary) ?? frames[0], [frames]);
  const lightFrame = useMemo(() => frames.find((f) => f.isLight) ?? frames[0], [frames]);
  const darkFrame = useMemo(() => frames.find((f) => f.isDark) ?? frames[frames.length - 1], [frames]);

  // Total raw frame size
  const totalRawSize = useMemo(() => {
    return frames.reduce((acc, f) => acc + f.fileSize, 0);
  }, [frames]);

  // Dimension uniformity check
  const dimensionInfo = useMemo(() => {
    if (frames.length === 0) return "—";
    const primaryDims = primaryFrame?.dimensions;
    if (!primaryDims) return "Detecting...";

    const allMatch = frames.every((f) => f.dimensions && f.dimensions.width === primaryDims.width && f.dimensions.height === primaryDims.height);

    if (allMatch) {
      return `${primaryDims.width} × ${primaryDims.height} (Uniform)`;
    }
    return `${primaryDims.width} × ${primaryDims.height} (Auto-aligned)`;
  }, [frames, primaryFrame]);

  if (frames.length === 0) {
    return null;
  }

  return (
    <Card className="flex flex-col border border-border/60 bg-card shadow-md overflow-hidden py-0 h-fit gap-0">
      {/* ── Card Header ── */}
      <CardHeader className="px-4 py-2.5! border-b border-border/40 bg-muted/20">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Layers className="w-4 h-4 text-primary" />
            Wallpaper Summary & Specs
          </CardTitle>
          <Badge variant="outline" className="text-[10px] font-mono gap-1 text-emerald-500 border-emerald-500/30 bg-emerald-500/10">
            <CheckCircle2 className="w-3 h-3" />
            Ready (.heic)
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-2 flex-1 flex flex-col justify-between text-xs">
        {/* ── 4 Mini Spec Cards ── */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          {/* Frame Count */}
          <div className="flex flex-col p-2 rounded-lg bg-muted/30 border border-border/40">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Frames</span>
            <span className="font-semibold text-foreground text-xs flex items-center gap-1.5 mt-0.5">
              <ImageIcon className="w-3.5 h-3.5 text-primary" />
              {frames.length} Sequence Frames
            </span>
          </div>

          {/* Container Format */}
          <div className="flex flex-col p-2 rounded-lg bg-muted/30 border border-border/40">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Container</span>
            <span className="font-semibold text-foreground text-xs flex items-center gap-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              HEIC / H.265 (Apple)
            </span>
          </div>

          {/* Resolution */}
          <div className="flex flex-col p-2 rounded-lg bg-muted/30 border border-border/40">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Resolution</span>
            <span className="font-semibold text-foreground text-xs flex items-center gap-1.5 mt-0.5 font-mono truncate">
              <Monitor className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              {dimensionInfo}
            </span>
          </div>

          {/* Est. File Size */}
          <div className="flex flex-col p-2 rounded-lg bg-muted/30 border border-border/40">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Estimated Size</span>
            <span className="font-semibold text-foreground text-xs flex items-center gap-1.5 mt-0.5 font-mono">
              <HardDrive className="w-3.5 h-3.5 text-amber-500" />~{formatBytes(totalRawSize)}
            </span>
          </div>
        </div>

        <Separator className="bg-border/50" />

        {/* ── Mode Anchors Breakdown with Real Thumbnails ── */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground">macOS System Mode Anchors</span>
            <Tooltip>
              <TooltipTrigger>
                <button className="text-muted-foreground/70 hover:text-foreground">
                  <HelpCircle className="w-3.5 h-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs text-xs">
                macOS uses these anchors to determine which wallpaper frame to display in System Settings, Light Mode, and Dark Mode.
              </TooltipContent>
            </Tooltip>
          </div>

          {/* 1. Primary Anchor */}
          <div className="flex items-center justify-between p-2 rounded-lg bg-muted/25 border border-border/40 hover:bg-muted/40 transition-colors gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              {primaryFrame && (
                <div className="relative w-10 h-7 rounded-sm overflow-hidden border border-border/60 shrink-0 shadow-xs">
                  <Image src={primaryFrame.previewUrl} alt="Primary Wallpaper" fill className="object-cover" sizes="40px" unoptimized />
                </div>
              )}
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5">
                  <Star className="w-3 h-3 text-amber-500 fill-amber-500/20 shrink-0" />
                  <span className="text-xs font-semibold text-foreground truncate">Primary Cover</span>
                </div>
                <span className="text-[10px] text-muted-foreground truncate">Finder, QuickLook & System Settings thumbnail</span>
              </div>
            </div>
            <Badge variant="outline" className="text-[10px] font-mono border-amber-500/40 text-amber-500 bg-amber-500/10 shrink-0">
              Frame {primaryFrame ? primaryFrame.index + 1 : 1}
            </Badge>
          </div>

          {/* 2. Light Mode Anchor */}
          <div className="flex items-center justify-between p-2 rounded-lg bg-muted/25 border border-border/40 hover:bg-muted/40 transition-colors gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              {lightFrame && (
                <div className="relative w-10 h-7 rounded-sm overflow-hidden border border-border/60 shrink-0 shadow-xs">
                  <Image src={lightFrame.previewUrl} alt="Light Mode Wallpaper" fill className="object-cover" sizes="40px" unoptimized />
                </div>
              )}
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5">
                  <Sun className="w-3 h-3 text-sky-400 shrink-0" />
                  <span className="text-xs font-semibold text-foreground truncate">Light Appearance</span>
                </div>
                <span className="text-[10px] text-muted-foreground truncate">Active during macOS Light Mode & daytime</span>
              </div>
            </div>
            <Badge variant="outline" className="text-[10px] font-mono border-sky-500/40 text-sky-400 bg-sky-500/10 shrink-0">
              {lightFrame ? `Frame ${lightFrame.index + 1} @ ${lightFrame.time}` : "Frame 1"}
            </Badge>
          </div>

          {/* 3. Dark Mode Anchor */}
          <div className="flex items-center justify-between p-2 rounded-lg bg-muted/25 border border-border/40 hover:bg-muted/40 transition-colors gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              {darkFrame && (
                <div className="relative w-10 h-7 rounded-sm overflow-hidden border border-border/60 shrink-0 shadow-xs">
                  <Image src={darkFrame.previewUrl} alt="Dark Mode Wallpaper" fill className="object-cover" sizes="40px" unoptimized />
                </div>
              )}
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5">
                  <Moon className="w-3 h-3 text-violet-400 shrink-0" />
                  <span className="text-xs font-semibold text-foreground truncate">Dark Appearance</span>
                </div>
                <span className="text-[10px] text-muted-foreground truncate">Active during macOS Dark Mode & nighttime</span>
              </div>
            </div>
            <Badge variant="outline" className="text-[10px] font-mono border-violet-500/40 text-violet-400 bg-violet-500/10 shrink-0">
              {darkFrame ? `Frame ${darkFrame.index + 1} @ ${darkFrame.time}` : `Frame ${frames.length}`}
            </Badge>
          </div>
        </div>

        {/* ── macOS Compatibility Bar ── */}
        <div className="pt-1 border-t border-border/30 flex items-center justify-between text-[10px]">
          <span className="text-muted-foreground flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-primary" />
            Compatible with:
          </span>
          <div className="flex items-center gap-1.5 text-muted-foreground/80 font-mono text-[9px]">
            <span className="px-1.5 py-0.5 rounded bg-muted/60 border border-border/40">Sequoia 15</span>
            <span className="px-1.5 py-0.5 rounded bg-muted/60 border border-border/40">Sonoma 14</span>
            <span className="px-1.5 py-0.5 rounded bg-muted/60 border border-border/40">Ventura 13</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
