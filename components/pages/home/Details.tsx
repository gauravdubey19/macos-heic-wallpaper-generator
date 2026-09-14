"use client";

import { Clock } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useWallpaperContext } from "@/context/WallpaperContext";
import WallpaperPreview from "./WallpaperPreview";
import PlistInspector from "./details/PlistInspector";
import TimelineDial from "./details/TimelineDial";
import WallpaperSummary from "./details/WallpaperSummary";

export default function Details() {
  const { frames } = useWallpaperContext();

  if (frames.length === 0) {
    return (
      <Card className="border border-dashed bg-muted/20">
        <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <Clock className="w-12 h-12 text-muted-foreground/30" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">No frames loaded</p>
            <p className="text-xs text-muted-foreground max-w-xs">
              Drop images on the left to activate the interactive 24-hour clock dial, Apple metadata inspector, and wallpaper summary.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div id="wallpaper-details" className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
      {/* ── Top-Left: Live Wallpaper Crossfade Preview ── */}
      <WallpaperPreview />
      {/* ── Bottom-Left: 24-Hour Timeline Dial & Time Scrubber ── */}
      <Card className="flex flex-col border border-border/60 bg-card shadow-md overflow-hidden py-0 h-fit gap-0">
        <CardHeader className="pb-2! px-4 pt-3.5 border-b border-border/40 bg-muted/20">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              24-Hour Timeline Dial
            </CardTitle>
            <Badge variant="outline" className="text-[10px] font-mono h-5 px-1.5">
              {frames.length} Frame Sequence
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-4 flex-1 flex flex-col items-center justify-center">
          <TimelineDial frames={frames} />
        </CardContent>
      </Card>
      {/* ── Top-Right: Apple Plist Inspector & Schema Explorer ── */}
      <PlistInspector frames={frames} />
      {/* ── Bottom-Right: Wallpaper Summary & System Mode Anchors ── */}
      <WallpaperSummary frames={frames} />
    </div>
  );
}
