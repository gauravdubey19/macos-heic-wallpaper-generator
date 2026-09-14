import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";
import os from "os";
import { generateAppleTimePlist } from "@/lib/appleMetadata";
import { compileHeicWallpaper } from "@/lib/heifCompiler";
import type { DynamicWallpaperFrameConfig } from "@/lib/types/wallpaper";

export const runtime = "nodejs";
export const maxDuration = 120;

/**
 * Raise the Next.js request body size limit for this route.
 * Default is 4 MB — wallpaper sets can easily exceed this.
 */
export const dynamic = "force-dynamic";

/**
 * Parses and validates the incoming multipart FormData.
 * Returns ordered image Buffers and the frame configuration array.
 */
async function parseFormData(request: NextRequest): Promise<{ buffers: Buffer[]; frames: DynamicWallpaperFrameConfig[] }> {
  const formData = await request.formData();

  // Parse configuration JSON
  const configRaw = formData.get("config");
  if (!configRaw || typeof configRaw !== "string") {
    throw new Error('Missing or invalid "config" JSON field in FormData.');
  }

  let frames: DynamicWallpaperFrameConfig[];
  try {
    frames = JSON.parse(configRaw) as DynamicWallpaperFrameConfig[];
  } catch {
    throw new Error('Could not parse "config" as JSON.');
  }

  if (!Array.isArray(frames) || frames.length < 2) {
    throw new Error("At least 2 frames are required for a dynamic wallpaper.");
  }

  // Validate each frame config
  for (const frame of frames) {
    if (typeof frame.index !== "number" || typeof frame.time !== "string" || !/^\d{2}:\d{2}$/.test(frame.time)) {
      throw new Error(`Invalid frame config at index ${frame.index}: time must be "HH:MM".`);
    }
  }

  // Extract and order image buffers by frame index
  const buffers: Buffer[] = [];
  for (let i = 0; i < frames.length; i++) {
    const fileEntry = formData.get(`image_${i}`);
    if (!fileEntry || !(fileEntry instanceof File)) {
      throw new Error(`Missing image file for frame index ${i} ("image_${i}").`);
    }

    const arrayBuffer = await fileEntry.arrayBuffer();
    buffers.push(Buffer.from(arrayBuffer));
  }

  return { buffers, frames };
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const sessionId = `wallpaper-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const outputPath = path.join(os.tmpdir(), `${sessionId}.heic`);

  try {
    // --- Parse & validate incoming FormData ---
    const { buffers, frames } = await parseFormData(request);

    // --- Generate Apple Dynamic Wallpaper plist ---
    const plistBase64 = generateAppleTimePlist(frames);

    // Find designated primary frame index
    const primaryIndex = frames.findIndex((f) => f.isPrimary);
    const resolvedPrimary = primaryIndex >= 0 ? primaryIndex : 0;

    // --- Compile multi-frame HEIC with metadata injection ---
    await compileHeicWallpaper({
      buffers,
      quality: 85,
      plistBase64,
      outputPath,
      primaryIndex: resolvedPrimary,
    });

    // --- Read compiled file and stream response ---
    const fileBuffer = await fs.readFile(outputPath);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": "image/heic",
        "Content-Disposition": 'attachment; filename="dynamic_wallpaper.heic"',
        "Content-Length": String(fileBuffer.length),
        "Cache-Control": "no-store",
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "An unexpected error occurred.";
    console.error("[generate-wallpaper] Error:", message);

    return NextResponse.json({ error: message }, { status: 400 });
  } finally {
    // Always clean up the temp output file
    await fs.unlink(outputPath).catch(() => undefined);
  }
}
