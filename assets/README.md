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

```
rsvg-convert --version
magick --version
```

Both must return version strings. If `rsvg-convert` is not found, add `C:\Program Files\Inkscape\bin` to PATH.

---

## Build commands by asset type

### Tauri app icons

```
npx tauri icon assets/source/app/icon.svg
```

Output: `src-tauri/icons/` (committed per rule 3 exception).

### Tray icons

```
rsvg-convert -w 16 -h 16 assets/source/app/tray-icon.svg -o src-tauri/icons/tray-16.png
rsvg-convert -w 32 -h 32 assets/source/app/tray-icon.svg -o src-tauri/icons/tray-32.png
```

### Branding logo (light) - upload to S3

```
rsvg-convert -w 512 -h 128 assets/source/branding/logo-primary.svg -o logo.png
```

Upload to: `ums/orgs/{org-id}/branding/logo.png`

### Branding logo (dark)

```
rsvg-convert -w 512 -h 128 assets/source/branding/logo-dark.svg -o logo-dark.png
```

Upload to: `ums/orgs/{org-id}/branding/logo-dark.png`

### Favicon

```
rsvg-convert -w 64 -h 64 assets/source/branding/favicon.svg -o favicon.png
magick favicon.png -define icon:auto-resize=16,32,48 favicon.ico
```

### Installer graphics

```
mkdir -p assets/generated/installer
rsvg-convert -w 150 -h 57 assets/source/app/installer-header.svg -o assets/generated/installer/header.png
magick assets/generated/installer/header.png assets/generated/installer/header.bmp
```

### UI SVGs (used directly, no conversion)

```
cp assets/source/empty-states/*.svg src/assets/empty/
cp assets/source/errors/*.svg src/assets/errors/
cp assets/source/icons/notifications/*.svg src/assets/icons/notifications/
```

---

## Change log

- **2026-10-28:** Initial inventory. Stage 00 / 01 / 02 defined. Six starter SVGs created.

---

## Brand wordmarks (added 2026-10-28)

Four official SVGs from Adobe Illustrator, cleaned of unused style declarations.

### Generate horizontal wordmark PNGs (for S3 branding upload)
rsvg-convert -w 1024 -h 241 assets/source/branding/logo-horizontal-color.svg -o logo-horizontal-color-1024.png
rsvg-convert -w 1024 -h 226 assets/source/branding/logo-horizontal-white.svg -o logo-horizontal-white-1024.png

text

### Generate vertical mark PNGs
rsvg-convert -w 512 -h 512 assets/source/branding/logo-vertical-color.svg -o logo-vertical-color-512.png
rsvg-convert -w 512 -h 512 assets/source/branding/logo-vertical-white.svg -o logo-vertical-white-512.png

text

### Favicon generation

The favicon should use the standalone "U" mark extracted from the vertical logo, on a transparent or warm-dark background. Extraction command depends on `ubuveil-ico.svg` content (requested from user, see 00a-assets.md section 2). Until received, use `npx tauri icon assets/source/branding/logo-vertical-color.svg` as a temporary fallback.

### Contrast rule reminder

The colored gradient wordmark is ONLY valid on dark surfaces (`#17151a` or darker). Never place it on `#ffffff` or `#f7f4ee`.