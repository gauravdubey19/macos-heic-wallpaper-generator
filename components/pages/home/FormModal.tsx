"use client";

import React, { useState } from "react";
import { Clock, Sunrise, Layers } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useWallpaperContext } from "@/context/WallpaperContext";
import { cn } from "@/lib/utils";
import type { TimeDistributionPreset } from "@/lib/types/wallpaper";

// ─── Preset Definition ────────────────────────────────────────────────────────

interface PresetOption {
  id: TimeDistributionPreset;
  label: string;
  description: string;
  timeRange: string;
  icon: React.ElementType;
  gradient: string;
}

const PRESETS: PresetOption[] = [
  {
    id: "equalSpread",
    label: "24-Hour Equal Spread",
    description: "Distributes frames evenly across all 24 hours, starting at midnight.",
    timeRange: "00:00 → 23:xx",
    icon: Clock,
    gradient: "from-indigo-500/10 to-purple-500/10 hover:from-indigo-500/20 hover:to-purple-500/20",
  },
  {
    id: "dayNightBimodal",
    label: "Day / Night Bi-modal",
    description: "Splits frames into day images (06:00–18:00) and night images (18:00+).",
    timeRange: "06:00 / 18:00",
    icon: Layers,
    gradient: "from-amber-500/10 to-violet-500/10 hover:from-amber-500/20 hover:to-violet-500/20",
  },
  {
    id: "sunriseSunset",
    label: "Sunrise to Sunset",
    description: "Maps all frames linearly from 05:00 (dawn) to 20:00 (dusk).",
    timeRange: "05:00 → 20:00",
    icon: Sunrise,
    gradient: "from-orange-500/10 to-pink-500/10 hover:from-orange-500/20 hover:to-pink-500/20",
  },
];

// ─── FormModal ────────────────────────────────────────────────────────────────

interface FormModalProps {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
}

export default function FormModal({ open, onOpenChange }: FormModalProps) {
  const { autoDistributeTimes, frames } = useWallpaperContext();
  const [selected, setSelected] = useState<TimeDistributionPreset>("equalSpread");

  const handleApply = () => {
    autoDistributeTimes(selected);
    onOpenChange?.(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent id="timeline-config-modal" className="sm:max-w-[480px]" aria-describedby="timeline-config-description">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            Quick Timeline Configuration
          </DialogTitle>
          <DialogDescription id="timeline-config-description">
            Choose a preset to automatically distribute trigger times across your <strong>{frames.length}</strong> frame
            {frames.length !== 1 ? "s" : ""}. You can fine-tune each time individually afterward.
          </DialogDescription>
        </DialogHeader>

        {/* Preset options */}
        <div className="flex flex-col gap-3 py-2">
          {PRESETS.map((preset) => {
            const Icon = preset.icon;
            const isSelected = selected === preset.id;

            return (
              <Card
                key={preset.id}
                id={`preset-${preset.id}`}
                className={cn(
                  "cursor-pointer border-2 transition-all duration-150 bg-gradient-to-br",
                  preset.gradient,
                  isSelected ? "border-primary shadow-sm shadow-primary/20" : "border-transparent hover:border-border",
                )}
                onClick={() => setSelected(preset.id)}
                role="radio"
                aria-checked={isSelected}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") setSelected(preset.id);
                }}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        "flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-lg transition-colors",
                        isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                      )}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-sm font-semibold text-foreground">{preset.label}</p>
                        <Badge variant="outline" className="text-[10px] font-mono h-4 px-1.5">
                          {preset.timeRange}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">{preset.description}</p>
                    </div>
                    {/* Selection indicator */}
                    <div
                      className={cn(
                        "flex-shrink-0 w-4 h-4 rounded-full border-2 mt-0.5 transition-colors",
                        isSelected ? "border-primary bg-primary" : "border-muted-foreground/40",
                      )}
                    >
                      {isSelected && (
                        <div className="w-full h-full rounded-full flex items-center justify-center">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary-foreground" />
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <DialogFooter className="gap-2">
          <Button id="preset-cancel-btn" variant="ghost" onClick={() => onOpenChange?.(false)}>
            Cancel
          </Button>
          <Button id="preset-apply-btn" onClick={handleApply} disabled={frames.length === 0} className="gap-2">
            <Clock className="w-4 h-4" />
            Apply Preset
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
