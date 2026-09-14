/**
 * HEIF Multi-Frame Dynamic Wallpaper Compiler
 *
 * Compiles a sequence of image buffers into an Apple-compliant Dynamic Wallpaper
 * (.heic) container with embedded `apple_desktop:h24` XMP metadata.
 *
 * Key Requirements for macOS Dynamic Wallpapers:
 * 1. Dimension Uniformity: All frames in the HEIC container MUST have identical
 *    pixel dimensions. Mismatched dimensions cause macOS to fall back to a static image.
 * 2. Primary Image: The designated primary image is tagged with `kCGImagePropertyPrimaryImage`
 *    so macOS Finder, QuickLook, and Wallpaper settings display the correct thumbnail.
 * 3. Metadata Tag: Time-based dynamic wallpapers require the `apple_desktop:h24` XMP tag
 *    embedded directly onto the primary image (index 0) using Apple's native
 *    `CGImageDestinationAddImageAndMetadata` ImageIO API.
 */

import path from "path";
import fs from "fs/promises";
import os from "os";
import { execFile } from "child_process";
import { promisify } from "util";
import sharp from "sharp";

const execFileAsync = promisify(execFile);

export interface CompileOptions {
  buffers: Buffer[];
  quality?: number;
  plistBase64: string;
  outputPath: string;
  primaryIndex?: number;
}

interface ImageDimension {
  width: number;
  height: number;
}

/**
 * Inspects all input image buffers and determines the optimal uniform resolution.
 * If user designated a primary frame, its resolution takes precedence.
 * Otherwise, uses the most frequently occurring resolution, or the first frame's resolution.
 */
async function determineTargetResolution(buffers: Buffer[], primaryIndex: number): Promise<{ targetWidth: number; targetHeight: number }> {
  const dimensions: ImageDimension[] = await Promise.all(
    buffers.map(async (buf) => {
      const meta = await sharp(buf).metadata();
      return {
        width: meta.width && meta.width > 0 ? meta.width : 1920,
        height: meta.height && meta.height > 0 ? meta.height : 1080,
      };
    }),
  );

  // Check if primary frame has a valid dimension
  if (primaryIndex >= 0 && primaryIndex < dimensions.length) {
    const pDim = dimensions[primaryIndex];
    if (pDim && pDim.width > 0 && pDim.height > 0) {
      return { targetWidth: pDim.width, targetHeight: pDim.height };
    }
  }

  // Count dimension frequencies
  const freqMap = new Map<string, { count: number; width: number; height: number }>();
  for (const d of dimensions) {
    const key = `${d.width}x${d.height}`;
    const existing = freqMap.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      freqMap.set(key, { count: 1, width: d.width, height: d.height });
    }
  }

  let best = dimensions[0] ?? { width: 1920, height: 1080 };
  let maxCount = 0;
  for (const item of freqMap.values()) {
    if (item.count > maxCount) {
      maxCount = item.count;
      best = { width: item.width, height: item.height };
    }
  }

  return { targetWidth: best.width, targetHeight: best.height };
}

/**
 * Normalises an image buffer into a standardised sRGB JPEG with uniform dimensions.
 * Strips obsolete metadata, applies EXIF orientation, and center-crops/scales
 * to match target dimensions if needed.
 */
async function normaliseFrameBuffer(input: Buffer, targetWidth: number, targetHeight: number): Promise<Buffer> {
  const image = sharp(input).rotate().toColorspace("srgb");
  const meta = await image.metadata();

  if (meta.width !== targetWidth || meta.height !== targetHeight) {
    image.resize(targetWidth, targetHeight, {
      fit: "cover",
      position: "center",
      withoutEnlargement: false,
    });
  }

  return image.jpeg({ quality: 96, mozjpeg: true }).toBuffer();
}

/**
 * Compiles normalised JPEG frames into an Apple-native multi-frame HEIC container
 * using Apple's ImageIO API in Swift.
 *
 * Injects `apple_desktop:h24` metadata via `CGImageDestinationAddImageAndMetadata`
 * on image 0 and tags the primary image with `kCGImagePropertyPrimaryImage`.
 */
async function compileWithNativeImageIO(
  jpegPaths: string[],
  outputPath: string,
  plistBase64: string,
  primaryIndex = 0,
  quality = 0.85,
): Promise<void> {
  const lossyQuality = Math.min(1.0, Math.max(0.1, quality / 100));

  // Generate Swift image addition code
  const imageAdds = jpegPaths
    .map((p, i) => {
      const isPrimary = i === primaryIndex;
      return `
let p${i} = "${p}"
let src${i} = CGImageSourceCreateWithURL(URL(fileURLWithPath: p${i}) as CFURL, nil)!
let img${i} = CGImageSourceCreateImageAtIndex(src${i}, 0, nil)!
var props${i}: [CFString: Any] = [
    kCGImageDestinationLossyCompressionQuality: ${lossyQuality}
]
${isPrimary ? `props${i}[kCGImagePropertyPrimaryImage] = true` : ""}
${
  i === 0 ?
    `CGImageDestinationAddImageAndMetadata(dest, img0, imageMetadata, props0 as CFDictionary)`
  : `CGImageDestinationAddImage(dest, img${i}, props${i} as CFDictionary)`
}
`;
    })
    .join("\n");

  const script = `
import Foundation
import ImageIO
import CoreGraphics

let outputPath = "${outputPath}"
let plistBase64 = "${plistBase64}"

guard let dest = CGImageDestinationCreateWithURL(
    URL(fileURLWithPath: outputPath) as CFURL,
    "public.heic" as CFString,
    ${jpegPaths.length},
    nil
) else {
    fputs("Error: Failed to create CGImageDestination for public.heic\\n", stderr)
    exit(1)
}

// ── Prepare Apple Dynamic Wallpaper Metadata (apple_desktop:h24) ──
let imageMetadata = CGImageMetadataCreateMutable()
guard CGImageMetadataRegisterNamespaceForPrefix(
    imageMetadata,
    "http://ns.apple.com/namespace/1.0/" as CFString,
    "apple_desktop" as CFString,
    nil
) else {
    fputs("Error: Failed to register apple_desktop namespace\\n", stderr)
    exit(1)
}

guard let tag = CGImageMetadataTagCreate(
    "http://ns.apple.com/namespace/1.0/" as CFString,
    "apple_desktop" as CFString,
    "h24" as CFString,
    .string,
    plistBase64 as CFTypeRef
) else {
    fputs("Error: Failed to create apple_desktop:h24 metadata tag\\n", stderr)
    exit(1)
}

guard CGImageMetadataSetTagWithPath(
    imageMetadata,
    nil,
    "apple_desktop:h24" as CFString,
    tag
) else {
    fputs("Error: Failed to set apple_desktop:h24 tag on metadata\\n", stderr)
    exit(1)
}

// ── Add Frames to Container ──
${imageAdds}

// ── Finalize HEIC Container ──
let success = CGImageDestinationFinalize(dest)
if !success {
    fputs("Error: CGImageDestinationFinalize failed to write HEIC container\\n", stderr)
    exit(1)
}
exit(0)
`;

  const scriptPath = path.join(os.tmpdir(), `heic-compile-${Date.now()}-${Math.random().toString(36).slice(2)}.swift`);
  await fs.writeFile(scriptPath, script, "utf-8");

  try {
    await execFileAsync("swift", [scriptPath], { timeout: 120000 });
  } finally {
    await fs.unlink(scriptPath).catch(() => undefined);
  }
}

/**
 * Compiles a multi-frame HEIC dynamic wallpaper from an ordered array of image Buffers.
 *
 * 1. Automatically normalises all frames to a uniform resolution.
 * 2. Compiles frames into a HEIC container via Apple's native ImageIO framework in Swift.
 * 3. Natively embeds the Apple `apple_desktop:h24` XMP property list.
 * 4. Marks the user's chosen primary frame as the container's Primary Image.
 */
export async function compileHeicWallpaper(options: CompileOptions): Promise<void> {
  const { buffers, quality = 85, plistBase64, outputPath, primaryIndex = 0 } = options;

  if (!buffers || buffers.length < 2) {
    throw new Error("At least 2 image buffers are required to compile a dynamic wallpaper.");
  }

  const tmpDir = os.tmpdir();
  const sessionId = `heic-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const tempFiles: string[] = [];

  try {
    // 1. Determine uniform target resolution across all frames
    const { targetWidth, targetHeight } = await determineTargetResolution(buffers, primaryIndex);

    // 2. Normalise and write each frame to a temporary JPEG
    const jpegPaths: string[] = [];
    for (let i = 0; i < buffers.length; i++) {
      const buf = buffers[i];
      if (!buf) throw new Error(`Missing buffer at index ${i}`);

      const normalised = await normaliseFrameBuffer(buf, targetWidth, targetHeight);
      const jpegPath = path.join(tmpDir, `${sessionId}-frame-${i}.jpg`);
      await fs.writeFile(jpegPath, normalised);
      jpegPaths.push(jpegPath);
      tempFiles.push(jpegPath);
    }

    // 3. Compile via Apple ImageIO Swift script with native apple_desktop:h24 metadata
    await compileWithNativeImageIO(jpegPaths, outputPath, plistBase64, primaryIndex, quality);
  } finally {
    // Clean up temporary frame files
    for (const f of tempFiles) {
      await fs.unlink(f).catch(() => undefined);
    }
  }
}
