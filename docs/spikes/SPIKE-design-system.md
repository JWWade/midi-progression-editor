# SPIKE — Design System: Unresolved Areas

**Date:** 2026-03-30  
**Author:** @copilot  
**Related issue:** ISSUE-E9-07 — Design System & Visual Consistency Audit  
**Status:** Open

---

## Summary

This SPIKE captures three design-system areas that require deeper exploration before a definitive standard can be set:

1. [Icon System Strategy](#1-icon-system-strategy)
2. [Design Token Expansion (links, success, warning)](#2-design-token-expansion)
3. [Motion & Animation System](#3-motion--animation-system)

Each section describes the open question, options, and a recommended next step.

---

## 1. Icon System Strategy

### Problem

The app currently uses Unicode characters as icons (▶, ✕, ↑, ↓, 💡, ⧉). This approach has zero dependencies but presents three risks as the app grows:

- **Inconsistent sizing:** Unicode glyphs render at different optical sizes across platforms and fonts. The retro theme (`Comic Sans`) further shifts glyph metrics.
- **Limited expressiveness:** There is no musical-domain icon vocabulary (rest symbol, time signature, clef, note value) in the Unicode standard. Custom SVG or a library would be needed.
- **Accessibility:** Some Unicode characters lack descriptive accessible names in screen reader announcement; `aria-label` must be applied manually on every use.

### Options

| Option | Pros | Cons |
|--------|------|------|
| **A — Status quo (Unicode)** | Zero deps; no bundler config | Optical inconsistency; no musical glyphs |
| **B — Inline SVG per icon** | Full control; zero dep; treeshaken naturally | Boilerplate per icon; no central registry |
| **C — SVG sprite sheet** | Central registry; single HTTP request | Build tooling required; sprite management |
| **D — Icon library (e.g., Lucide React)** | Large catalog; consistent style; TypeScript types | ~15 kB dep; none are musical-domain specific |
| **E — Custom icon component with SVG paths** | Musical-domain glyphs possible; typed; self-contained | Design effort; must maintain ourselves |

### Recommendation

Option **B** (inline SVG) for the short term: create an `IconSymbol` component under `client/src/shared/components/Icon/` that accepts a `name` prop and renders the correct `<svg>`. This keeps zero runtime dependency, allows precise sizing, and is fully typed. If the icon set exceeds ~20 symbols, evaluate Option C.

Option E should be explored in a separate SPIKE if musical-domain iconography (rest, note values, clef) is needed for a future feature.

### Open Questions

1. Should the retro theme use pixel-art–style icons instead of bevel buttons with Unicode characters?
2. Is a musical-domain icon set in scope for the next epic?

---

## 2. Design Token Expansion

### Problem

The current token set (`--color-*` in `index.css`) covers backgrounds, borders, text, accent, and interactive states. Three token categories are missing:

#### 2a — Link colors

`index.css` defines `a { color: #646cff; }` as a Vite boilerplate default. No `--color-link` token exists. If anchor elements are used in a future info panel or external documentation link, they will display the boilerplate indigo rather than the theme accent.

**Proposed tokens:**
```css
--color-link: var(--color-accent);
--color-link-hover: var(--color-accent-hover);
--color-link-visited: /* tbd */;
```

#### 2b — Semantic status colors

The "copied" confirmation state in `CurrentChordPanel` uses `#10b981` (Tailwind `emerald-500`) as a one-off. Future features may need success, warning, and error status colors.

**Proposed tokens:**
```css
--color-status-success: #10b981; /* copied, saved, synced */
--color-status-warning: #f59e0b; /* near-limit, latency high */
--color-status-error:   #ef4444; /* equivalent to --color-delete-btn in light */
```

These would each need light, dark, and retro definitions.

#### 2c — Focus ring token

Focus rings currently use a mix of `--color-accent`, `--chord-quality-base`, and hardcoded grays. A dedicated token would standardize this:

```css
--color-focus-ring: var(--color-accent);
```

Each component would then use `outline: 2px solid var(--color-focus-ring)` without specifying the color explicitly.

### Open Questions

1. Should `--color-focus-ring` be the same as `--color-accent`, or a separate high-contrast color (especially for the retro theme where `--color-accent` is magenta)?
2. Are there enough status-color uses to justify expanding the token set now, or should this wait until a feature requires it?

---

## 3. Motion & Animation System

### Problem

Animations are defined at the component level with no shared constants. The current inventory:

| Animation | Duration | Easing | File |
|-----------|----------|--------|------|
| `tileHighlight` | `300ms` | `ease-out` | `ChordTile.module.css` |
| `arrowSlide` | `0.35s` | `ease` | `CurrentChordPanel.module.css` |
| `playbackPulse` | (in ProgressionSidebar) | `ease` | `ProgressionSidebar.module.css` |
| Chord morph | `260ms` | `easeInOutCubic` (JS) | `useChordMorphing.ts` |
| `transition: background-color` | `0.15–0.35s` | `ease` | Multiple |
| `prefers-reduced-motion` | `none` | — | `ChordTile`, `ChromaticCircle` |

Issues:
- Duration values (`260ms`, `300ms`, `350ms`) are scattered across JS and CSS with no shared source of truth.
- `prefers-reduced-motion` is respected in some components but not all.

### Options

| Option | Description |
|--------|-------------|
| **A** | Add CSS custom properties `--duration-fast: 150ms`, `--duration-base: 260ms`, `--duration-slow: 350ms` to `index.css` |
| **B** | Move shared `@keyframes` to `index.css` or a shared `animations.css` |
| **C** | Export JS constants from a shared `motionTokens.ts` consumed by both CSS (via PostCSS/CSS Modules) and the `useChordMorphing` hook |

### Recommendation

**Short term:** Option A — add three duration tokens to `index.css`. This requires no tooling change and resolves the scattered hardcoded values.

**Medium term:** Option B — lift duplicated `@keyframes tileHighlight` to `index.css` as a global animation definition and remove the module-level duplicates.

**Long term:** Option C should be evaluated if more JS-driven animations are added. Requires investigating whether Vite's CSS Modules support PostCSS variable injection.

### Open Questions

1. Should `--duration-base` be `260ms` (current morph) or `300ms` (current tile highlight)?
2. Is there a user preference for reduced-motion beyond the CSS media query? (e.g., a toggle in AppHeader like the existing theme switcher?)
