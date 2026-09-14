/**
 * Apple Dynamic Wallpaper Metadata Utility
 *
 * Generates the Apple proprietary XMP plist structure required for macOS
 * to treat a multi-frame HEIC file as a dynamic wallpaper with 24-hour time-triggered
 * frame switching. The plist is Base64-encoded and embedded as the
 * `apple_desktop:h24` XMP tag.
 *
 * Format reference:
 *  - 24-hour time plist: { ap: { d, l }, ti: [{ i, t }] }
 *  - Appearance plist:   { ap: { d, l } }
 *  - Solar plist:        { ap: { d, l }, si: [{ a, i, z }] }
 *
 * For time-based dynamic wallpapers (where users assign clock times to frames),
 * macOS Mojave through Sequoia requires the `apple_desktop:h24` tag containing
 * the Base64-encoded plist with `ti` (time array) and `ap` (appearance dict).
 */

import type { DynamicWallpaperFrameConfig } from "./types/wallpaper";

/**
 * Maps "HH:MM" to a decimal fraction of a 24-hour day.
 * e.g. "00:00" -> 0, "06:00" -> 0.25, "12:00" -> 0.5, "18:00" -> 0.75
 */
export function timeToDayFraction(time: string): number {
  const [hoursStr, minutesStr] = time.split(":");
  const hours = parseInt(hoursStr ?? "0", 10);
  const minutes = parseInt(minutesStr ?? "0", 10);
  const fraction = (hours + minutes / 60) / 24;
  return Number(fraction.toFixed(6));
}

/**
 * Serialises the plist dictionary into Apple's XML Property List format.
 * Matches the exact structure found in working macOS dynamic wallpapers.
 */
function buildPlistXml(frames: DynamicWallpaperFrameConfig[]): string {
  // Determine appearance mode indices (defaulting to first and last when unset)
  const lightFrame = frames.find((f) => f.isLight);
  const darkFrame = frames.find((f) => f.isDark);
  const lightIdx = lightFrame?.index ?? 0;
  const darkIdx = darkFrame?.index ?? (frames.length > 1 ? frames.length - 1 : 0);

  // Sort frames chronologically by trigger time
  const sorted = [...frames].sort((a, b) => {
    return timeToDayFraction(a.time) - timeToDayFraction(b.time);
  });

  // Build time-item array matching Apple's standard plist format
  const tiItems = sorted
    .map((f) => {
      const t = timeToDayFraction(f.time);
      const tNode = t === 0 ? "<integer>0</integer>" : `<real>${t}</real>`;
      return `\t\t<dict>\n\t\t\t<key>i</key>\n\t\t\t<integer>${f.index}</integer>\n\t\t\t<key>t</key>\n\t\t\t${tNode}\n\t\t</dict>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
\t<key>ap</key>
\t<dict>
\t\t<key>d</key>
\t\t<integer>${darkIdx}</integer>
\t\t<key>l</key>
\t\t<integer>${lightIdx}</integer>
\t</dict>
\t<key>ti</key>
\t<array>
${tiItems}
\t</array>
</dict>
</plist>
`;
}

/**
 * Generates the Apple dynamic wallpaper metadata plist as a Base64 string.
 *
 * @param frames - Ordered array of frame configuration objects.
 * @returns Base64-encoded plist string ready to be embedded into the
 *          `apple_desktop:h24` XMP tag of a HEIC container.
 * @throws Error if fewer than 2 frames are provided.
 */
export function generateAppleTimePlist(frames: DynamicWallpaperFrameConfig[]): string {
  if (frames.length < 2) {
    throw new Error("At least 2 frames are required for a dynamic wallpaper.");
  }

  const xml = buildPlistXml(frames);
  return Buffer.from(xml, "utf-8").toString("base64");
}

/**
 * Re-serialises a Base64 plist string back to human-readable XML.
 * Useful for the Details / Inspector preview panel.
 */
export function decodePlistBase64(base64: string): string {
  return Buffer.from(base64, "base64").toString("utf-8");
}
