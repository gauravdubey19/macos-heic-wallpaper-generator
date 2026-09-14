"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useWallpaperContext } from "@/context/WallpaperContext";
import { cn } from "@/lib/utils";
import { ImageIcon, Upload } from "lucide-react";
import React, { useCallback, useRef, useState } from "react";

interface DropZoneProps {
  className?: string;
}

const ACCEPTED_TYPES = ["image/png", "image/jpeg"];

export default function DropZone({ className }: DropZoneProps) {
  const { addFiles } = useWallpaperContext();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;
      const accepted = Array.from(files).filter((f) => ACCEPTED_TYPES.includes(f.type));
      if (accepted.length > 0) {
        await addFiles(accepted);
      }
    },
    [addFiles],
  );

  const onDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const onDrop = useCallback(
    async (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      await handleFiles(e.dataTransfer.files);
    },
    [handleFiles],
  );

  const onInputChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      await handleFiles(e.target.files);
      // Reset so the same files can be re-added if needed
      e.target.value = "";
    },
    [handleFiles],
  );

  return (
    <Card
      id="wallpaper-drop-zone"
      className={cn(
        "relative flex flex-col items-center justify-center gap-5 border-2 border-dashed rounded-2xl p-12 cursor-pointer transition-all duration-200 select-none group",
        isDragging ? "border-primary bg-primary/5 scale-[1.01]" : "border-border bg-card hover:border-primary/60 hover:bg-primary/[0.02]",
        className,
      )}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onClick={() => inputRef.current?.click()}
      role="button"
      aria-label="Drop images here or click to select"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
      }}
    >
      {/* Hidden file input */}
      <input
        ref={inputRef}
        id="wallpaper-file-input"
        type="file"
        multiple
        accept="image/png,image/jpeg"
        className="sr-only"
        onChange={onInputChange}
        aria-hidden="true"
      />

      {/* Animated icon */}
      <div
        className={cn(
          "relative flex items-center justify-center w-20 h-20 rounded-2xl transition-all duration-300",
          isDragging ?
            "bg-primary text-primary-foreground shadow-lg shadow-primary/30 scale-110"
          : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary",
        )}
      >
        {isDragging ?
          <Upload className="w-9 h-9 animate-bounce" aria-hidden="true" />
        : <ImageIcon className="w-9 h-9" aria-hidden="true" />}
      </div>

      {/* Labels */}
      <div className="flex flex-col items-center gap-1 text-center">
        <p className="text-lg font-semibold text-foreground">{isDragging ? "Release to add images" : "Drop images here"}</p>
        <p className="text-sm text-muted-foreground">PNG, JPG or JPEG supported &mdash; select multiple for a sequence</p>
      </div>

      <Button id="wallpaper-browse-btn" variant="outline" size="sm" className="pointer-events-none gap-2" tabIndex={-1} aria-hidden="true">
        <Upload className="w-4 h-4" aria-hidden="true" />
        Browse files
      </Button>
    </Card>
  );
}
