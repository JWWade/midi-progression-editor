# ISSUE-E9-01 — Accessibility Remediation (WCAG 2.1 AA)

## Objective

Resolve the accessibility findings documented in the [2026-03-08 accessibility audit](https://github.com/JWWade/midi-progression-editor/blob/e7acdbb8c3078c3023cef236dbdeab2cb1e36669/docs/accessibility-audit.md) so that the application meets WCAG 2.1 Level AA compliance for all non-SVG-canvas interactions, and reaches Level A compliance for the SVG canvas.

## Background

A full structural accessibility audit was conducted on the frontend (`client/src/`). Three classes of critical issue were identified:

1. **Keyboard inaccessibility** — Clickable SVG chord vertices (`<circle>`) and voice-lead `<line>` elements have no `tabIndex`, no `role`, and no keyboard event handlers. Keyboard and switch-access users cannot interact with the primary UI surface.
2. **Missing semantic structure** — The chord list is rendered as a `<div>` container holding `<div>` tiles. Screen readers cannot announce list structure or item count. Related: no `<h1>` and a non-descriptive `<title>`.
3. **Color contrast failures** — Multiple text elements in the progression sidebar, tone info panel, and current chord panel fall below the WCAG AA 4.5:1 minimum in both light and dark themes.

The following sections list all findings by priority. Each maps to one or more audit finding IDs from the source document.

---

## P1 — Critical: Keyboard Inaccessibility

### SVG chord vertices (audit refs: CC6, CC10)

**Files:** `client/src/features/chromatic-circle/components/ChromaticCircle.tsx`

- Add `tabIndex={0}`, `role="button"`, and an `onKeyDown` handler responding to `Enter` and `Space` to each `<circle>` that represents a clickable chord vertex.
- Wrap "From Chord" vertices in `<g role="group" aria-label="From chord notes">` and "To Chord" vertices in `<g role="group" aria-label="To chord notes">`.
- Add `role="application"` to the `<svg>` root (it is interactive), ensuring `aria-label="Chromatic Circle"` is exposed by all screen readers.

### SVG voice-lead lines (audit refs: CC7)

**Files:** `client/src/features/chromatic-circle/components/ChromaticCircle.tsx`

- Evaluate whether the `onMouseEnter`/`onMouseLeave` hover interaction conveys information not available elsewhere. If purely decorative/enhancement — replace with a non-hover alternative (e.g., show voice-leading data in the `ToneInfoPanel` on chord vertex focus). If essential — add `tabIndex`, `role="button"`, and keyboard handlers.

### SPIKE permissible

If the keyboard interaction model for SVG vertices requires design decisions (e.g., roving `tabIndex` vs. individual focus, arrow-key navigation within the circle), a short spike is acceptable before implementation.

---

## P2 — Serious: Semantic Structure

### Chord list markup (audit refs: PS5, CHT1)

**Files:**
- `client/src/features/progression-sidebar/components/ProgressionSidebar.tsx`
- `client/src/features/progression-sidebar/components/ChordTile.tsx`
- `client/src/features/progression-sidebar/components/ProgressionSidebar.module.css`

- Change `<div className={styles.chordList}>` → `<ol className={styles.chordList}>`.
- Change the `ChordTile` root element from `<div>` to `<li>`. Update CSS selectors that target `div` within the list if necessary.

Note: `ProgressionSidebar.tsx` already uses `<ol>` at time of writing (the audit pre-dates some changes). Verify the current markup before editing.

### Page title (audit ref: H1)

**File:** `client/index.html`

- Change `<title>client</title>` → `<title>MIDI Progression Editor</title>`.

### Application heading (audit ref: A2)

**File:** `client/src/app/App.tsx` or `client/src/app/components/AppHeader.tsx`

- Add a visually appropriate (or visually hidden with `.sr-only`) `<h1>MIDI Progression Editor</h1>` so the heading hierarchy begins at level 1 before the `<h2 Progression>` in the sidebar.

---

## P3 — Moderate: Color Contrast

All contrast ratios below are WCAG AA failures (< 4.5:1 for normal text, < 3:1 for large/bold text where applicable). Verify using the browser DevTools accessibility panel or [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/) after each change.

### Progression sidebar — dark theme (audit ref: PS color table)

**File:** `client/src/features/progression-sidebar/components/ProgressionSidebar.module.css`

| CSS class | Current color | Issue | Suggested fix |
|---|---|---|---|
| `.count` | `#6b7280` | ~3.1:1 on `#1c1c24` | Lighten to `#9ca3af` or equivalent |
| `.resetNote` | `#4b5563` | ~2.1:1 on `#1c1c24` | Lighten to `#9ca3af` |
| `.emptyMessage` | `#6b7280` | ~3.1:1 on `#1c1c24` | Lighten to `#9ca3af` |
| `.fullIndicator` | `#6b7280` | ~3.1:1 on `#1c1c24` | Lighten to `#9ca3af` |

### ToneInfoPanel (audit ref: TIP6)

**File:** `client/src/features/chord-inspection/components/ToneInfoPanel.tsx` (inline styles)

- Label text (`#6B7280` on `#F3F4F6`): ~3.0:1 — darken to `#4B5563` or darker.
- Placeholder text (`#9CA3AF` on `#F3F4F6`): ~2.5:1 — darken to `#6B7280`.

### CurrentChordPanel (audit ref: CP color table)

**File:** `client/src/features/current-chord/components/CurrentChordPanel.module.css`

| CSS class | Current color | Issue |
|---|---|---|
| `.sectionLabel` | `#9ca3af` | ~2.7:1 on `#f8f9fa` |
| `.placeholder` | `#9ca3af` | ~2.7:1 on `#f8f9fa` |
| `.fullMessage` | `#9ca3af` | ~2.7:1 on `#f8f9fa` |

Note: the panel background is dynamic (`--chord-panel-bg`). After updating base values, spot-check contrast against several chord-quality background tints.

---

## P4 — Minor / Enhancements

These do not block AA compliance but improve the experience and should be addressed in the same pass if effort permits.

- **`role="img"` on `<g aria-label="Interval: …">`** in `IntervalLabel.tsx` (audit ref: IL2) — ensures the label is reliably announced.
- **`role="img"` on centroid `<g>` elements** in `ChromaticCircle.tsx` (audit ref: CC11).
- **Scope `aria-live` in `CurrentChordPanel`** to the chord-name span only, reducing announcement noise on rapid chord changes (audit ref: CP4).
- **Verify gradient ID uniqueness** in `ChordThumbnail.tsx` — IDs like `chord-tone-{quality}` collide when multiple tiles share a quality. Append a unique instance counter (audit ref: CT2).
- **Update `ToneInfoPanel` placeholder text** to mention keyboard interaction once P1 is implemented (audit ref: TIP3).
- **Add a skip-to-content link** in `index.html` or `App.tsx` targeting `<main>` for future-proofing (audit ref: H3).

---

## Files To Edit

| File | Change |
|---|---|
| `client/index.html` | Fix `<title>` |
| `client/src/app/App.tsx` or `AppHeader.tsx` | Add `<h1>` |
| `client/src/features/chromatic-circle/components/ChromaticCircle.tsx` | Keyboard access for SVG vertices and voice-lead lines; `role="application"` on SVG root; centroid `<g>` roles |
| `client/src/features/progression-sidebar/components/ProgressionSidebar.tsx` | Verify `<ol>` usage |
| `client/src/features/progression-sidebar/components/ChordTile.tsx` | `<div>` → `<li>` root element |
| `client/src/features/progression-sidebar/components/ProgressionSidebar.module.css` | Contrast fixes |
| `client/src/features/chord-inspection/components/ToneInfoPanel.tsx` | Contrast fixes on inline styles |
| `client/src/features/current-chord/components/CurrentChordPanel.module.css` | Contrast fixes |
| `client/src/features/chord-intervals/components/IntervalLabel.tsx` | Add `role="img"` |
| `client/src/features/current-chord/components/ChordThumbnail.tsx` | Unique gradient IDs |

## Files To Add

None required. A spike document may be added to `docs/spikes/` if the keyboard interaction model for SVG vertices requires design exploration.

---

## Acceptance Criteria

- [ ] All `<circle>` chord vertices are Tab-focusable and activate on `Enter`/`Space`
- [ ] No hover-only information exists without a keyboard-accessible equivalent
- [ ] Chord list is `<ol>` / `<li>` or carries equivalent `role="list"` / `role="listitem"` semantics
- [ ] `<title>` reads "MIDI Progression Editor"
- [ ] A visible or visually-hidden `<h1>` exists in the document
- [ ] All text elements in the progression sidebar (dark theme) meet 4.5:1 contrast against `#1c1c24`
- [ ] ToneInfoPanel label and placeholder text meet 4.5:1 contrast against `#F3F4F6`
- [ ] CurrentChordPanel secondary text meets 4.5:1 contrast against its background
- [ ] `npm run lint` passes with `--max-warnings=0`
- [ ] `npm test` passes (all existing tests green)
- [ ] `npm run build` succeeds with no TypeScript errors

## Verification Commands

```bash
cd client
npm run lint
npm run build
npm test
```

Manual verification: open the app in a browser, disable the pointer device, and confirm all chord-vertex interactions are reachable and operable via keyboard alone. Run the axe browser extension against the rendered page and confirm zero critical or serious violations.
