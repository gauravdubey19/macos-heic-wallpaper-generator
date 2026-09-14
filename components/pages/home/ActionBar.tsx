"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useWallpaperContext } from "@/context/WallpaperContext";
import { AlertCircle, Clock, Download, ImagePlus, X } from "lucide-react";
import { useState } from "react";
import FormModal from "./FormModal";

interface ActionBarProps {
  onAddMore: () => void;
}

export default function ActionBar({ onAddMore }: ActionBarProps) {
  const { frames, isGenerating, generationError, clearError, generateAndDownload } = useWallpaperContext();
  const [presetModalOpen, setPresetModalOpen] = useState(false);

  const hasEnoughFrames = frames.length >= 2;
  const hasLight = frames.some((f) => f.isLight);
  const hasDark = frames.some((f) => f.isDark);
  const canGenerate = hasEnoughFrames && hasLight && hasDark && !isGenerating;

  return (
    <>
      <FormModal open={presetModalOpen} onOpenChange={setPresetModalOpen} />

      <div id="wallpaper-action-bar" className="sticky bottom-0 z-20 pt-3 pb-4 bg-linear-to-t from-background via-background/95 to-transparent">
        {/* Error alert */}
        {generationError && (
          <Alert id="generation-error-alert" variant="destructive" className="mb-3 flex items-start gap-2" role="alert">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <AlertDescription className="flex-1 text-sm">{generationError}</AlertDescription>
            <Button
              id="dismiss-error-btn"
              variant="ghost"
              size="icon"
              className="h-6 w-6 -mt-1 -mr-1 shrink-0 text-destructive-foreground/70 hover:text-destructive-foreground"
              onClick={clearError}
              aria-label="Dismiss error"
            >
              <X className="h-4 w-4" />
            </Button>
          </Alert>
        )}

        {/* Validation hints */}
        {frames.length > 0 && !hasEnoughFrames && (
          <p className="text-xs text-muted-foreground text-center mb-2">
            Add at least <strong>2 images</strong> to generate a dynamic wallpaper.
          </p>
        )}

        {/* Action buttons row */}
        <div className="flex items-center gap-2">
          {/* Add more images */}
          <Button id="add-more-images-btn" variant="outline" size="sm" className="gap-2 shrink-0" onClick={onAddMore} disabled={isGenerating}>
            <ImagePlus className="w-4 h-4" />
            Add Images
          </Button>

          {/* Auto-distribute preset */}
          {frames.length >= 2 && (
            <Button
              id="auto-distribute-btn"
              variant="outline"
              size="sm"
              className="gap-2 shrink-0"
              onClick={() => setPresetModalOpen(true)}
              disabled={isGenerating}
            >
              <Clock className="w-4 h-4" />
              Auto Times
            </Button>
          )}

          {/* Spacer */}
          <div className="flex-1" />

          {/* Generate & Download */}
          <Button
            id="generate-download-btn"
            size="sm"
            className="gap-2 min-w-50 font-semibold transition-all"
            onClick={generateAndDownload}
            disabled={!canGenerate}
            aria-busy={isGenerating}
            aria-label={isGenerating ? "Generating dynamic wallpaper…" : "Generate and download dynamic wallpaper"}
          >
            {isGenerating ?
              <>
                <Spinner className="w-4 h-4" />
                Generating…
              </>
            : <>
                <Download className="w-4 h-4" />
                Generate &amp; Download
              </>
            }
          </Button>
        </div>
      </div>
    </>
  );
}
