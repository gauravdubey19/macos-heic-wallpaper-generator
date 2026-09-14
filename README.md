# macOS Dynamic Wallpaper Creator (.heic)

A local web studio and compiler for generating Apple-compliant **Dynamic Wallpapers** (`.heic`). Drop a sequence of images, assign clock times or appearance modes, preview transitions in real time, and compile a production-ready dynamic `.heic` container ready for macOS.

Compatible with **macOS Mojave through macOS Sequoia (15.x)**.

---

## ✨ Features

- **Multi-Frame Sequence Studio**: Drag and drop any combination of images (JPEG, PNG, WebP, AVIF, HEIC). Reorder frames via intuitive controls and assign precise trigger times.
- **Auto-Distribution Presets**:
  - **Equal 24h Spread**: Evenly distributes frames across a full 24-hour cycle.
  - **Day / Night Bimodal**: Concentrations of daytime frames (06:00–18:00) and nighttime frames (18:00–06:00).
  - **Sunrise / Sunset Curve**: Concentrates transitions around dawn and dusk hours.
- **macOS Mode Anchors**:
  - ⭐ **Primary Cover**: Designates `kCGImagePropertyPrimaryImage` for Finder thumbnails and System Settings.
  - ☀️ **Light Mode Appearance**: The default frame displayed when macOS is set to Light Appearance (`ap.l`).
  - 🌙 **Dark Mode Appearance**: The default frame displayed when macOS is set to Dark Appearance (`ap.d`).
- **Interactive Live Preview Canvas**:
  - Smooth dual-slot crossfade transitions simulating macOS desktop wallpaper shifts.
  - Tempo slider (0.5s to 8.0s) with proportional fade curves.
  - Quick presets (1s Fast, 2.5s Normal, 5s Cinematic).
  - Step navigation, play/pause controls, and frame dot markers.
- **24-Hour Solar Timeline Dial**:
  - Circular SVG solar clock with celestial anchors: `00:00` (Midnight), `06:00` (Dawn), `12:00` (Solar Noon), and `18:00` (Dusk).
  - Luminous Day (sky-to-amber) and Night (twilight-to-midnight) gradient tracks.
  - Real-time live system clock indicator.
  - Interactive center hub displaying miniature frame previews, active time spans, and role tags.
  - 24-hour horizontal scrubber to test wallpaper appearance at any exact minute of the day.
- **Apple Plist Inspector & Schema Explorer**:
  - **Visual Inspector**: Live table of Apple decimal day fractions (`<t>`), appearance mappings, and payload size.
  - **XML Source Viewer**: Formatted macOS code window with syntax highlighting, line numbers, and one-click **"Copy XML"**, **"Copy Base64"**, or **"Download .plist"**.
- **Auto-Resolution Alignment**:
  - Automatically detects resolution differences across input images and normalizes them to the primary frame's resolution using Sharp (`cover` + `center`), preventing macOS from rejecting the dynamic container.
- **Dual-Engine Native Compilation**:
  - **Primary (Native macOS)**: Uses Apple's native `ImageIO` and `CoreGraphics` frameworks via an embedded Swift compiler to embed the `apple_desktop:h24` XMP dictionary directly onto image properties.
  - **Secondary (Cross-Platform Fallback)**: Multi-frame Sharp HEIF compilation paired with `exiftool-vendored` via a custom `.ExifTool_config`.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router, Turbopack)
- **Frontend**: React 19, TypeScript (Strict Mode)
- **Styling**: [TailwindCSS](https://tailwindcss.com/), CSS Theme Variables (Dark Mode by default)
- **UI Components**: [shadcn/ui](https://ui.shadcn.com/) primitives (`@base-ui/react`, Lucide Icons)
- **Image Processing**:
  - [Sharp](https://sharp.pixelplumbing.com/) (image validation, auto-normalization, and aspect-ratio alignment)
  - Native **Swift** (`ImageIO`, `CoreGraphics`, `CGImageDestination`)
  - [ExifTool Vendored](https://github.com/photostructure/exiftool-vendored.js) (cross-platform fallback)

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: `v18.17.0` or later
- **Operating System**:
  - **macOS** (recommended): Enables native Swift `ImageIO` compilation with zero external setup.
  - **Linux / Windows**: Supported via the fallback Sharp + ExifTool pipeline.

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/heic-wallpaper.git
   cd heic-wallpaper
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

---

## 📖 How It Works

### The Apple Dynamic Wallpaper Standard

macOS Dynamic Desktop does not use video files or animated GIFs. Instead, it reads a standard multi-frame **HEIC (HEIF)** container with an embedded Apple proprietary XML Property List stored in the `apple_desktop:h24` (or `apple_desktop:solar`) XMP tag:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <!-- Appearance Mode Mapping -->
  <key>ap</key>
  <dict>
    <key>l</key>
    <integer>0</integer> <!-- Index of Light Mode frame -->
    <key>d</key>
    <integer>2</integer> <!-- Index of Dark Mode frame -->
  </dict>
  <!-- 24-Hour Time Schedule -->
  <key>ti</key>
  <array>
    <dict>
      <key>i</key>
      <integer>0</integer> <!-- Frame Index -->
      <key>t</key>
      <real>0.25</real>   <!-- 06:00 AM (0.25 of 24 hours) -->
    </dict>
    <dict>
      <key>i</key>
      <integer>1</integer>
      <key>t</key>
      <real>0.5</real>    <!-- 12:00 PM (0.50 of 24 hours) -->
    </dict>
    <dict>
      <key>i</key>
      <integer>2</integer>
      <key>t</key>
      <real>0.833333</real> <!-- 20:00 PM (0.833 of 24 hours) -->
    </dict>
  </array>
</dict>
</plist>
```

This XML is converted to a clean Base64 payload and embedded into the primary image's XMP metadata dictionary alongside the `kCGImagePropertyPrimaryImage` flag.

---

## 🖥️ How to Apply on macOS

Once your `.heic` file is compiled and downloaded:

1. **Option 1: Context Menu (Quick)**
   - Right-click the downloaded `.heic` file in Finder.
   - Select **Services** (or directly) **Set Desktop Picture**.

2. **Option 2: System Settings (Full Dynamic Mode)**
   - Open **System Settings** $\to$ **Wallpaper**.
   - Click **Add Folder...** or **Add Photo...** and select your generated `.heic` file.
   - Choose **Dynamic** from the dropdown menu at the top of the preview.
   - macOS will now transition automatically based on your local clock time and appearance settings!

---

## 📁 Project Structure

```
heic-wallpaper/
├── app/
│   ├── api/
│   │   └── generate-wallpaper/
│   │       └── route.ts         # Server route: receives frames & triggers compilation
│   ├── globals.css              # Global design system & theme variables
│   ├── layout.tsx               # Root layout & ThemeProvider
│   └── page.tsx                 # Thin shell entry point
├── components/
│   ├── pages/
│   │   └── home/
│   │       ├── ActionBar.tsx        # Bottom download & action trigger bar
│   │       ├── DataList.tsx         # Drag-and-drop frame list & sequence reorderer
│   │       ├── Details.tsx          # 2x2 grid orchestrator for sidebar inspectors
│   │       ├── DropZone.tsx         # File upload target with multi-format support
│   │       ├── FormModal.tsx        # Auto-distribution modal
│   │       ├── MainPage.tsx         # Primary orchestrator
│   │       ├── WallpaperPreview.tsx # Live crossfade player & tempo controls
│   │       └── details/
│   │           ├── PlistInspector.tsx   # Visual & XML metadata explorer
│   │           ├── TimelineDial.tsx     # 24-hour circular solar dial & scrubber
│   │           └── WallpaperSummary.tsx # Container specs & macOS mode anchors
│   ├── ui/                          # shadcn/ui design primitives
│   └── ThemeToggle.tsx              # Dark / Light theme switch
├── context/
│   └── WallpaperContext.tsx     # Unified state management & compiler API hooks
├── lib/
│   ├── appleMetadata.ts         # Apple plist XML serializer & Base64 encoder
│   ├── heifCompiler.ts          # Native Swift & Sharp compilation pipeline
│   └── types/
│       └── wallpaper.ts         # Shared TypeScript contracts & interfaces
└── .ExifTool_config             # Custom ExifTool XMP schema definitions
```

---

## ⚙️ Build & Quality Scripts

```bash
# Start Next.js local development server
npm run dev

# Run TypeScript typecheck (zero 'any' tolerance)
npx tsc --noEmit

# Create optimized production build
npm run build

# Start production server
npm run start
```

---

## 📄 License

MIT License. Feel free to use, modify, and distribute for personal or commercial projects.
