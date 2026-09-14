"use client";

import { ThemeToggle } from "@/components/ThemeToggle";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useWallpaperContext } from "@/context/WallpaperContext";
import { Layers, Sparkles } from "lucide-react";
import ActionBar from "./ActionBar";
import DataList from "./DataList";
import Details from "./Details";
import DropZone from "./DropZone";
import WallpaperPreview from "./WallpaperPreview";

export default function MainPage() {
  const { frames } = useWallpaperContext();

  // Trigger the hidden file input in DropZone via a ref callback
  const handleAddMore = () => {
    const dropZoneInput = document.getElementById("wallpaper-file-input") as HTMLInputElement | null;
    dropZoneInput?.click();
  };

  return (
    <div className="flex flex-col flex-1 min-h-screen bg-background">
      {/* ── Header ── */}
      <header className="border-b border-border/60 bg-card/60 backdrop-blur-sm sticky top-0 z-30">
        <div className="max-w-8xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/30">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground leading-none">Dynamic Wallpaper Creator</h1>
              <p className="text-xs text-muted-foreground mt-0.5">macOS HEIC multi-frame generator</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs gap-1.5 bg-primary/10 text-primary border-primary/20">
              <Sparkles className="w-3 h-3" />
              apple_desktop:h24
            </Badge>
            {frames.length > 0 && (
              <Badge variant="outline" className="text-xs font-mono">
                {frames.length} frame{frames.length !== 1 ? "s" : ""}
              </Badge>
            )}
            <Separator orientation="vertical" className="h-4 mx-1" />
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* ── Main content ── */}
      <main className="flex-1 max-w-8xl mx-auto w-full px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_900px] gap-8 items-start">
          {/* ── Left: Editor ── */}
          <div className="flex flex-col gap-5 pb-32">
            {/* Drop zone — always visible for adding more */}
            <section aria-label="Add images">
              <DropZone />
            </section>

            {/* Divider when frames exist */}
            {frames.length > 0 && (
              <>
                <div className="flex items-center gap-3">
                  <Separator className="flex-1" />
                  <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Frame sequence</span>
                  <Separator className="flex-1" />
                </div>

                {/* Mobile Preview when frames exist */}
                <div className="lg:hidden">
                  <WallpaperPreview />
                </div>

                {/* Frame list */}
                <section aria-label="Frame sequence editor">
                  <DataList />
                </section>
              </>
            )}

            {/* Sticky action bar */}
            <ActionBar onAddMore={handleAddMore} />
          </div>

          {/* ── Right: Preview & Details sidebar ── */}
          <aside className="hidden lg:flex lg:flex-col gap-5 sticky top-24 self-start" aria-label="Wallpaper details and live preview">
            <Details />
          </aside>
        </div>
      </main>
    </div>
  );
}
