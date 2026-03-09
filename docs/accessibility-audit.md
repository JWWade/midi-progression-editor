# MIDI Progression Editor — Accessibility Audit

**Date:** 2026-03-08  
**Auditor:** @copilot  
**Scope:** React/TypeScript frontend (`client/src/`)  
**Standard:** [WCAG 2.1](https://www.w3.org/TR/WCAG21/) Levels A and AA  

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Audit Scope](#audit-scope)
3. [Findings by Component](#findings-by-component)
   - [index.html](#indexhtml)
   - [App.tsx](#apptsx)
   - [ChromaticCircle.tsx](#chromaticcircletsx)
   - [ChordSelector.tsx](#chordselectortsx)
   - [CurrentChordPanel.tsx](#currentchordpaneltsx)
   - [ChordThumbnail.tsx](#chordthumbnailtsx)
   - [ProgressionSidebar.tsx](#progressionsidebartsx)
   - [ChordTile.tsx](#chordtiletsx)
   - [ToneInfoPanel.tsx](#toneinfopaneltsx)
   - [IntervalLabel.tsx](#intervallabeltsx)
4. [Cross-Cutting Concerns](#cross-cutting-concerns)
   - [Keyboard Navigation](#keyboard-navigation)
   - [Color and Contrast](#color-and-contrast)
   - [Motion and Animation](#motion-and-animation)
   - [Screen-Reader Experience](#screen-reader-experience)
5. [WCAG 2.1 Compliance Summary](#wcag-21-compliance-summary)
6. [Priority Recommendations](#priority-recommendations)
7. [Strengths Already in Place](#strengths-already-in-place)


---

## Executive Summary

The MIDI Progression Editor demonstrates a solid foundation for accessibility in several areas — `lang="en"` on the HTML root, widespread use of semantic elements and ARIA attributes, `prefers-reduced-motion` support, and visible focus rings on interactive controls. However, **three critical gaps** prevent WCAG 2.1 AA compliance:

1. **SVG interactive elements are keyboard-inaccessible.** Clickable chord vertices and voice-lead lines inside the `<svg>` canvas have no `tabIndex`, no `role`, and no keyboard event handlers. Keyboard and switch-access users cannot select or inspect individual tones.
2. **Color contrast failures in the progression sidebar** (dark theme). Several text colors fail WCAG AA minimums when measured against the sidebar's dark background (`#1c1c24`).
3. **The chord-list is not marked up as a list.** The progression's `<div role-less>` container and `<div>` chord items prevent screen readers from announcing list structure or item counts.

The following sections give a component-level breakdown, a WCAG mapping table, and prioritised remediation guidance.

---

## Audit Scope

| Area | Included |
|------|----------|
| HTML structure & semantics | ✅ |
| ARIA roles, properties, and states | ✅ |
| Keyboard operability | ✅ |
| Focus management | ✅ |
| Color contrast (dark and light themes) | ✅ (manual estimate) |
| Motion / animation preferences | ✅ |
| Screen-reader output (structural analysis) | ✅ |
| Automated axe/WAVE scan | ❌ Not performed (no browser environment) |
| Mobile / touch assistive tech (TalkBack, VoiceOver iOS) | ❌ Out of scope |
| Backend / server routes | ❌ Out of scope |

---

## Findings by Component

### `index.html`

**File:** `client/index.html`

| # | Severity | Finding |
|---|----------|---------|
| H1 | ⚠️ Minor | `<title>client</title>` is a placeholder name. The title should identify the application (e.g. "MIDI Progression Editor"). WCAG 2.4.2 (Page Titled). |
| H2 | ℹ️ Info | No `<meta name="description">` is present. This is not a WCAG requirement but aids discoverability and is a general best practice. |
| H3 | ℹ️ Info | No skip-to-content link is provided. WCAG 2.4.1 recommends a bypass mechanism for repeated navigation blocks. Because the layout has only one landmark region before the main content area this is low-priority, but should be added when the navigation expands. |

**Positive:**
- ✅ `lang="en"` on `<html>` (WCAG 3.1.1)
- ✅ `<meta charset="UTF-8">` and `<meta name="viewport">` present

---

### `App.tsx`

**File:** `client/src/app/App.tsx`

| # | Severity | Finding |
|---|----------|---------|
| A1 | 🔴 Critical | The outer wrapper `<div className={styles.layout}>` is not a landmark. The `<main>` element is used correctly for `circleArea`, but there is no `<header>` or skip link. Screen-reader users enter the application without orientation. |
| A2 | ⚠️ Minor | No visible application heading (`<h1>`) is rendered. The progression sidebar has an `<h2>`, creating a heading hierarchy that starts at level 2. WCAG 1.3.1. |

---

### `ChromaticCircle.tsx`

**File:** `client/src/features/chromatic-circle/components/ChromaticCircle.tsx`

This is the most complex component and has the highest concentration of accessibility issues.

#### Form Controls (Lines ~305–462) — Generally Good

| # | Severity | Finding |
|---|----------|---------|
| CC1 | ✅ Pass | `<label htmlFor="from-root-select">` and `<select id="from-root-select">` are correctly paired. |
| CC2 | ✅ Pass | `<label htmlFor="from-type-select">` and `<select id="from-type-select">` are correctly paired. |
| CC3 | ✅ Pass | All four `<input type="checkbox">` controls have explicit `<label>` elements. |
| CC4 | ✅ Pass | `<label htmlFor="scale-select">` and the scale `<select>` are paired. |
| CC5 | ✅ Pass | Play buttons use native `<button>` with descriptive `aria-label` values. |

#### SVG Canvas (Lines ~489–828) — Critical Issues

| # | Severity | Finding |
|---|----------|---------|
| CC6 | 🔴 Critical | **Chord vertex circles are mouse-only.** `<circle onClick={...}>` elements that select a tone have `style={{ cursor: "pointer" }}` and `aria-label` but **no `tabIndex`, no `role="button"`, and no `onKeyDown` handler**. They are completely invisible to keyboard and switch-access users. WCAG 2.1.1 (Keyboard). |
| CC7 | 🔴 Critical | **Voice-lead lines are mouse-only.** `<line onMouseEnter={...} onMouseLeave={...}>` elements have `style={{ cursor: "pointer" }}` but no `tabIndex`, no `role`, and no keyboard equivalent. Hover-only interactions violate WCAG 2.1.1 and 1.4.13 (Content on Hover). |
| CC8 | ⚠️ Moderate | **Chord polygons carry no accessible description.** The `<polygon>` shapes that visualise chord structure are purely decorative (`aria-hidden` is inherited from the SVG), but no text alternative exists elsewhere to convey what chord shape is being shown for users who cannot see the visualisation. WCAG 1.1.1. |
| CC9 | ⚠️ Moderate | **Ring note labels are SVG `<text>` elements with no role.** The pitch-class names displayed around the ring (C, C♯, D…) are rendered as SVG `<text>` nodes inside a non-focusable group. Screen readers may or may not expose them; they cannot be tabbed to. This is acceptable only if the same information is available via the form controls, which it is. |
| CC10 | ℹ️ Info | The `<svg aria-label="Chromatic Circle">` root has a label, but no `role="img"` or `role="application"` is set. Without a matching role, some screen readers may ignore the label. Adding `role="img"` (if purely decorative) or `role="application"` (if interactive) clarifies intent. |
| CC11 | ℹ️ Info | `<g aria-label="From chord centroid">` and `<g aria-label="To chord centroid">` provide labels for centroid groups but the groups have no `role`, so the labels may be silently ignored by screen readers. |
| CC12 | ℹ️ Info | The `onClick={deselectTone}` on the SVG root doubles as a "click-away to close" affordance. No keyboard equivalent (e.g. `Escape`) for deselecting has been verified — although `onKeyDown` listening for `Escape` is present in the component (`lines 201–207`), there is no way for a keyboard user to reach the SVG root element to trigger it. The Escape handler fires correctly when focus is anywhere in the document, so this is currently acceptable. |

#### `prefers-reduced-motion` — Good

| # | Severity | Finding |
|---|----------|---------|
| CC13 | ✅ Pass | The component reads `window.matchMedia("(prefers-reduced-motion: reduce)")` at initialisation and subscribes to changes. Polygon morphing animation is suppressed when this preference is set. WCAG 2.3.3 (AAA) and best practice for WCAG 2.3.1. |

---

### `ChordSelector.tsx`

**File:** `client/src/features/chord/components/ChordSelector.tsx`

| # | Severity | Finding |
|---|----------|---------|
| CS1 | ✅ Pass | Uses native `<select>` with `<optgroup>` for grouped chord options. |
| CS2 | ✅ Pass | Accepts and forwards an `aria-label` prop. |
| CS3 | ⚠️ Minor | When rendered inside `ChromaticCircle.tsx` the "From chord" wrapper `<label>` is a plain `<label>` block, not linked to the `<ChordSelector>` via `htmlFor`/`id` because `ChordSelector` renders a `<select>` without exposing an `id` prop to callers in that code path. Both `aria-label` on the `<select>` and the visual `<label>` exist, but they are not programmatically associated. |

---

### `CurrentChordPanel.tsx`

**File:** `client/src/features/current-chord/components/CurrentChordPanel.tsx`

| # | Severity | Finding |
|---|----------|---------|
| CP1 | ✅ Pass | Panel root has `aria-label="Current chord panel"` and `aria-live="polite"`. |
| CP2 | ✅ Pass | Add button uses native `<button>` with `disabled`, `aria-disabled`, and a descriptive dynamic `aria-label`. |
| CP3 | ✅ Pass | `role="status"` on the "Progression is full" message. |
| CP4 | ⚠️ Moderate | `aria-live="polite"` on the entire panel means that every internal state change (chord name, root, quality, button label) will be announced. When a user rapidly changes chords, the screen reader may queue up many announcements. Consider scoping `aria-live` to only the chord-name text node. |
| CP5 | ⚠️ Minor | The add button has minimum dimensions of `44px × 44px` (set in CSS), meeting WCAG 2.5.5 (AAA) / 2.5.8 (AA, WCAG 2.2). ✅ |

---

### `ChordThumbnail.tsx`

**File:** `client/src/features/current-chord/components/ChordThumbnail.tsx`

| # | Severity | Finding |
|---|----------|---------|
| CT1 | ⚠️ Moderate | The SVG thumbnail is marked `aria-hidden="true"` in both the empty and populated states. This is correct for a decorative visual, **but** it means screen-reader users have no programmatic access to the chord's visual structure (polygon shape). This is acceptable only when the chord name and quality are conveyed via adjacent visible text, which they are in `CurrentChordPanel` and `ChordTile`. |
| CT2 | ℹ️ Info | Radial gradient `<defs>` elements have IDs constructed as `chord-tone-{quality}`. If multiple thumbnails with the same quality appear on the page simultaneously (e.g. two chord tiles with the same quality), gradient IDs will collide, causing the wrong gradient to be applied. This is primarily a rendering bug but also impacts the accuracy of the visual information conveyed. |

---

### `ProgressionSidebar.tsx`

**File:** `client/src/features/progression-sidebar/components/ProgressionSidebar.tsx`

| # | Severity | Finding |
|---|----------|---------|
| PS1 | ✅ Pass | Uses semantic `<aside aria-label="Chord progression">`. |
| PS2 | ✅ Pass | Uses `<h2>` for the "Progression" heading. |
| PS3 | ✅ Pass | `aria-live="polite"` on empty state; `role="status" aria-live="polite"` on "Maximum reached" indicator. |
| PS4 | ✅ Pass | Decorative music note `♩` is wrapped in `aria-hidden="true"`. |
| PS5 | 🔴 Critical | **Chord list is not a semantic list.** The chord list container uses `<div aria-label="Chord list">`. Screen readers will not announce the number of items or indicate list navigation. Use `<ol>` (ordered) since sequence matters, or at minimum `role="list"`. WCAG 1.3.1. |
| PS6 | ⚠️ Moderate | The `<span className={styles.count}>` displays `{chords.length}/{maxLength}` visually but has its own `aria-label` (`"N of M chords"`). The adjacent `<h2>Progression</h2>` and the count span are not programmatically associated. Screen readers may announce the heading and the count separately, potentially confusingly. |

---

### `ChordTile.tsx`

**File:** `client/src/features/progression-sidebar/components/ChordTile.tsx`

| # | Severity | Finding |
|---|----------|---------|
| CHT1 | 🔴 Critical | **Root element is `<div>`, not `<li>`.** When the parent list is converted to `<ol>`, each tile must become an `<li>` to preserve list semantics. WCAG 1.3.1. |
| CHT2 | ✅ Pass | All three control buttons (up, down, delete) use native `<button>` with `aria-label` and `title`. |
| CHT3 | ✅ Pass | `disabled` and `aria-disabled` are both set on directional buttons when at boundaries. |
| CHT4 | ⚠️ Moderate | **Controls hidden by opacity.** `.controls { opacity: 0 }` hides the buttons visually by default. They become visible on hover (`.tile:hover`) or keyboard focus (`.tile:focus-within`). This means a keyboard user can discover the buttons by tabbing into the tile, which is acceptable, but the initial visual state may confuse sighted keyboard users who see the tile but not the controls before tabbing. Consider always showing controls (opacity: 1) or providing a more prominent focus hint. |
| CHT5 | ℹ️ Info | `focusVisible` outline uses `var(--accent-color, #6b7280)`. The fallback `#6b7280` on the tile dark background may have insufficient contrast. The accent color itself (computed dynamically from chord quality) should be verified for each quality. |

---

### `ToneInfoPanel.tsx`

**File:** `client/src/features/chord-inspection/components/ToneInfoPanel.tsx`

| # | Severity | Finding |
|---|----------|---------|
| TIP1 | ✅ Pass | Root `<div>` has `aria-label="Tone information panel"` and `aria-live="polite"`. |
| TIP2 | ✅ Pass | Uses semantic `<h3>` for the tone name and `<p>` for label/value pairs. |
| TIP3 | ⚠️ Moderate | The placeholder text reads: *"Click a chord vertex to inspect its tone."* Because SVG vertices currently have no keyboard interaction (see CC6), this instruction is inaccessible to keyboard users. The text should be updated when keyboard support is added, or omitted if the panel is hidden for keyboard users. |
| TIP4 | ⚠️ Moderate | The panel is `position: absolute; right: 20; top: 100`. On narrow viewports the panel may overlap the SVG or be clipped. There is no responsive fallback. This primarily affects mobile/small-screen users but also the reflow criterion for WCAG 1.4.10. |
| TIP5 | ℹ️ Info | Label/value pairs (`Role`, `Interval from root`, `Frequency`) are consecutive `<p>` elements but are not associated with a `<dl>/<dt>/<dd>` description-list structure. This is a minor semantic issue; current markup is understandable but could be improved. |
| TIP6 | ℹ️ Info | The panel background `#F3F4F6` and the text `#6B7280` (label color) yields approximately **3.0:1** contrast — below the 4.5:1 required for WCAG AA normal text. Value text `#1F2937` on `#F3F4F6` yields approximately **11:1** — comfortably passes. |

---

### `IntervalLabel.tsx`

**File:** `client/src/features/chord-intervals/components/IntervalLabel.tsx`

| # | Severity | Finding |
|---|----------|---------|
| IL1 | ✅ Pass | `<g aria-label={`Interval: ${intervalName}`}>` provides a text alternative for the SVG badge. |
| IL2 | ℹ️ Info | The group has no `role`, so some screen readers may not expose the label. Adding `role="img"` would make the label reliably announced. |

---

## Cross-Cutting Concerns

### Keyboard Navigation

The table below summarises which interactive elements are keyboard-operable:

| Element | Mouse | Keyboard | Notes |
|---------|-------|----------|-------|
| `<select>` controls | ✅ | ✅ | Native form elements |
| `<input type="checkbox">` | ✅ | ✅ | Native form elements |
| `<button>` elements | ✅ | ✅ | Native buttons |
| Chord vertex `<circle>` (From Chord) | ✅ | ❌ | No `tabIndex`, no `role`, no `onKeyDown` |
| Chord vertex `<circle>` (To Chord) | ✅ | ❌ | Same issue |
| Voice-lead `<line>` (hover) | ✅ | ❌ | No keyboard equivalent for hover state |
| Tone deselection (Escape key) | ✅ | ✅ | `onKeyDown` present in component |
| Add to Progression button | ✅ | ✅ | Native `<button>` |
| Move Up / Down / Delete buttons | ✅ | ✅ | Native `<button>` |

**Summary:** Every native HTML control is keyboard-accessible. The only keyboard gaps are within the SVG canvas, which is the primary interactive surface of the application. This is a significant blocker for WCAG 2.1.1 (Level A).

### Color and Contrast

Color contrast ratios are estimated against the dark-theme backgrounds. Use a tool such as [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/) or the browser DevTools accessibility panel for precise measurements.

#### Progression Sidebar (dark background `#1c1c24`)

| Element (CSS class) | Text Color | BG Color | Est. Ratio | WCAG AA (4.5:1) |
|---------------------|-----------|----------|-----------|-----------------|
| `.heading` (11px bold) | `#9ca3af` | `#1c1c24` | ~5.8:1 | ✅ Pass (large text 3:1) |
| `.count` (11px) | `#6b7280` | `#1c1c24` | ~3.1:1 | ❌ Fail |
| `.resetNote` (10px italic) | `#4b5563` | `#1c1c24` | ~2.1:1 | ❌ Fail |
| `.emptyMessage` (13px) | `#6b7280` | `#1c1c24` | ~3.1:1 | ❌ Fail |
| `.fullIndicator` (11px) | `#6b7280` | `#1c1c24` | ~3.1:1 | ❌ Fail |
| `.chordName` (14px bold) | `#e5e7eb` | `#1c1c24` | ~13:1 | ✅ Pass |

#### Tone Info Panel (light background `#F3F4F6`)

| Element | Text Color | BG Color | Est. Ratio | WCAG AA |
|---------|-----------|----------|-----------|---------|
| Labels (12px) | `#6B7280` | `#F3F4F6` | ~3.0:1 | ❌ Fail |
| Values (14px medium) | `#1F2937` | `#F3F4F6` | ~11:1 | ✅ Pass |
| Chord tag | `#4338CA` | `#E0E7FF` | ~4.8:1 | ✅ Pass |
| Placeholder (13px italic) | `#9CA3AF` | `#F3F4F6` | ~2.5:1 | ❌ Fail |

#### Current Chord Panel (light background, `#f8f9fa` / varies)

| Element | Text Color | BG Color | Est. Ratio | WCAG AA |
|---------|-----------|----------|-----------|---------|
| `.sectionLabel` (10px bold) | `#9ca3af` | `#f8f9fa` | ~2.7:1 | ❌ Fail |
| `.chordName` (28px bold) | `#1f2937` | `#f8f9fa` | ~15:1 | ✅ Pass (large text) |
| `.placeholder` (16px) | `#9ca3af` | `#f8f9fa` | ~2.7:1 | ❌ Fail |
| `.quality` (12px) | `#6b7280` | `#f8f9fa` | ~4.6:1 | ✅ Pass (borderline) |
| `.fullMessage` (11px) | `#9ca3af` | `#f8f9fa` | ~2.7:1 | ❌ Fail |

> **Note:** The chord panel background is dynamic (`--chord-panel-bg` CSS custom property computed from the chord quality and root note). The contrast ratios above use the default `#f8f9fa`. Some chord-quality tints may reduce contrast further; they should be checked individually.

### Motion and Animation

| Finding | Severity |
|---------|----------|
| Chord tile entry animation (`tileHighlight`) respects `@media (prefers-reduced-motion: reduce)` in CSS — animation is suppressed. | ✅ Pass |
| Chord polygon morphing animation in `useChordMorphing` and the SVG `fill` transition in `ChromaticCircle` both check `prefersReducedMotion` state and skip animations. | ✅ Pass |
| No indefinitely looping animations are present. | ✅ Pass |

### Screen-Reader Experience

| Topic | Assessment |
|-------|-----------|
| Page landmark structure | `<main>` and `<aside>` are present. No `<header>`, `<nav>`, or `<footer>`. Functional but sparse. |
| Heading hierarchy | `<h2>` (Progression) and `<h3>` (ToneInfoPanel) are present, but no `<h1>` exists. |
| Live regions | `aria-live="polite"` regions are present on CurrentChordPanel, ProgressionSidebar empty state, full indicator, and ToneInfoPanel. These should be verified not to fire redundantly. |
| Dynamic chord changes | When a user selects a chord on the chromatic circle, the chord name update in `CurrentChordPanel` is announced via `aria-live="polite"`. This is correct. |
| SVG canvas | Without `tabIndex` on the interactive circles, screen-reader users cannot focus them. The SVG is labelled but effectively non-interactive for AT users. |
| Error messages | No validation errors or error messages are present in the current UI. Not applicable. |

---

## WCAG 2.1 Compliance Summary

| Criterion | Level | Status | Notes |
|-----------|-------|--------|-------|
| 1.1.1 Non-text Content | A | ⚠️ Partial | Decorative SVGs are `aria-hidden`; interactive SVG vertices lack text alternatives |
| 1.3.1 Info and Relationships | A | ⚠️ Partial | Chord list should be `<ol>`, tiles should be `<li>`; no `<h1>` |
| 1.3.3 Sensory Characteristics | A | ⚠️ Partial | ToneInfoPanel placeholder refers to "click" only |
| 1.4.1 Use of Color | A | ✅ Pass | Color is not the only means of conveying information |
| 1.4.3 Contrast (Minimum) | AA | ❌ Fail | Multiple text elements below 4.5:1 in dark and light themes |
| 1.4.4 Resize Text | AA | ✅ Pass | Relative units (`em`, `rem`) and viewport meta used |
| 1.4.10 Reflow | AA | ⚠️ Partial | ToneInfoPanel is absolutely positioned; may not reflow on narrow viewports |
| 1.4.11 Non-text Contrast | AA | ⚠️ Partial | Control button borders and focus rings not independently verified |
| 1.4.13 Content on Hover | AA | ❌ Fail | Voice-lead line hover state has no keyboard equivalent |
| 2.1.1 Keyboard | A | ❌ Fail | SVG chord vertices and voice-lead lines are not keyboard-accessible |
| 2.1.2 No Keyboard Trap | A | ✅ Pass | No focus traps detected |
| 2.4.1 Bypass Blocks | A | ⚠️ Partial | No skip-to-content link (low priority given current single-region layout) |
| 2.4.2 Page Titled | A | ❌ Fail | `<title>client</title>` is not descriptive |
| 2.4.3 Focus Order | A | ✅ Pass | Tab order follows visual/DOM order |
| 2.4.6 Headings and Labels | AA | ⚠️ Partial | No `<h1>`; heading hierarchy incomplete |
| 2.4.7 Focus Visible | AA | ✅ Pass | `focus-visible` outline on all interactive elements |
| 2.5.3 Label in Name | A | ✅ Pass | Visible labels match `aria-label` values |
| 2.5.5 Target Size | AAA | ✅ Pass | Add button meets 44×44 px minimum |
| 3.1.1 Language of Page | A | ✅ Pass | `lang="en"` on `<html>` |
| 3.3.1 Error Identification | A | N/A | No form validation in scope |
| 4.1.2 Name, Role, Value | A | ⚠️ Partial | Clickable SVG `<circle>` elements have labels but no `role`; `<g>` labels may be ignored |

---

## Priority Recommendations

The following items are ranked by impact on real users. Each recommendation references the relevant WCAG criteria and the file(s) to modify.

### P1 — Critical (Keyboard Inaccessibility)

**Recommended fix:** Make chord vertices keyboard-operable.  
**File:** `client/src/features/chromatic-circle/components/ChromaticCircle.tsx`  
**Action:** Add `tabIndex={0}`, `role="button"`, and an `onKeyDown` handler (respond to `Enter`/`Space`) to each `<circle>` that represents a clickable chord vertex. Group all vertices in a `<g role="group" aria-label="From Chord notes">` for logical navigation.  
**Criteria:** WCAG 2.1.1 (A), 4.1.2 (A)

---

**Recommended fix:** Make voice-lead lines keyboard-operable or remove interaction.  
**File:** `client/src/features/chromatic-circle/components/ChromaticCircle.tsx`  
**Action:** Either (a) add `tabIndex`, `role="button"`, and keyboard handlers to each `<line>`, or (b) if the hover state is purely decorative/enhancement, suppress it and expose the same information in a non-hover UI element.  
**Criteria:** WCAG 2.1.1 (A), 1.4.13 (AA)

---

### P2 — Serious (Structural Semantics)

**Recommended fix:** Replace the chord list `<div>` with `<ol>`, and tile `<div>` with `<li>`.  
**Files:** `ProgressionSidebar.tsx`, `ChordTile.tsx`  
**Action:** Change `<div className={styles.chordList}>` → `<ol className={styles.chordList}>`, and each `<div className={styles.tile}>` → `<li className={styles.tile}>`. Adjust CSS selectors if they rely on `div`.  
**Criteria:** WCAG 1.3.1 (A)

---

**Recommended fix:** Fix the page title.  
**File:** `client/index.html`  
**Action:** Change `<title>client</title>` → `<title>MIDI Progression Editor</title>`.  
**Criteria:** WCAG 2.4.2 (A)

---

**Recommended fix:** Add an `<h1>` to the application.  
**File:** `client/src/app/App.tsx` (or inside `ChromaticCircle.tsx` header area)  
**Action:** Insert a visually styled (or visually hidden) `<h1>MIDI Progression Editor</h1>` so the heading hierarchy begins at level 1.  
**Criteria:** WCAG 2.4.6 (AA)

---

### P3 — Moderate (Color Contrast)

**Recommended fix:** Increase contrast of low-contrast text in the progression sidebar.  
**File:** `client/src/features/progression-sidebar/components/ProgressionSidebar.module.css`  
**Action:**  
- `.resetNote`: lighten from `#4b5563` to at least `#9ca3af` (already used for `.heading`) — or use `#6b7280` and verify the ratio reaches 4.5:1 against `#1c1c24`.  
- `.count`, `.emptyMessage`, `.fullIndicator`: lighten from `#6b7280` to at least `#9ca3af` or equivalent.  
**Criteria:** WCAG 1.4.3 (AA)

---

**Recommended fix:** Increase contrast of label text in the `ToneInfoPanel`.  
**File:** `client/src/features/chord-inspection/components/ToneInfoPanel.tsx`  
**Action:** Change `LABEL_STYLE.color` from `#6B7280` to `#4B5563` or darker, and `PLACEHOLDER_STYLE.color` from `#9CA3AF` to `#6B7280` or darker. Verify ratios against `#F3F4F6`.  
**Criteria:** WCAG 1.4.3 (AA)

---

**Recommended fix:** Increase contrast of secondary text in `CurrentChordPanel`.  
**File:** `client/src/features/current-chord/components/CurrentChordPanel.module.css`  
**Action:**  
- `.sectionLabel`: `#9ca3af` on light background fails — darken to `#6b7280` or use `#4b5563`.  
- `.placeholder`: same adjustment.  
- `.fullMessage`: same adjustment.  
**Note:** The panel background is dynamic; verify all chord-quality tints individually after updating.  
**Criteria:** WCAG 1.4.3 (AA)

---

### P4 — Minor / Enhancement

- **Update ToneInfoPanel placeholder text** to mention keyboard interaction once P1 is resolved. (`"Click or press Enter on a chord vertex to inspect its tone."`)
- **Add `role="img"` to the `<svg>` root** in `ChromaticCircle.tsx` if the SVG is treated as non-interactive, or `role="application"` if the vertices are made interactive, to ensure `aria-label="Chromatic Circle"` is exposed by all screen readers.
- **Add `role="img"` to `<g aria-label="Interval: …">` in `IntervalLabel.tsx`** to ensure the label is reliably announced.
- **Scope `aria-live` in `CurrentChordPanel`** to only the chord-name span rather than the entire panel, to reduce announcement noise.
- **Add a skip-to-content link** in `index.html` or `App.tsx` targeting `<main>`, for future-proofing as navigation grows.
- **Verify gradient ID uniqueness** in `ChordThumbnail.tsx` to prevent SVG rendering artifacts when multiple tiles share the same chord quality.

---

## Strengths Already in Place

The following practices represent a solid accessibility baseline that should be maintained as the codebase grows:

| Practice | Location |
|----------|----------|
| `lang="en"` on `<html>` | `index.html` |
| `prefers-reduced-motion` media query respected in both CSS and JS | `ChordTile.module.css`, `ChromaticCircle.tsx` |
| All `<button>` elements use native HTML with descriptive `aria-label` | `ChordTile`, `CurrentChordPanel`, `ChromaticCircle` |
| All `<input>` and `<select>` controls have `<label>` associations | `ChromaticCircle.tsx` |
| `<aside aria-label="Chord progression">` landmark for sidebar | `ProgressionSidebar.tsx` |
| `aria-live="polite"` for dynamic content regions | `CurrentChordPanel`, `ProgressionSidebar`, `ToneInfoPanel` |
| `role="status"` on status messages | `ProgressionSidebar`, `CurrentChordPanel` |
| `aria-hidden="true"` on decorative icons | `ProgressionSidebar`, `ChordThumbnail` |
| `aria-disabled` and `disabled` paired on buttons | `ChordTile`, `CurrentChordPanel` |
| `focus-visible` CSS outline on all interactive elements | `ChordTile.module.css`, `CurrentChordPanel.module.css`, `styles/index.css` |
| Minimum 44×44 px touch target on primary action button | `CurrentChordPanel.module.css` |
| `<optgroup>` grouping in chord selector | `ChordSelector.tsx` |
| Semantic HTML: `<aside>`, `<main>`, `<h2>`, `<h3>` | Throughout |
| Responsive layout stack for small viewports | `App.module.css` |
