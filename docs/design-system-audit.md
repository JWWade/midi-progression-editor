# Design System Audit — Parametric MIDI Sequencer

**Date:** 2026-03-30  
**Auditor:** @copilot  
**Scope:** React/TypeScript frontend (`client/src/`)  
**Issue:** ISSUE-E9-07 — Design System & Visual Consistency Audit

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Visual Inventory](#visual-inventory)
   - [CSS Architecture](#css-architecture)
   - [Global Design Tokens](#global-design-tokens)
   - [Component Catalogue](#component-catalogue)
3. [Design System Standards](#design-system-standards)
   - [Spacing](#spacing)
   - [Typography](#typography)
   - [Color](#color)
   - [Iconography](#iconography)
4. [Inconsistency Report](#inconsistency-report)
5. [Remediation Status](#remediation-status)
6. [SPIKE Log](#spike-log)

---

## Executive Summary

The Parametric MIDI Sequencer's design system is well-structured: it defines a comprehensive set of CSS custom properties, supports three complete themes (Light, Dark, Retro), and encapsulates component styles in CSS Modules. The foundational work is solid. This audit identified the following actionable issues:

| Severity | Count | Description |
|----------|-------|-------------|
| **High** | 1 | `AudioDebugPanel.module.css` — hardcoded colors bypassing the CSS-variable theme system |
| **Low** | 3 | Hardcoded utility colors (`#9ca3af`, `#d1d5db`, `#10b981`) inside `CurrentChordPanel.module.css` |
| **Low** | 1 | Hardcoded link colors (`#646cff`, `#535bf2`) in `index.css` `a` element |
| **Info** | 1 | Focus-ring offset is inconsistently `1px` vs `2px` vs `3px` across components |
| **Info** | 1 | `font-size: 11.5px` in VisualLegend — not on the canonical scale |

The `AudioDebugPanel` issue has been **remediated** in this PR (see [Remediation Status](#remediation-status)).

---

## Visual Inventory

### CSS Architecture

| Layer | Files | Pattern |
|-------|-------|---------|
| Global tokens & reset | `client/src/styles/index.css` | Single file, `:root` + `[data-theme]` selectors |
| App layout | `client/src/app/App.module.css` | CSS Module |
| App shell | `client/src/app/components/AppHeader.module.css`, `DevDiagnosticsPanel.module.css` | CSS Modules |
| Shared components | `client/src/shared/components/Toast/Toast.module.css` | CSS Module |
| Feature components | 14 `*.module.css` files across features | CSS Modules |

**Total CSS files:** 19 (1 global + 18 modules)

---

### Global Design Tokens

All semantic tokens are defined in `client/src/styles/index.css` for all three themes.

#### Backgrounds

| Token | Light | Dark | Retro |
|-------|-------|------|-------|
| `--color-bg-page` | `#fafbfc` | `#18181b` | `#000033` |
| `--color-bg-surface` | `#ffffff` | `#1e1e2e` | `#0a0a4a` |
| `--color-bg-header` | `#f9fafb` | `#1a1a24` | `#000080` |
| `--color-bg-sidebar` | `#f3f4f6` | `#1c1c24` | `#0d0044` |
| `--color-bg-canvas` | `#ffffff` | `#18181b` | `#000033` |
| `--color-bg-subtle` | `rgba(0,0,0,0.04)` | `rgba(255,255,255,0.06)` | `rgba(0,255,255,0.06)` |

#### Borders

| Token | Light | Dark | Retro |
|-------|-------|------|-------|
| `--color-border` | `#e5e7eb` | `rgba(255,255,255,0.1)` | `#ff00ff` |
| `--color-border-subtle` | `rgba(0,0,0,0.08)` | `rgba(255,255,255,0.08)` | `rgba(255,0,255,0.5)` |

#### Text

| Token | Light | Dark | Retro |
|-------|-------|------|-------|
| `--color-text-primary` | `#1f2937` | `#e5e7eb` | `#00ffff` |
| `--color-text-secondary` | `#4b5563` | `#bcc4d2` | `#ffff00` |
| `--color-text-muted` | `#6b7280` | `#97a0b1` | `#ff69b4` |

#### Accent

| Token | Light | Dark | Retro |
|-------|-------|------|-------|
| `--color-accent` | `#4f46e5` | `#818cf8` | `#ff00ff` |
| `--color-accent-hover` | `#4338ca` | `#a5b4fc` | `#ff66ff` |

#### Interactive & Utility

| Token | Purpose |
|-------|---------|
| `--color-tile-bg` | Default tile/card fill |
| `--color-tile-bg-hover` | Tile hover state fill |
| `--color-tile-name` | Primary label inside a tile |
| `--color-control-btn` | Icon button default color |
| `--color-control-btn-hover-bg` | Icon button hover background |
| `--color-control-btn-hover` | Icon button hover foreground |
| `--color-delete-btn` | Destructive action color |
| `--color-delete-btn-hover-bg` | Destructive action hover bg |
| `--color-delete-btn-hover` | Destructive action hover fg |
| `--color-disabled-bg` | Disabled control fill |
| `--color-disabled-text` | Disabled control text |
| `--color-scrollbar` | Scrollbar thumb color |

#### Component-scoped tokens (set via inline style, not `:root`)

| Token | Set by | Used in |
|-------|--------|---------|
| `--chord-panel-bg` | `CurrentChordPanel.tsx` | `CurrentChordPanel.module.css` |
| `--chord-quality-base` | `CurrentChordPanel.tsx` | `CurrentChordPanel.module.css` |
| `--chord-quality-dark` | `CurrentChordPanel.tsx` | `CurrentChordPanel.module.css` |
| `--chord-quality-text` | `CurrentChordPanel.tsx` | `CurrentChordPanel.module.css` |
| `--accent-color` | `ChordTile.tsx` | `ChordTile.module.css` |

---

### Component Catalogue

#### AppHeader

**File:** `AppHeader.module.css`  
**Tokens used:** `--color-bg-header`, `--color-border`, `--color-text-primary`, `--color-text-muted`, `--color-control-btn`, `--color-control-btn-hover`, `--color-control-btn-hover-bg`, `--color-accent`  
**Hardcoded values:** None  
**Theme coverage:** Full (Light, Dark, Retro via CSS variables + explicit retro override for neon glow)  
**Status:** ✅ Consistent

---

#### App Layout (`App.module.css`)

**Tokens used:** `--color-bg-page`, `--color-bg-surface`, `--color-text-primary`  
**Layout:** 3-column grid — `minmax(420px, 3fr)` / `minmax(260px, 1fr)` / `minmax(280px, 420px)`  
**Breakpoints:**
- `≤ 900px` → single column, 16px gap & padding
- `≤ 640px` → single column, 12px gap & padding  

**Status:** ✅ Consistent

---

#### ChromaticCircle

**File:** `ChromaticCircle.module.css`  
**Tokens used:** `--color-bg-canvas`, `--color-border`, `--color-accent`  
**Notes:** SVG canvas. Node and polygon colors are driven by chord-quality data, not CSS variables.  
**Status:** ✅ Consistent

---

#### CurrentChordPanel

**File:** `CurrentChordPanel.module.css`  
**Tokens used:** `--chord-panel-bg`, `--chord-quality-base/dark/text`, `--color-text-primary/secondary/muted`, `--color-disabled-bg/text`, `--color-accent`  
**Hardcoded values (minor):**
- `.addButtonDisabled:focus-visible` → `outline: 3px solid #9ca3af`
- `.copyIconButton:disabled` → `border-color: #d1d5db; color: #9ca3af`
- `.copyIconButtonCopied` → `background-color: #10b981; border-color: #10b981`

**Rationale:** The first two should use `--color-disabled-bg` / `--color-disabled-text`; the "copied" state color (`#10b981`, green) has no semantic token and is an intentional one-off.  
**Status:** ⚠️ Minor — disabled-state colors can use tokens; copied-success color is intentional

---

#### VisualLegend

**File:** `VisualLegend.module.css`  
**Tokens used:** `--color-border`, `--color-bg-surface`, `--color-text-primary`, `--color-text-secondary`  
**Notes:** No hardcoded colors. Uses `font-size: 11.5px` which falls between canonical sizes.  
**Status:** ✅ Consistent (minor font-size note)

---

#### ProgressionSidebar

**File:** `ProgressionSidebar.module.css`  
**Tokens used:** `--color-bg-sidebar`, `--color-border`, `--color-text-primary/secondary/muted`, `--color-accent`, `--color-scrollbar`  
**Status:** ✅ Consistent

---

#### ChordTile

**File:** `ChordTile.module.css`  
**Tokens used:** `--accent-color` (per-tile), `--color-tile-bg/hover`, `--color-tile-name`, `--color-text-secondary`, `--color-control-btn*`, `--color-delete-btn*`  
**Notes:** Uses `--accent-color` (injected inline per chord quality) for left border and outline. Falls back to `var(--color-accent, #4f46e5)` in focus styles.  
**Status:** ✅ Intentional pattern; per-tile color is well-documented

---

#### MidiExportControls / NoteValueSelector

**Files:** `MidiExportControls.module.css`, `NoteValueSelector.module.css`  
**Tokens used:** `--color-border`, `--color-text-primary/secondary/muted`, `--color-bg-surface/subtle`, `--color-accent`, `--color-disabled-bg/text`  
**Status:** ✅ Consistent

---

#### AudioDebugPanel *(before fix)*

**File:** `AudioDebugPanel.module.css`  
**Problem:** Default (light) styles used 10+ hardcoded color values (`#f9f9f9`, `#ccc`, `#ddd`, `#333`, `#666`, `white`, `#bbb`, `#f5f5f5`, `#efefef`) with dark-theme overrides applied separately. This duplicated effort and left the component broken under any custom theme.  
**Status:** 🔴 Fixed → see [Remediation Status](#remediation-status)

---

#### DevDiagnosticsPanel

**File:** `DevDiagnosticsPanel.module.css`  
**Notes:** Developer-only debug overlay. Intentionally uses a fixed dark aesthetic (lime-green `#a3e635`, dark semi-transparent background) regardless of active theme. This is an internal tool, not a user-facing surface.  
**Status:** ✅ Intentional; developer tooling aesthetic

---

## Design System Standards

### Spacing

**Scale (base-4, px):**

| Step | Value | Typical usage |
|------|-------|---------------|
| 0.5 | `2px` | Micro gaps (icon subpixel, gap-2 in flex) |
| 1 | `4px` | Tight gaps, inner padding on badges |
| 1.5 | `6px` | Compact component gaps |
| 2 | `8px` | Standard small gap (row spacing) |
| 3 | `12px` | Section inner padding, card gap |
| 4 | `16px` | Standard component padding |
| 5 | `20px` | Panel padding |
| 6 | `24px` | Grid gap, section outer margin |
| 8 | `32px` | Large section separation |

**Rules:**
- All spacing values must be a multiple of `4px`.
- Page/section padding uses `24px` at desktop, collapsing to `16px` at ≤ 900px and `12px` at ≤ 640px.
- Card/panel internal padding is `16px` at desktop, `12px` at tablet, `8px` at mobile.
- Do not use `margin: auto` for vertical centering; use flexbox `align-items`.

---

### Typography

#### Type Scale

| Level | Size | Weight | Usage |
|-------|------|--------|-------|
| Chord name | `28px` | `700` | Primary chord name in `CurrentChordPanel` — uses **Georgia serif** for musical expressiveness |
| Page heading | `3.2em` | `700` | `h1` global (currently unused at runtime) |
| Section label | `11px` | `700` | All-caps section headers (`letter-spacing: 0.12em`) |
| Sub-section heading | `11px` | `600` | Legend, sidebar headers (`letter-spacing: 0.1em`, `text-transform: uppercase`) |
| Primary body | `13px` | `400–600` | Chord notes, labels, table data |
| Secondary body | `12px` | `400–500` | Form inputs, MIDI controls, secondary labels |
| Tertiary / micro | `10–11px` | `400–600` | Badges, metadata, small annotations |
| Developer debug | `9–11px` | `400` | `DevDiagnosticsPanel` only — monospace |

#### Font Families

| Family | Variable / usage |
|--------|-----------------|
| `system-ui, Avenir, Helvetica, Arial, sans-serif` | Global default (`:root`) |
| `Georgia, 'Times New Roman', serif` | Chord name in `CurrentChordPanel` — expressive musical identity |
| `monospace` | Keyboard hints, debug panels |
| `"Comic Sans MS", "Comic Sans", cursive` | Retro theme only — global override |

#### Rules

- The serif chord name is an **intentional expressive choice** — do not replace with system-ui.
- Retro theme overrides font-family globally via `[data-theme="retro"] *`; all components inherit this automatically.
- `font-size: 11.5px` appears in `VisualLegend` — prefer `12px` or `11px` to stay on the canonical scale.
- `font-synthesis: none` and `text-rendering: optimizeLegibility` are set globally; do not override per-component.

---

### Color

#### Palette Roles

| Role | Token | Notes |
|------|-------|-------|
| Primary accent | `--color-accent` | Indigo-based; adapts per theme |
| Accent hover | `--color-accent-hover` | Slightly darker/lighter |
| Page background | `--color-bg-page` | Outermost canvas |
| Surface | `--color-bg-surface` | Cards, panels, header |
| Sidebar | `--color-bg-sidebar` | Sidebar background |
| Canvas | `--color-bg-canvas` | SVG drawing surface |
| Subtle fill | `--color-bg-subtle` | Input backgrounds, inline code |
| Primary text | `--color-text-primary` | Body, headings |
| Secondary text | `--color-text-secondary` | Labels, metadata |
| Muted text | `--color-text-muted` | Secondary and disabled labels |
| Border | `--color-border` | Component outlines |
| Subtle border | `--color-border-subtle` | Inner dividers, separators |
| Tile fill | `--color-tile-bg` | Progression tile default |
| Tile hover | `--color-tile-bg-hover` | Progression tile hover |
| Tile label | `--color-tile-name` | Primary text inside a tile |
| Delete / danger | `--color-delete-btn` + hover variants | Destructive actions only |
| Disabled | `--color-disabled-bg` + `--color-disabled-text` | All disabled states |
| Scrollbar | `--color-scrollbar` | Webkit scrollbar thumb |

#### Chord Quality Colors

Per-chord accent colors live in `client/src/features/chord/constants/chordQualityColors.ts` and are injected as inline CSS custom properties. They are **not** part of the global token system — they are data-driven:

| Property | Usage |
|----------|-------|
| `--accent-color` | Chord tile left-border and outline (`ChordTile`) |
| `--chord-panel-bg` | Tinted panel background (`CurrentChordPanel`) |
| `--chord-quality-base` | Button fill, icon color |
| `--chord-quality-dark` | High-contrast text and borders (light theme) |
| `--chord-quality-text` | Text on colored button backgrounds |

#### Rules

1. **Never** use hardcoded hex/rgb values for semantic UI colors — always use a `--color-*` token.
2. The only permitted hardcoded colors are:
   - Retro theme bevel/border decorations (Windows 95 bevel: `#dfdfdf #808080`) — these are theme-specific decorative constants, not semantic.
   - One-off status colors with no semantic token equivalent (e.g., `#10b981` for "copied" success state).
3. All new tokens must be defined in all three theme selectors (`:root/[data-theme="light"]`, `[data-theme="dark"]`, `[data-theme="retro"]`).
4. Use `color-mix()` for dynamic tinted fills (e.g., `color-mix(in srgb, var(--color-accent) 12%, transparent)`) rather than alpha-variant hardcoded values.
5. Opacity levels for harmony visualization are constants exported from `harmonyOpacity.ts` (`DIATONIC_OPACITY=1`, `CHROMATIC_OPACITY=0.3`, `CHORD_TONE_CHROMATIC_OPACITY=0.7`) — do not duplicate in CSS.

---

### Iconography

The current icon system uses Unicode / emoji characters as inline text within SVG or button elements. There is no external icon library dependency.

#### Current Icon Inventory

| Icon | Unicode | Usage |
|------|---------|-------|
| ↑ Move up | `↑` | ChordTile reorder button |
| ↓ Move down | `↓` | ChordTile reorder button |
| ✕ Remove | `✕` | ChordTile delete button |
| ▶ Play | `▶` | CurrentChordPanel play button |
| ⟳ Repeat | `⟳` | Progression playback |
| 💡 Suggestion | `💡` | BridgeSuggestionIcon |
| ⧉ Copy | `⧉` | CurrentChordPanel copy-notes button |

#### Rules

1. **Geometry first:** Chord shapes (triangle for triads, quadrilateral for seventh chords) are the primary visual metaphor. All chord-quality visualization derives from polygon geometry defined in `CHORD_SHAPES`.
2. **No icon library dependency:** Continue using Unicode characters or inline SVG. Do not introduce an icon library (e.g., Heroicons, Lucide) without a dedicated SPIKE.
3. **Accessible labels:** All icon-only buttons must carry an `aria-label` or `title` attribute. Screen-reader text via `.sr-only` is preferred for interactive elements.
4. **Color follows quality:** Icons inside chord components inherit quality color from the nearest `--accent-color` / `--chord-quality-base` custom property. Do not hard-code icon colors outside of the DevDiagnosticsPanel.
5. **Retro theme:** Icon buttons inherit the Windows 95 bevel style from the global `[data-theme="retro"] button` rule. No per-icon retro overrides needed.

---

## Inconsistency Report

### IC-01 — `AudioDebugPanel.module.css`: hardcoded light-theme colors

**Severity:** High  
**File:** `client/src/features/audio/components/AudioDebugPanel.module.css`  
**Description:** The default (light-theme) styles in `AudioDebugPanel.module.css` used ten hardcoded color values (`#f9f9f9`, `#ccc`, `#ddd`, `#333`, `#666`, `white`, `#bbb`, `#f5f5f5`, `#efefef`) instead of the CSS variable system. The panel rendered correctly only in light mode; a hypothetical custom theme or future palette change would bypass it entirely.  
**Fix:** Replace all hardcoded colors with the canonical `--color-*` tokens. The redundant `[data-theme="dark"]` block was simplified since the variables now adapt automatically.  
**Status:** ✅ **Resolved** (this PR)

---

### IC-02 — `CurrentChordPanel.module.css`: disabled-state hardcoded colors

**Severity:** Low  
**File:** `client/src/features/current-chord/components/CurrentChordPanel.module.css`  
**Lines:** `.addButtonDisabled:focus-visible` (`#9ca3af`), `.copyIconButton:disabled` (`#d1d5db`, `#9ca3af`)  
**Description:** Disabled state colors use hardcoded hex values that coincide with—but do not reference—`--color-disabled-bg` and `--color-disabled-text`.  
**Recommended fix:**
```css
/* Before */
.addButtonDisabled:focus-visible { outline: 3px solid #9ca3af; }
.copyIconButton:disabled { border-color: #d1d5db; color: #9ca3af; }

/* After */
.addButtonDisabled:focus-visible { outline: 3px solid var(--color-disabled-text); }
.copyIconButton:disabled { border-color: var(--color-disabled-bg); color: var(--color-disabled-text); }
```
**Status:** Open

---

### IC-03 — `index.css`: hardcoded link colors

**Severity:** Low  
**File:** `client/src/styles/index.css`  
**Lines:** `a { color: #646cff; }`, `a:hover { color: #535bf2; }`  
**Description:** The `<a>` element default styles use the Vite boilerplate colors rather than `--color-accent`. No `<a>` elements are currently rendered in the app shell (all navigation is button-based), so this is latent but not actively harmful.  
**Recommended fix:** Either replace with `var(--color-accent)` / `var(--color-accent-hover)`, or add `--color-link` and `--color-link-hover` tokens if link styling needs to differ from the accent color.  
**Status:** Open

---

### IC-04 — `VisualLegend.module.css`: non-canonical font size

**Severity:** Info  
**File:** `client/src/features/legend/components/VisualLegend.module.css`  
**Lines:** `.spectrumLabel`, `.cardinalityLabel`, `.iconLabel`, `.intensityLabel`, `.nodeLabel` — all `font-size: 11.5px`  
**Description:** `11.5px` falls between the canonical `11px` and `12px` steps on the type scale.  
**Recommended fix:** Unify to `12px` (secondary body) or `11px` (sub-section heading); test visual impact before committing.  
**Status:** Open

---

### IC-05 — Focus-ring offset inconsistency

**Severity:** Info  
**Files:** Multiple component CSS modules  
**Description:** `outline-offset` values vary across interactive elements:

| Component | Offset |
|-----------|--------|
| ChordTile `.controlBtn:focus-visible` | `1px` |
| ChordTile `.tile:focus-visible` | `2px` |
| CurrentChordPanel `.addButton:focus-visible` | `3px` |
| CurrentChordPanel `.playButton:focus-visible`, `.copyIconButton:focus-visible` | `2px` |
| MidiExportControls | `2px` |

**Recommended standard:** Use `outline-offset: 2px` for all interactive elements. Reserve `3px` only for primary call-to-action buttons (`addButton` class). Icon-sized controls (`22×18px`) may use `1px`.  
**Status:** Open

---

## Remediation Status

| ID | Description | Status |
|----|-------------|--------|
| IC-01 | `AudioDebugPanel` hardcoded colors → CSS variables | ✅ Resolved (this PR) |
| IC-02 | `CurrentChordPanel` disabled-state hardcoded colors | Open |
| IC-03 | `index.css` link colors | Open |
| IC-04 | `VisualLegend` non-canonical font-size | Open |
| IC-05 | Focus-ring offset inconsistency | Open |

---

## SPIKE Log

The following areas require deeper exploration before a definitive standard can be set. SPIKE documents are in `docs/spikes/`.

| SPIKE | Description | File |
|-------|-------------|------|
| SPIKE-design-system | Icon library evaluation, theming token expansion, motion system | `docs/spikes/SPIKE-design-system.md` |
