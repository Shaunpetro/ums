# UMS Asset Inventory and Build Instructions

Path: assets/README.md
Rule 41: All assets are built from SVG sources in `assets/source/`.
Rule 43: kebab-case filenames only.

---

## Tools required

- Inkscape (`winget install Inkscape.Inkscape`)
- ImageMagick (`winget install ImageMagick.ImageMagick`)
- Node.js 20 LTS + Tauri CLI (already required for the app)

Verify:
& "C:\Program Files\Inkscape\bin\inkscape.exe" --version
magick --version

text

Both must return version strings.

---

## Why Inkscape CLI instead of rsvg-convert

Inkscape 1.4.4's Windows installer does NOT ship `rsvg-convert.exe`. That tool belongs to librsvg and was dropped from Inkscape distributions starting with the 1.x series. Use `inkscape.exe --export-type=png --export-width=N --export-filename=PATH` instead. This is the native supported path for Inkscape 1.x and works identically across Windows, macOS, and Linux builds.

The wrapper script `assets/render.ps1` codifies every export below. Run it whenever sources change. Do not hand-run individual exports unless debugging.

---

## Render all assets
.\assets\render.ps1

text

Outputs:

- `src-tauri/icons/tray-16.png` (committed, rule 3 exception)
- `src-tauri/icons/tray-32.png` (committed, rule 3 exception)
- `assets/generated/*.png` (gitignored, build artifacts)

For the full Tauri icon set (.ico, .icns, multi-size .png) use the Tauri CLI:
npx tauri icon assets/source/app/icon.svg

text

Output goes to `src-tauri/icons/` (committed, rule 3 exception).

---

## Build commands by asset type (reference)

These are the exact commands the wrapper script runs.

### App icon preview (256x256)
& "C:\Program Files\Inkscape\bin\inkscape.exe" assets/source/app/icon.svg --export-type=png --export-filename="$env:TEMP\ums-icon-preview.png" --export-width=256

text

### Tray icons
& "C:\Program Files\Inkscape\bin\inkscape.exe" assets/source/app/tray-icon.svg --export-type=png --export-filename="src-tauri/icons/tray-16.png" --export-width=16
& "C:\Program Files\Inkscape\bin\inkscape.exe" assets/source/app/tray-icon.svg --export-type=png --export-filename="src-tauri/icons/tray-32.png" --export-width=32

text

### Favicon
& "C:\Program Files\Inkscape\bin\inkscape.exe" assets/source/branding/favicon.svg --export-type=png --export-filename="assets/generated/favicon.png" --export-width=64
magick assets/generated/favicon.png -define icon:auto-resize=16,32,48 assets/generated/favicon.ico

text

Upload to: `ums/orgs/{org-id}/branding/favicon.ico`

### Wordmark horizontal color (dark backgrounds only)
& "C:\Program Files\Inkscape\bin\inkscape.exe" assets/source/branding/logo-horizontal-color.svg --export-type=png --export-filename="assets/generated/logo-horizontal-color-1024.png" --export-width=1024

text

Upload to: `ums/orgs/{org-id}/branding/logo.png`

### Wordmark horizontal white (dark backgrounds only)
& "C:\Program Files\Inkscape\bin\inkscape.exe" assets/source/branding/logo-horizontal-white.svg --export-type=png --export-filename="assets/generated/logo-horizontal-white-1024.png" --export-width=1024

text

Upload to: `ums/orgs/{org-id}/branding/logo-dark.png`

### Mark vertical color
& "C:\Program Files\Inkscape\bin\inkscape.exe" assets/source/branding/logo-vertical-color.svg --export-type=png --export-filename="assets/generated/logo-vertical-color-512.png" --export-width=512

text

Upload to: `ums/orgs/{org-id}/branding/mark.png`

### Mark vertical white
& "C:\Program Files\Inkscape\bin\inkscape.exe" assets/source/branding/logo-vertical-white.svg --export-type=png --export-filename="assets/generated/logo-vertical-white-512.png" --export-width=512

text

Upload to: `ums/orgs/{org-id}/branding/mark-dark.png`

---

## Contrast rule reminder

The colored gradient wordmark is ONLY valid on dark surfaces (`#17151a` or darker). Never on `#ffffff` or `#f7f4ee`. The white wordmark is also only for dark surfaces. For any light surface, no current logo variant is contrast-valid. The design is dark-mode-first per the glassmorphism direction in `docs/handover/00a-assets.md` section 3.

---

## Change log

- **2026-10-28 (rev 1):** Initial inventory. Stage 00 / 01 / 02 defined. Six starter SVGs with placeholder navy/gold palette.
- **2026-10-28 (rev 2):** Replaced placeholder palette with official brand SVGs. Added glassmorphism tokens, dark-mode-first default.
- **2026-10-28 (rev 3):** Extracted U emblem for `icon.svg`, `tray-icon.svg`, and new `favicon.svg`. Added `logo-vertical-white.svg`. Removed `logo-primary.svg` and `logo-dark.svg`.
- **2026-10-28 (rev 4):** Inkscape 1.4.4 ships without `rsvg-convert.exe`. Replaced all render commands with native `inkscape.exe --export-type=png`. Added `assets/render.ps1` as the single entry point for all raster exports. No external PATH configuration required.
