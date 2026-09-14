"use client";

import React from "react";
import Image from "next/image";
import { ChevronUp, ChevronDown, Trash2, Star, Sun, Moon, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { useWallpaperContext } from "@/context/WallpaperContext";
import { cn } from "@/lib/utils";
import type { WallpaperFrameItem } from "@/lib/types/wallpaper";

// ─── Frame Row ────────────────────────────────────────────────────────────────

interface FrameRowProps {
  frame: WallpaperFrameItem;
  isFirst: boolean;
  isLast: boolean;
}

function FrameRow({ frame, isFirst, isLast }: FrameRowProps) {
  const { removeFrame, moveFrameUp, moveFrameDown, updateFrameTime, setPrimary, setLight, setDark } = useWallpaperContext();

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Card
      id={`wallpaper-frame-${frame.index}`}
      className={cn(
        "group relative overflow-hidden transition-all duration-200",
        "border border-border/60 bg-card hover:border-border hover:shadow-md",
        frame.isPrimary && "ring-1 ring-primary/40",
      )}
    >
      <CardContent className="p-0">
        <div className="flex items-stretch gap-0">
          {/* ── Reorder Controls ── */}
          <div className="flex flex-col items-center justify-center gap-1 px-2 py-3 bg-muted/30 border-r border-border/40">
            <span className="text-[10px] font-mono font-semibold text-muted-foreground/70 w-5 text-center">{frame.index + 1}</span>
            <Tooltip>
              <TooltipTrigger>
                <Button
                  id={`frame-move-up-${frame.index}`}
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 hover:bg-muted"
                  disabled={isFirst}
                  onClick={() => moveFrameUp(frame.id)}
                  aria-label={`Move frame ${frame.index + 1} up`}
                >
                  <ChevronUp className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Move up</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger>
                <Button
                  id={`frame-move-down-${frame.index}`}
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 hover:bg-muted"
                  disabled={isLast}
                  onClick={() => moveFrameDown(frame.id)}
                  aria-label={`Move frame ${frame.index + 1} down`}
                >
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Move down</TooltipContent>
            </Tooltip>
          </div>

          {/* ── Thumbnail ── */}
          <div className="relative flex-shrink-0 w-24 h-[88px] bg-muted overflow-hidden">
            <Image src={frame.previewUrl} alt={frame.fileName} fill className="object-cover" sizes="96px" unoptimized />
            {/* Frame info overlay */}
            <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[10px] text-center py-0.5 font-mono">
              {frame.dimensions ? `${frame.dimensions.width}×${frame.dimensions.height}` : (frame.fileName.split(".").pop()?.toUpperCase() ?? "IMG")}
            </div>
          </div>

          {/* ── Info & Controls ── */}
          <div className="flex-1 flex flex-col justify-between px-4 py-3 min-w-0">
            {/* Top row: filename + badges */}
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground truncate max-w-[200px]" title={frame.fileName}>
                  {frame.fileName}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">{formatFileSize(frame.fileSize)}</p>
              </div>

              {/* Active mode badges */}
              <div className="flex items-center gap-1 flex-shrink-0">
                {frame.isPrimary && (
                  <Badge
                    variant="secondary"
                    className="h-5 px-1.5 text-[10px] bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800"
                  >
                    <Star className="w-2.5 h-2.5 mr-0.5" />
                    Primary
                  </Badge>
                )}
                {frame.isLight && (
                  <Badge
                    variant="secondary"
                    className="h-5 px-1.5 text-[10px] bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400 border-sky-200 dark:border-sky-800"
                  >
                    <Sun className="w-2.5 h-2.5 mr-0.5" />
                    Light
                  </Badge>
                )}
                {frame.isDark && (
                  <Badge
                    variant="secondary"
                    className="h-5 px-1.5 text-[10px] bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400 border-violet-200 dark:border-violet-800"
                  >
                    <Moon className="w-2.5 h-2.5 mr-0.5" />
                    Dark
                  </Badge>
                )}
              </div>
            </div>

            {/* Bottom row: Time input + mode toggles + delete */}
            <div className="flex items-center gap-3 mt-2">
              {/* Time picker */}
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                <Input
                  id={`frame-time-${frame.index}`}
                  type="time"
                  value={frame.time}
                  onChange={(e) => updateFrameTime(frame.id, e.target.value)}
                  className="h-7 w-28 text-xs font-mono px-2"
                  aria-label={`Trigger time for frame ${frame.index + 1}`}
                />
              </div>

              <Separator orientation="vertical" className="h-5" />

              {/* Mode toggle buttons */}
              <div className="flex items-center gap-1">
                <Tooltip>
                  <TooltipTrigger>
                    <Button
                      id={`frame-primary-${frame.index}`}
                      variant={frame.isPrimary ? "default" : "ghost"}
                      size="icon"
                      className={cn(
                        "h-7 w-7",
                        frame.isPrimary ?
                          "bg-amber-500 hover:bg-amber-600 text-white"
                        : "hover:bg-amber-50 dark:hover:bg-amber-900/20 hover:text-amber-600",
                      )}
                      onClick={() => setPrimary(frame.id)}
                      aria-label={`Set frame ${frame.index + 1} as primary thumbnail`}
                      aria-pressed={frame.isPrimary}
                    >
                      <Star className="w-3.5 h-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Primary thumbnail</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger>
                    <Button
                      id={`frame-light-${frame.index}`}
                      variant={frame.isLight ? "default" : "ghost"}
                      size="icon"
                      className={cn(
                        "h-7 w-7",
                        frame.isLight ? "bg-sky-500 hover:bg-sky-600 text-white" : "hover:bg-sky-50 dark:hover:bg-sky-900/20 hover:text-sky-600",
                      )}
                      onClick={() => setLight(frame.id)}
                      aria-label={`Set frame ${frame.index + 1} as light mode default`}
                      aria-pressed={frame.isLight}
                    >
                      <Sun className="w-3.5 h-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Light mode default</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger>
                    <Button
                      id={`frame-dark-${frame.index}`}
                      variant={frame.isDark ? "default" : "ghost"}
                      size="icon"
                      className={cn(
                        "h-7 w-7",
                        frame.isDark ?
                          "bg-violet-600 hover:bg-violet-700 text-white"
                        : "hover:bg-violet-50 dark:hover:bg-violet-900/20 hover:text-violet-600",
                      )}
                      onClick={() => setDark(frame.id)}
                      aria-label={`Set frame ${frame.index + 1} as dark mode default`}
                      aria-pressed={frame.isDark}
                    >
                      <Moon className="w-3.5 h-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Dark mode default</TooltipContent>
                </Tooltip>
              </div>

              {/* Spacer */}
              <div className="flex-1" />

              {/* Delete */}
              <Tooltip>
                <TooltipTrigger>
                  <Button
                    id={`frame-delete-${frame.index}`}
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removeFrame(frame.id)}
                    aria-label={`Remove frame ${frame.index + 1}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Remove frame</TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── DataList ─────────────────────────────────────────────────────────────────

export default function DataList() {
  const { frames } = useWallpaperContext();

  if (frames.length === 0) return null;

  return (
    <div id="wallpaper-frame-list" className="flex flex-col gap-2" role="list" aria-label="Wallpaper frame sequence">
      {frames.map((frame, i) => (
        <div key={frame.id} role="listitem">
          <FrameRow frame={frame} isFirst={i === 0} isLast={i === frames.length - 1} />
        </div>
      ))}
    </div>
  );
}
