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