"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { decodePlistBase64, generateAppleTimePlist, timeToDayFraction } from "@/lib/appleMetadata";
import type { WallpaperFrameItem } from "@/lib/types/wallpaper";
import { Check, Clock, Code2, Copy, Download, Eye, EyeOff, FileCode, Moon, Sparkles, Star, Sun, Table as TableIcon, Terminal } from "lucide-react";
import Image from "next/image";
import React, { useMemo, useState } from "react";

interface PlistInspectorProps {
  frames: WallpaperFrameItem[];
}

// ─── Syntax Highlighter for XML Lines ─────────────────────────────────────────

function formatXmlLine(line: string): React.ReactNode {
  const trimmed = line.trim();

  // Comments & Headers
  if (trimmed.startsWith("<?xml") || trimmed.startsWith("<!DOCTYPE")) {
    return <span className="text-muted-foreground/60">{line}</span>;
  }

  // Key tag: <key>name</key>
  const keyMatch = line.match(/^(\s*)<key>(.*?)<\/key>(.*)$/);
  if (keyMatch) {
    return (
      <>
        <span>{keyMatch[1]}</span>
        <span className="text-violet-400/90">&lt;key&gt;</span>
        <span className="text-sky-300 font-semibold">{keyMatch[2]}</span>
        <span className="text-violet-400/90">&lt;/key&gt;</span>
        <span>{keyMatch[3]}</span>
      </>
    );
  }

  // Integer tag: <integer>value</integer>
  const intMatch = line.match(/^(\s*)<integer>(.*?)<\/integer>(.*)$/);
  if (intMatch) {
    return (
      <>
        <span>{intMatch[1]}</span>
        <span className="text-muted-foreground/70">&lt;integer&gt;</span>
        <span className="text-emerald-400 font-semibold">{intMatch[2]}</span>
        <span className="text-muted-foreground/70">&lt;/integer&gt;</span>
        <span>{intMatch[3]}</span>
      </>
    );
  }

  // Real tag: <real>value</real>
  const realMatch = line.match(/^(\s*)<real>(.*?)<\/real>(.*)$/);
  if (realMatch) {
    return (
      <>
        <span>{realMatch[1]}</span>
        <span className="text-muted-foreground/70">&lt;real&gt;</span>
        <span className="text-amber-400 font-semibold">{realMatch[2]}</span>
        <span className="text-muted-foreground/70">&lt;/real&gt;</span>
        <span>{realMatch[3]}</span>
      </>
    );
  }

  // Generic tag matches: <tag>, </tag>
  const tagMatch = line.match(/^(\s*)(<\/?)([a-zA-Z0-9_\-]+)(>.*)$/);
  if (tagMatch) {
    return (
      <>
        <span>{tagMatch[1]}</span>
        <span className="text-violet-400/70">{tagMatch[2]}</span>
        <span className="text-violet-300 font-medium">{tagMatch[3]}</span>
        <span className="text-violet-400/70">{tagMatch[4]}</span>
      </>
    );
  }

  return <span>{line}</span>;
}

export default function PlistInspector({ frames }: PlistInspectorProps) {
  const [activeTab, setActiveTab] = useState<"visual" | "xml">("visual");
  const [showFullXml, setShowFullXml] = useState(false);
  const [copiedXml, setCopiedXml] = useState(false);
  const [copiedBase64, setCopiedBase64] = useState(false);

  // Generate Apple Plist & Base64
  const { plistXml, base64Payload } = useMemo(() => {
    if (frames.length < 2) return { plistXml: null, base64Payload: null };
    try {
      const frameConfigs = frames.map((f) => ({
        index: f.index,
        time: f.time,
        isPrimary: f.isPrimary,
        isLight: f.isLight,
        isDark: f.isDark,
      }));
      const b64 = generateAppleTimePlist(frameConfigs);
      return {
        plistXml: decodePlistBase64(b64),
        base64Payload: b64,
      };
    } catch {
      return { plistXml: null, base64Payload: null };
    }
  }, [frames]);

  // Chronologically sorted frames
  const sortedFrames = useMemo(() => {
    return [...frames].sort((a, b) => timeToDayFraction(a.time) - timeToDayFraction(b.time));
  }, [frames]);

  const lightFrame = frames.find((f) => f.isLight);
  const darkFrame = frames.find((f) => f.isDark);
  // const primaryFrame = frames.find((f) => f.isPrimary);

  // Copy Handlers
  const handleCopyXml = async () => {
    if (!plistXml) return;
    try {
      await navigator.clipboard.writeText(plistXml);
      setCopiedXml(true);
      setTimeout(() => setCopiedXml(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleCopyBase64 = async () => {
    if (!base64Payload) return;
    try {
      await navigator.clipboard.writeText(base64Payload);
      setCopiedBase64(true);
      setTimeout(() => setCopiedBase64(false), 2000);
    } catch {
      // Fallback
    }
  };

  // Download .plist file
  const handleDownloadPlist = () => {
    if (!plistXml) return;
    const blob = new Blob([plistXml], { type: "application/x-plist" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "apple_desktop.plist";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (frames.length < 2) {
    return (
      <Card className="flex flex-col border border-border/60 bg-card shadow-md overflow-hidden">
        <CardHeader className="pb-2! px-4 pt-4 border-b border-border/40 bg-muted/20">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <FileCode className="w-4 h-4 text-primary" />
            Apple Plist Preview
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col items-center justify-center p-8 text-center text-xs text-muted-foreground gap-2">
          <Clock className="w-8 h-8 text-muted-foreground/30" />
          <p>Add at least 2 frames to inspect the generated Apple macOS dynamic wallpaper plist.</p>
        </CardContent>
      </Card>
    );
  }

  const plistLines = plistXml ? plistXml.split("\n") : [];
  const displayLines = showFullXml ? plistLines : plistLines.slice(0, 16);

  return (
    <Card className="flex flex-col border border-border/60 bg-card shadow-md overflow-hidden py-0 gap-0 h-fit">
      {/* ── Card Header with Tabs & Copy Actions ── */}
      <CardHeader className="pb-2! px-4 pt-3.5 border-b border-border/40 bg-muted/20">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
              <FileCode className="w-4 h-4 text-primary" />
              Apple Plist Preview
            </CardTitle>
            <Badge variant="secondary" className="text-[10px] font-mono h-5 px-1.5 bg-primary/10 text-primary border-primary/20">
              <Sparkles className="w-2.5 h-2.5 mr-1" />
              apple_desktop:h24
            </Badge>
          </div>

          <div className="flex items-center gap-1.5">
            <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as "visual" | "xml")}>
              <TabsList className="h-7 p-0.5 bg-muted/70">
                <TabsTrigger value="visual" className="h-6 px-2 text-[11px] gap-1 data-[state=active]:bg-background">
                  <TableIcon className="w-3 h-3" /> Visual
                </TabsTrigger>
                <TabsTrigger value="xml" className="h-6 px-2 text-[11px] gap-1 data-[state=active]:bg-background">
                  <Code2 className="w-3 h-3" /> XML
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <Tooltip>
              <TooltipTrigger>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                  onClick={handleCopyXml}
                  aria-label="Copy Plist XML"
                >
                  {copiedXml ?
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                  : <Copy className="w-3.5 h-3.5" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{copiedXml ? "Copied XML!" : "Copy XML"}</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                  onClick={handleDownloadPlist}
                  aria-label="Download .plist file"
                >
                  <Download className="w-3.5 h-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Download .plist</TooltipContent>
            </Tooltip>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0 flex-1 flex flex-col justify-between">
        {activeTab === "visual" ?
          /* ── Tab 1: Visual Plist Inspector ── */
          <div className="p-3.5 space-y-3.5 flex-1 flex flex-col justify-between text-xs">
            {/* Metadata Summary Banner */}
            <div className="grid grid-cols-3 gap-2">
              <div className="p-2 rounded-lg bg-muted/30 border border-border/40 flex flex-col">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Protocol</span>
                <span className="font-semibold text-foreground font-mono text-xs mt-0.5">h24 (Time)</span>
              </div>
              <div className="p-2 rounded-lg bg-muted/30 border border-border/40 flex flex-col">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Payload Size</span>
                <span className="font-semibold text-foreground font-mono text-xs mt-0.5">
                  {base64Payload ? `${new Blob([base64Payload]).size} B` : "—"}
                </span>
              </div>
              <div className="p-2 rounded-lg bg-muted/30 border border-border/40 flex flex-col">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Time Entries</span>
                <span className="font-semibold text-foreground font-mono text-xs mt-0.5">{frames.length} Triggers</span>
              </div>
            </div>

            {/* Apple Appearance Key (ap.l & ap.d) */}
            <div className="p-2.5 rounded-lg bg-muted/20 border border-border/40 flex items-center justify-between text-xs">
              <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Appearance Dict &lt;ap&gt;</span>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[10px] font-mono gap-1 border-sky-500/40 text-sky-400 bg-sky-500/10">
                  <Sun className="w-2.5 h-2.5" />
                  l: Frame {lightFrame ? lightFrame.index + 1 : 1}
                </Badge>
                <Badge variant="outline" className="text-[10px] font-mono gap-1 border-violet-500/40 text-violet-400 bg-violet-500/10">
                  <Moon className="w-2.5 h-2.5" />
                  d: Frame {darkFrame ? darkFrame.index + 1 : frames.length}
                </Badge>
              </div>
            </div>

            {/* Time Triggers Sequence Table */}
            <div className="flex-1 overflow-hidden border border-border/40 rounded-lg">
              <div className="bg-muted/40 px-3 py-1.5 border-b border-border/40 flex items-center justify-between text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                <span>Frame & Trigger Time</span>
                <div className="flex items-center gap-6">
                  <span>Day Fraction &lt;t&gt;</span>
                  <span>Role</span>
                </div>
              </div>

              <div className="max-h-35 overflow-y-auto divide-y divide-border/20">
                {sortedFrames.map((frame) => {
                  const frac = timeToDayFraction(frame.time);
                  return (
                    <div key={frame.id} className="px-3 py-1.5 flex items-center justify-between hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-2">
                        <div className="relative w-6 h-4 rounded-xs overflow-hidden border border-border/50 shrink-0">
                          <Image src={frame.previewUrl} alt={`Frame ${frame.index + 1}`} fill className="object-cover" sizes="24px" unoptimized />
                        </div>
                        <span className="font-mono text-xs font-semibold text-foreground">Frame {frame.index + 1}</span>
                        <span className="font-mono text-xs text-primary font-bold">@{frame.time}</span>
                      </div>

                      <div className="flex items-center gap-4">
                        <span className="font-mono text-[11px] text-muted-foreground font-medium">{frac.toFixed(6)}</span>
                        <div className="w-16 flex justify-end">
                          {frame.isPrimary ?
                            <Badge variant="outline" className="h-4 px-1 text-[8.5px] border-amber-500/40 text-amber-500 bg-amber-500/10 gap-0.5">
                              <Star className="w-2 h-2 fill-amber-500/40" /> Cover
                            </Badge>
                          : frame.isLight ?
                            <Badge variant="outline" className="h-4 px-1 text-[8.5px] border-sky-500/40 text-sky-400 bg-sky-500/10 gap-0.5">
                              <Sun className="w-2 h-2" /> Light
                            </Badge>
                          : frame.isDark ?
                            <Badge variant="outline" className="h-4 px-1 text-[8.5px] border-violet-500/40 text-violet-400 bg-violet-500/10 gap-0.5">
                              <Moon className="w-2 h-2" /> Dark
                            </Badge>
                          : <span className="text-[10px] text-muted-foreground/70 font-mono">Step</span>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick Action: Copy Base64 payload */}
            <div className="flex items-center justify-between pt-1 border-t border-border/30">
              <span className="text-[10px] text-muted-foreground">Embedded as XMP Property List in Image 0</span>
              <Button variant="outline" size="sm" className="h-6 text-[10px] gap-1 px-2 font-mono" onClick={handleCopyBase64}>
                {copiedBase64 ?
                  <Check className="w-3 h-3 text-emerald-500" />
                : <Terminal className="w-3 h-3" />}
                {copiedBase64 ? "Base64 Copied!" : "Copy Base64"}
              </Button>
            </div>
          </div>
        : /* ── Tab 2: XML Source (macOS Code Editor Window) ── */
          <div className="flex-1 flex flex-col justify-between">
            {/* macOS Window Title Bar */}
            <div className="flex items-center justify-between px-3 py-1.5 bg-muted/40 border-b border-border/40 text-[10px]">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
                <span className="font-mono text-muted-foreground ml-2">apple_desktop.plist</span>
              </div>
              <span className="text-muted-foreground/60 font-mono text-[9.5px]">{plistLines.length} lines • UTF-8</span>
            </div>

            {/* Syntax Highlighted Code Viewer */}
            <div
              className="relative flex-1 overflow-y-auto max-h-55 bg-muted/20 p-3 font-mono text-[10.5px] leading-relaxed border-b border-border/40"
              aria-label="Formatted Apple Plist XML"
            >
              {displayLines.map((line, idx) => (
                <div key={idx} className="flex hover:bg-muted/50 px-1 rounded-xs">
                  <span className="w-6 shrink-0 text-muted-foreground/35 select-none text-right pr-2 text-[10px]">{idx + 1}</span>
                  <span className="whitespace-pre overflow-x-auto">{formatXmlLine(line)}</span>
                </div>
              ))}
              {!showFullXml && plistLines.length > 16 && (
                <div className="flex items-center justify-center pt-2 text-[10px] text-muted-foreground/60 italic select-none">
                  ... {plistLines.length - 16} more lines hidden
                </div>
              )}
            </div>

            {/* Bottom Expansion Bar */}
            <div className="px-3 py-1.5 bg-muted/10 flex items-center justify-between text-[11px]">
              <span className="text-[10px] text-muted-foreground">Apple Property List DTD 1.0</span>

              {plistLines.length > 16 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-[11px] gap-1 px-2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowFullXml((v) => !v)}
                >
                  {showFullXml ?
                    <>
                      <EyeOff className="w-3 h-3" /> Compact
                    </>
                  : <>
                      <Eye className="w-3 h-3" /> Full XML
                    </>
                  }
                </Button>
              )}
            </div>
          </div>
        }
      </CardContent>
    </Card>
  );
}
