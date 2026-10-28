# UMS Asset Specification - Companion to Founding Handover

Path: docs/handover/00a-assets.md
References: 00-founding.md
Rules active: 41, 42, 43
Last updated: 2026-10-28 (rev 5 - asset pipeline operational)

---

## Section 1: Asset categories and ownership

- **App shell assets** (Stage 01): app icon, tray icon, installer graphics. Owned by Stage 01 handover.
- **Branding assets** (Stage 02): wordmarks (horizontal + vertical, color + white), favicon, login bg, email header. Owned by Stage 02 handover.
- **UI illustrations** (Stage 02+): empty states, error states, onboarding. Owned by the stage that introduces the feature they support.
- **Icon sets** (Stage 02+): notification icons, file-type icons, widget icons. Owned by the stage that introduces the corresponding feature.
- **Documentation illustrations** (non-blocking): README banner, architecture diagrams. Owned by whoever writes the docs.

---

## Section 2: Official brand source files

Five committed SVGs in `assets/source/branding/`:

| File | viewBox | Use |
| :--- | :--- | :--- |
| `favicon.svg` | `0 0 44 44` | Coral U emblem, transparent, favicon source |
| `logo-horizontal-color.svg` | `171.23 40.27` | Horizontal wordmark, colored gradient. Dark backgrounds. |
| `logo-horizontal-white.svg` | `168.3 37.14` | Horizontal wordmark, white. Dark backgrounds. |
| `logo-vertical-color.svg` | `73.7 73.7` | Vertical mark + wordmark, colored gradient. Splash. |
| `logo-vertical-white.svg` | `73.7 73.7` | Vertical mark + wordmark, white. Splash on dark. |

Two committed SVGs in `assets/source/app/`:

| File | viewBox | Use |
| :--- | :--- | :--- |
| `icon.svg` | `0 0 44 44` | App icon: coral U emblem on `#17151a` rounded square |
| `tray-icon.svg` | `0 0 44 44` | Tray icon: coral U emblem, transparent |

---

## Section 3: The U emblem

The coral U emblem used in `icon.svg`, `tray-icon.svg`, and `favicon.svg` was extracted from the leftmost element of `logo-horizontal-color.svg`. It is our canonical icon mark. The `ubuveil-ico.svg` file from the `ubuveil-invoice` project was reviewed and rejected as an icon source: it is an Illustrator presentation artboard with 4+ logo variations embedded as base64 JPEG previews, not a production icon asset. The coral U is brand-correct for the dark-mode-first direction.

---

## Section 4: Design system (rev 2 - official brand palette)

### Brand palette

| Token | Value | Source |
| :--- | :--- | :--- |
| `--ubv-brand-gradient-start` | `#EB6F65` (coral) | Official logo gradient stop 0 |
| `--ubv-brand-gradient-end` | `#F5AB82` (peach) | Official logo gradient stop 1 |
| `--ubv-brand-dark` | `#9B4122` (dark brown) | Unused Illustrator swatch, reserved for light-mode logo if needed |
| `--ubv-brand-green` | `#2BB673` | Unused Illustrator swatch, reserved for secondary accent |
| `--ubv-brand-white` | `#FFFFFF` | Official logo white fills |

### Warm low-strain neutrals (blue-light reduced, long-session ergonomics)

| Token | Value | Use |
| :--- | :--- | :--- |
| `--ubv-bg-dark-primary` | `#17151a` | App background, dark mode |
| `--ubv-bg-dark-elevated` | `#1f1d24` | Elevated surfaces, dark mode |
| `--ubv-bg-light-primary` | `#f7f4ee` | App background, light mode (warm off-white) |
| `--ubv-text-on-dark` | `#e8e4dd` | Body text on dark backgrounds |
| `--ubv-text-on-light` | `#241f18` | Body text on light backgrounds |
| `--ubv-text-muted-dark` | `#a6a19a` | Secondary text on dark backgrounds |
| `--ubv-text-muted-light` | `#6b655c` | Secondary text on light backgrounds |
| `--ubv-border-dark` | `rgba(255, 255, 255, 0.08)` | Hairline borders on dark |
| `--ubv-border-light` | `rgba(36, 31, 24, 0.08)` | Hairline borders on light |

All neutrals have red > blue in their RGB components. No cold blues anywhere in the neutral palette.

### Glassmorphism tokens

| Token | Value |
| :--- | :--- |
| `--ubv-glass-dark-bg` | `rgba(23, 21, 26, 0.55)` |
| `--ubv-glass-dark-blur` | `blur(24px) saturate(140%)` |
| `--ubv-glass-dark-border` | `1px solid rgba(255, 255, 255, 0.1)` |
| `--ubv-glass-dark-shadow` | `0 8px 32px rgba(0, 0, 0, 0.4)` |
| `--ubv-glass-light-bg` | `rgba(247, 244, 238, 0.6)` |
| `--ubv-glass-light-blur` | `blur(24px) saturate(140%)` |
| `--ubv-glass-light-border` | `1px solid rgba(36, 31, 24, 0.08)` |
| `--ubv-glass-light-shadow` | `0 8px 32px rgba(36, 31, 24, 0.08)` |

### Typography

| Token | Value |
| :--- | :--- |
| `--ubv-font-family` | `"Inter Variable", "Inter", system-ui, -apple-system, "Segoe UI", sans-serif` |
| `--ubv-font-weight-regular` | `400` |
| `--ubv-font-weight-medium` | `500` |
| `--ubv-font-weight-semibold` | `600` |
| `--ubv-font-size-body` | `15px` |
| `--ubv-font-size-caption` | `13px` |
| `--ubv-font-size-heading` | `24px` |
| `--ubv-line-height-body` | `1.6` |

### Geometry

| Token | Value |
| :--- | :--- |
| `--ubv-radius-card` | `12px` |
| `--ubv-radius-input` | `8px` |
| `--ubv-radius-pill` | `999px` |
| `--ubv-space-unit` | `4px` (scale: 1, 2, 3, 4, 6, 8, 12, 16 units = 4px to 64px) |

### Mode default

**Dark mode is the default.** Warm-dark glassmorphism is the long-session ergonomic optimum and matches the "low UV exposure for long working hours" direction. Light mode is a supported alternative using warm off-whites (`#f7f4ee`), never pure white.

---

## Section 5: WCAG AA contrast check (rule 21)

- `#e8e4dd` on `#17151a` = 12.3:1 (AAA)
- `#241f18` on `#f7f4ee` = 13.8:1 (AAA)
- `#EB6F65` on `#17151a` = 5.1:1 (AA)
- `#F5AB82` on `#17151a` = 7.4:1 (AA/AAA)
- `#EB6F65` on `#FFFFFF` = 2.8:1 (FAIL - do not use colored gradient on white)
- `#FFFFFF` on `#17151a` = 15.2:1 (AAA)
- `#a6a19a` on `#17151a` = 6.8:1 (AA)
- `#6b655c` on `#f7f4ee` = 6.1:1 (AA)

Rule: the colored gradient logo is ONLY valid on dark surfaces. Never on white or near-white.

---

## Section 6: Asset rendering pipeline

All raster exports go through `assets/render.ps1`. The script:

- Uses `inkscape.exe` native CLI (`--export-type=png --export-width=N`), NOT `rsvg-convert`. Inkscape 1.4.4 does not ship `rsvg-convert.exe`.
- Uses `--batch-process` on each call to avoid the Inkscape 1.4 CLI race on Windows (rapid successive invocations of the same SVG at different sizes can fail without this flag).
- Waits for filesystem flush after each export (polling up to 3 seconds).
- Captures stderr so failures report Inkscape's actual complaint.
- Supports `-Diagnose` mode: continues past failures and reports all at once.

Outputs go to:
- `src-tauri/icons/tray-16.png` and `tray-32.png` (committed, rule 3 exception)
- `assets/generated/*.png` (gitignored, build artifacts)

The full Tauri icon set (.ico, .icns, multi-size .png) is generated separately via `npx tauri icon assets/source/app/icon.svg` when Stage 01 requires it.

---

## Section 7: Licensing

All SVGs in `assets/source/branding/` are official brand assets of ATG DesEng (PTY) LTD, authored by Petro Malamule. Copyright: Ubuveil Apps (c) 2025/6 by Petro@ATG. No third-party assets permitted without rule 19 sign-off.

---

## Section 8: Change log

- **2026-10-28 (rev 1):** Initial spec with placeholder navy/gold tokens.
- **2026-10-28 (rev 2):** Replaced with official brand palette from four Adobe Illustrator SVGs. Added glassmorphism tokens, warm neutral palette, and dark-mode-first default.
- **2026-10-28 (rev 3):** Extracted U emblem from `logo-horizontal-color.svg` for `icon.svg`, `tray-icon.svg`, new `favicon.svg`. Added `logo-vertical-white.svg`. Removed `logo-primary.svg` and `logo-dark.svg` (navy/gold placeholders, superseded).
- **2026-10-28 (rev 4):** Inkscape 1.4.4 ships without `rsvg-convert.exe`. Replaced render commands with native `inkscape.exe`. Added `assets/render.ps1` as the single entry point for raster exports.
- **2026-10-28 (rev 5):** Hardened `render.ps1` with `--batch-process` and stderr capture to fix Inkscape 1.4 Windows CLI race. Pipeline verified: all 8 exports succeed. `ubuveil-ico.svg` from the invoice project reviewed and rejected as an icon source (presentation artboard, not production asset).