# Epic 2 — UI Usability Polish

## Theme

Clarify the core loop, strengthen directional flow, reduce cognitive load, and refine expressive visual language.

This epic is intentionally small, self‑contained, and focused on improving the *feel* of the tool rather than adding new musical logic. All changes build on the existing React 19 + TypeScript + CSS Modules stack — **no new UI library (e.g. MUI) is required**. Where the original brief references Material UI components, equivalent implementations using CSS Modules and custom React patterns are described instead.

---

## Tech Stack Context

| Layer | Details |
|-------|---------|
| Framework | React 19 (functional components + hooks) |
| Language | TypeScript 5.9, strict mode |
| Styling | CSS Modules (`.module.css`) + inline `React.CSSProperties` |
| Build | Vite 7 |
| Audio | Web Audio API via `useAudioPlayback` hook |
| State | React `useState` / `useRef` / custom hooks |
| No MUI | Use CSS Modules for buttons, toggles, tooltips, toasts, and pills |

---

## Milestone 1 — Core Clarity & Flow (Highest Impact)

These changes directly improve the core loop: **circle → panel → progression**.

---

### ISSUE-46 — Make "Add to Progression →" the Primary Action

**Affected files**
- `client/src/features/current-chord/components/CurrentChordPanel.tsx`
- `client/src/features/current-chord/components/CurrentChordPanel.module.css`

**Summary**

The "Add to Progression →" button is the most important action in the entire UI. It should look like it. Currently it shares the same visual weight as secondary controls. Restyle it as the clear primary call-to-action and add a subtle directional animation on click.

**Requirements**
- Restyle the button using a new `.buttonPrimary` CSS Module class:
  - Filled background using the chord's quality color (`ChordQualityColors[quality].base`)
  - White or high-contrast text, `font-weight: 600`, larger padding than secondary buttons
  - Positioned to the right side of the panel using `margin-left: auto`
- Add a brief arrow-slide animation on click via a CSS keyframe (`@keyframes arrowSlide`) toggled with a short-lived CSS class
- Keep the existing disabled state (when `chord === null` or `isProgressionFull === true`)
- Add a `title` attribute: `"Add chord to progression"` for native tooltip behavior

**Acceptance Criteria**
- [ ] Button is visually dominant relative to other panel controls
- [ ] Arrow animation triggers on click and resets automatically
- [ ] Button is right-aligned within the panel
- [ ] Disabled appearance and behavior unchanged when progression is full or no chord is selected
- [ ] `title` tooltip is present and readable
- [ ] ESLint passes with `--max-warnings=0`
- [ ] TypeScript strict mode satisfied

---

### ISSUE-47 — Highlight New Progression Tile on Add

**Affected files**
- `client/src/features/progression-sidebar/components/ChordTile.tsx`
- `client/src/features/progression-sidebar/components/ChordTile.module.css`
- `client/src/features/progression-sidebar/components/ProgressionSidebar.tsx`
- `client/src/app/App.tsx`

**Summary**

When a chord is added, the new tile in the sidebar should flash briefly so the user knows exactly what changed. The sidebar should also scroll to reveal the new tile.

**Requirements**
- Pass a `isNew` boolean prop to `ChordTile`; apply a CSS keyframe highlight animation (e.g., `@keyframes tileHighlight` — a 250–350 ms background flash using the chord's quality color at low alpha)
- In `ProgressionSidebar`, keep a `newTileIndex` state; clear it after the animation ends (`onAnimationEnd` handler)
- Use `useRef` + `scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: "nearest" })` on the newly added tile's DOM node
- Move keyboard focus to the new tile using `ref.current.focus()` after add

**Acceptance Criteria**
- [ ] New tile flashes for 250–350 ms, then returns to its normal appearance
- [ ] Sidebar scrolls to show the new tile when the list is long
- [ ] Keyboard focus moves to the new tile after add
- [ ] Animation does not replay on re-renders
- [ ] ESLint passes with `--max-warnings=0`
- [ ] TypeScript strict mode satisfied

---

### ISSUE-48 — Replace "0/8" with a Clearer Capacity Indicator

**Affected files**
- `client/src/features/progression-sidebar/components/ProgressionSidebar.tsx`
- `client/src/features/progression-sidebar/components/ProgressionSidebar.module.css`

**Summary**

The plain `0/8` counter in the sidebar header does not communicate that it represents a capacity limit. Replace it with a small pill-style progress indicator that visually fills as chords are added.

**Requirements**
- Replace the `<span className={styles.count}>` with a new `<CapacityPill>` sub-component (or inline JSX) that:
  - Renders a thin horizontal bar divided into `maxLength` segments, filled up to `chords.length`
  - Also shows the text label `{chords.length}/{maxLength}` beside or inside the pill
  - Uses the existing quality color grammar (neutral grey → accent color as the bar fills)
- Add a `title` attribute: `"Progression can contain up to 8 chords"`
- The "Add" button in `CurrentChordPanel` should also disable and show the pill-filled state when the limit is reached (already handled in ISSUE-46; note the dependency)

**Acceptance Criteria**
- [ ] Capacity pill replaces the raw counter
- [ ] Bar fills progressively as chords are added
- [ ] `title` tooltip is present
- [ ] Full state is visually distinct (e.g., pill turns accent color or shows a subtle warning tint)
- [ ] ESLint passes with `--max-warnings=0`
- [ ] TypeScript strict mode satisfied

---

### ISSUE-49 — Clarify the From → To Relationship

**Affected files**
- `client/src/features/chromatic-circle/components/ChromaticCircle.tsx`

**Summary**

The two-chord "From / To" layout is non-obvious to first-time users. Small microcopy labels and a hover preview will make the relationship immediately clear without any structural change to the component.

**Requirements**
- Add a small microcopy string `"From (current) → To (preview)"` above the two chord selectors inside `ChromaticCircle.tsx`; style with a subdued `font-size` and `color: var(--text-muted)` (or equivalent CSS custom property)
- On hover of the "To" chord selector or its note label, apply a preview highlight to the corresponding polygon using the same color grammar already used by the "From" chord (the `ChordQualityColors` palette)
- Implement the hover preview by lifting a `hoveredToChord` boolean state and conditionally applying an opacity/stroke change to the "To" polygon's SVG element — no new API call needed

**Acceptance Criteria**
- [ ] Microcopy label `"From (current) → To (preview)"` is visible between/above the two selectors
- [ ] Hovering the "To" selector or its SVG elements applies a preview tint
- [ ] Hover preview disappears on mouse-out
- [ ] No existing chord-interaction logic is broken
- [ ] ESLint passes with `--max-warnings=0`
- [ ] TypeScript strict mode satisfied

---

### ISSUE-50 — Convert Checkboxes into Compact Toggle Buttons

**Affected files**
- `client/src/features/chromatic-circle/components/ChromaticCircle.tsx`

**Summary**

The four checkboxes (Show Voice Leads, Show Extension, Show Centroid, Show Intervals) are functional but visually disconnected from the rest of the UI. Replacing them with a single row of compact toggle buttons improves scannability and brings the control strip in line with the design language.

**Requirements**
- Replace the four `<input type="checkbox" />` controls with a custom `<ToggleButtonGroup>` implemented in CSS Modules:
  - A wrapper `<div>` with `display: flex; gap: 4px`
  - Each `<button>` with `.toggleBtn` / `.toggleBtnActive` CSS Module classes
  - Labels: `Voice`, `Ext`, `Centroid`, `Intervals` (short form as in the original brief)
  - Small SVG icon or Unicode glyph prefix for each (e.g., ↕ Voice, ⊕ Ext, ● Centroid, ♩ Intervals)
  - `title` attribute on each button for native tooltip
- State variables (`showVoiceLeads`, `showExtension`, `showCentroid`, `showIntervals`) remain unchanged — only the rendering changes
- Group the entire strip into a single `<div role="group" aria-label="Display options">` for accessibility

**Acceptance Criteria**
- [ ] All four toggles render as buttons in a compact horizontal strip
- [ ] Active state is visually distinct from inactive (filled vs outlined, or color change)
- [ ] All toggle functions work identically to the previous checkbox implementation
- [ ] `role="group"` and individual `aria-label` / `title` attributes are present
- [ ] ESLint passes with `--max-warnings=0`
- [ ] TypeScript strict mode satisfied

---

## Milestone 2 — Feedback & Micro-Interactions (Feel Improvements)

These changes make the UI feel alive, responsive, and musical.

---

### ISSUE-51 — Add Play-State Feedback

**Affected files**
- `client/src/features/chromatic-circle/components/ChromaticCircle.tsx`
- `client/src/features/audio/hooks/useAudioPlayback.ts`

**Summary**

The play buttons currently give no feedback while audio is playing. Morphing the icon to a stop symbol and adding a pulsing ring communicates clearly that playback is active.

**Requirements**
- Expose an `isPlaying` boolean from `useAudioPlayback` (check whether this is already returned; if not, add it as derived state from an `AudioBufferSourceNode.onended` callback or a `useRef` flag)
- While `isPlaying` is `true` on either the "From" or "To" play button:
  - Change the button label/icon from `▶` to `■` (stop square)
  - Apply a CSS keyframe animation (`@keyframes pulseRing`) that scales a pseudo-element or wrapper `<span>` from `scale(1)` to `scale(1.3)` and back, with `opacity` fade, on a ~1s loop
  - Show an inline label: `"Playing {chordName}"` next to the button, hidden when not playing
- Clicking the stop icon halts playback (call existing `stop()` or let the note end; at minimum, reset `isPlaying` state)

**Acceptance Criteria**
- [ ] Play button icon changes to stop while audio is playing
- [ ] Pulsing ring animation is visible while playing
- [ ] Inline label shows the chord name while playing
- [ ] Animation and label clear when playback ends
- [ ] ESLint passes with `--max-warnings=0`
- [ ] TypeScript strict mode satisfied

---

### ISSUE-52 — Add Hover Tooltips to Circle Nodes and Thumbnails

**Affected files**
- `client/src/features/chromatic-circle/components/ChromaticCircle.tsx`
- `client/src/features/current-chord/components/ChordThumbnail.tsx`

**Summary**

Circle nodes and chord thumbnails carry rich semantic information (note name, role, diatonic status) that is currently invisible. Adding lightweight hover tooltips surfaces this information on demand without cluttering the UI.

**Requirements**
- For each `<circle>` or `<g>` node in `ChromaticCircle.tsx`, add an SVG `<title>` element as a child containing: `"{noteName} — {role} ({diatonic/chromatic})"` where:
  - `noteName` comes from the existing note label array
  - `role` (root / 3rd / 5th / 7th) comes from `toneRoles.ts` in `features/chord-inspection/utils/`
  - diatonic/chromatic comes from `getDiatonicIndices()` in `scaleUtils.ts`
- For `ChordThumbnail.tsx`, add a `<title>` to the `<svg>` element with the full chord name
- Keyboard focus (`:focus-visible`) on each node should also expose the tooltip — use `tabIndex={0}` on the SVG `<g>` wrapper for each node

**Acceptance Criteria**
- [ ] Hovering a circle node shows its note name, role, and diatonic status
- [ ] Hovering a chord thumbnail shows the full chord name
- [ ] Keyboard focus on a circle node exposes the same information
- [ ] No visual regression to circle rendering
- [ ] ESLint passes with `--max-warnings=0`
- [ ] TypeScript strict mode satisfied

---

### ISSUE-53 — Add Preview and Delete Actions to Progression Tiles

**Affected files**
- `client/src/features/progression-sidebar/components/ChordTile.tsx`
- `client/src/features/progression-sidebar/components/ChordTile.module.css`
- `client/src/features/progression-sidebar/components/ProgressionSidebar.tsx`
- `client/src/app/App.tsx`

**Summary**

Tiles currently support move-up, move-down, and delete. A preview action (loads the chord back into the circle) would close the "add → view" feedback loop. Delete needs an undo path to prevent accidental data loss.

**Requirements**
- Add an `onPreview` callback prop to `ChordTile`; wire it up through `ProgressionSidebar` to `App.tsx` where it calls `setCurrentChord(chord)` (loading the tile's chord back into `CurrentChordPanel`)
- Render a preview icon button (👁 or `⤴`) in the tile action strip, left of the delete button
- Rename the delete icon button to use a trash / `✕` icon with `aria-label="Remove chord"`
- For delete, trigger a brief undo window: add a `deletedChord` state and a countdown (e.g., `useEffect` with `setTimeout` of 4 000 ms); render a small `<div role="status" className={styles.toast}>` at the bottom of the sidebar with `"Chord removed — Undo"` and a clickable "Undo" text button that re-inserts the chord at its original index
- After the timeout, clear `deletedChord` state

**Acceptance Criteria**
- [ ] Preview button loads the tile's chord into the circle panel
- [ ] Delete shows an undo toast for 4 s
- [ ] Undo re-inserts the chord at its original index
- [ ] Toast disappears after 4 s if undo is not triggered
- [ ] Icons have accessible `aria-label` text
- [ ] ESLint passes with `--max-warnings=0`
- [ ] TypeScript strict mode satisfied

---

### ISSUE-54 — Add "Undo Last Add" Toast

**Affected files**
- `client/src/app/App.tsx`
- `client/src/features/progression-sidebar/components/ProgressionSidebar.tsx`
- `client/src/features/progression-sidebar/components/ProgressionSidebar.module.css`

**Summary**

When the "Add to Progression →" button is pressed, a short-lived toast confirms the action and offers a single-step undo. This reduces the anxiety of accidentally adding the wrong chord.

**Requirements**
- In `App.tsx`, after `addChord()` succeeds, set a `lastAddedChord` state (`Chord | null`); derive `showAddToast` as `lastAddedChord !== null` to maintain a single source of truth
- Pass `lastAddedChord` and an `onUndoAdd` callback to `ProgressionSidebar`
- Render the toast as a `<div role="status" aria-live="polite">` inside the sidebar: `"Chord added — Undo"`
- `onUndoAdd` calls `deleteChord(chords.length - 1)` and clears `showAddToast`
- Auto-clear `showAddToast` after 4 000 ms using `useEffect` + `clearTimeout` on cleanup
- Animate toast entry/exit using a CSS keyframe (`@keyframes slideInToast`)
- Note: ISSUE-53 and ISSUE-54 share a toast pattern; consider extracting a shared `<Toast>` component in `client/src/shared/components/Toast.tsx` to avoid duplication

**Acceptance Criteria**
- [ ] Toast appears after each add with chord name and Undo link
- [ ] Undo removes the last-added chord
- [ ] Toast auto-dismisses after 4 s
- [ ] Toast has `role="status"` and `aria-live="polite"` for screen-reader announcements
- [ ] Multiple rapid adds don't stack toasts (only the most recent is shown)
- [ ] ESLint passes with `--max-warnings=0`
- [ ] TypeScript strict mode satisfied

---

## Milestone 3 — Polish, Clarity, and Accessibility

These changes refine the experience and reduce cognitive load.

---

### ISSUE-55 — Improve Scale Selector

**Affected files**
- `client/src/features/chromatic-circle/components/ChromaticCircle.tsx`

**Summary**

The plain `<select>` for scale type is functional but plain. Formatting the options as `"C • Natural Minor"` and adding an info tooltip makes the control more readable and self-documenting.

**Requirements**
- Keep the native `<select>` element (no custom dropdown needed); update the rendered `<option>` labels using the `SCALE_LABELS` map from `features/scale/types/` — format each as `"{keyRootName} • {scaleName}"` (e.g., "C • Natural Minor")
- Wrap the `<select>` in a `<label>` with visually-hidden text "Key and scale" for screen readers
- Add an info icon button (ℹ︎) beside the selector with `title="Diatonic notes appear fully opaque; chromatic notes are faded to {CHROMATIC_OPACITY * 100}%"` sourcing the constant from `scaleUtils.ts`

**Acceptance Criteria**
- [ ] Option labels show root note + scale name formatted with a bullet separator
- [ ] A `<label>` wraps the select for accessibility
- [ ] Info icon tooltip explains diatonic transparency
- [ ] Scale and root selection behavior is unchanged
- [ ] ESLint passes with `--max-warnings=0`
- [ ] TypeScript strict mode satisfied

---

### ISSUE-56 — Add Subtle Panel → Sidebar Animation

**Affected files**
- `client/src/app/App.module.css`
- `client/src/features/current-chord/components/CurrentChordPanel.tsx`
- `client/src/features/current-chord/components/CurrentChordPanel.module.css`

**Summary**

A faint ghost of the chord thumbnail drifting toward the sidebar on hover of the "Add" button reinforces the directional relationship between the panel and the sidebar. The animation should be quick (200–250 ms), subtle, and non-blocking.

**Requirements**
- On `mouseenter` of the "Add to Progression →" button, add a CSS class to the `CurrentChordPanel` wrapper that triggers a `@keyframes ghostDrift` animation on a pseudo-element or an absolutely-positioned clone of the `<ChordThumbnail>` SVG:
  - Translate `translateX` from `0` to approximately `40–60px` toward the sidebar
  - Fade from `opacity: 0.35` to `opacity: 0`
  - Duration: 200–250 ms, `ease-out`, runs once, no repeat
- No JS animation library needed — pure CSS keyframes
- Guard with a `prefers-reduced-motion` media query: skip the animation entirely if the user prefers reduced motion
- Do not block clicks or interfere with focus management

**Acceptance Criteria**
- [ ] Ghost thumbnail drifts right on hover of "Add" button
- [ ] Animation completes in ≤ 250 ms and does not loop
- [ ] Animation is suppressed under `prefers-reduced-motion: reduce`
- [ ] No interaction regression (click, focus, keyboard)
- [ ] ESLint passes with `--max-warnings=0`
- [ ] TypeScript strict mode satisfied

---

### ISSUE-57 — Improve Empty-State Guidance

**Affected files**
- `client/src/features/progression-sidebar/components/ProgressionSidebar.tsx`
- `client/src/features/progression-sidebar/components/ProgressionSidebar.module.css`

**Summary**

The current empty state (`♩ Your progression is empty...`) tells the user they have nothing added but does not tell them how to begin. A three-step mini guide removes this ambiguity.

**Requirements**
- Replace the current empty-state JSX block with a three-step guide rendered as an `<ol>` or a vertical `<div>` stack:
  1. `🎵 Select notes on the circle`
  2. `✓ Confirm chord`
  3. `→ Add to Progression`
- Style each step with a small icon/emoji, a numbered step indicator, and brief text
- Use subdued colors so the guide reads as guidance rather than content
- Keep the guide hidden once the first chord is added (it disappears when `chords.length > 0`)

**Acceptance Criteria**
- [ ] Three-step guide is visible when the progression is empty
- [ ] Guide disappears once a chord is added
- [ ] Each step has an icon and brief text
- [ ] ESLint passes with `--max-warnings=0`
- [ ] TypeScript strict mode satisfied

---

### ISSUE-58 — Add Keyboard Shortcuts

**Affected files**
- `client/src/app/App.tsx`
- `client/src/app/App.module.css` (footer hint styling)

**Summary**

Power users and musicians benefit greatly from keyboard shortcuts that avoid mouse travel. Four shortcuts cover the core workflow actions.

**Requirements**
- Add a `useEffect` in `App.tsx` that registers a `keydown` event listener on `window`:
  - `A` — fires `handleAddChord()` (same as pressing the "Add" button)
  - `P` — fires the "From" chord play action
  - `ArrowRight` / `ArrowLeft` — move keyboard focus through `ProgressionSidebar` tiles (use `document.querySelectorAll('[data-chord-tile]')` or a `ref` array)
- Guard `A` and `P` against firing when focus is inside an `<input>`, `<select>`, `<textarea>`, or `<button>` element to avoid conflicts
- Add a small fixed footer hint: `Shortcuts: A add • P play • ← → navigate` using a `<footer>` element with subdued styling; include a `<kbd>` element per shortcut key
- Clean up the listener in the `useEffect` return function

**Acceptance Criteria**
- [ ] `A` key adds the current chord
- [ ] `P` key plays the "From" chord
- [ ] Arrow keys navigate between sidebar tiles
- [ ] Shortcuts do not fire when focus is on form controls
- [ ] Footer hint is visible and uses `<kbd>` tags
- [ ] ESLint passes with `--max-warnings=0`
- [ ] TypeScript strict mode satisfied

---

### ISSUE-59 — Add Reset and Lock Controls for Progression

**Affected files**
- `client/src/features/progression-sidebar/components/ProgressionSidebar.tsx`
- `client/src/features/progression-sidebar/components/ProgressionSidebar.module.css`
- `client/src/features/progression-sidebar/hooks/useProgression.ts`
- `client/src/app/App.tsx`

**Summary**

A reset button and a session lock give users control over their session without fear of accidental data loss. The lock persists in `localStorage` so a hard reload does not silently wipe work.

**Requirements**
- Add a `resetProgression()` function to `useProgression` that clears the chords array; expose it through `ProgressionSidebar` via a "Reset" button. Use an inline confirm pattern (e.g., a two-step button: first press shows "Are you sure? Press again to confirm", second press within 3 s executes the reset) rather than `window.confirm`, which cannot be styled and may not be announced correctly by screen readers
- Add a `isLocked` boolean state in `useProgression`, persisted to `localStorage` under key `"midi-editor-locked"`:
  - When `isLocked === true`, disable `addChord`, `deleteChord`, `moveChord`, and `resetProgression`
  - Render a lock/unlock icon toggle button in the sidebar header
  - Show a `title` tooltip: `"Lock session to prevent accidental changes"`
- On app load, read `localStorage.getItem("midi-editor-locked")` to restore lock state

**Acceptance Criteria**
- [ ] Reset button clears the progression after user confirmation
- [ ] Lock toggle persists across page reloads via `localStorage`
- [ ] All mutation actions are disabled when locked
- [ ] Lock icon reflects current locked/unlocked state visually
- [ ] ESLint passes with `--max-warnings=0`
- [ ] TypeScript strict mode satisfied

---

### ISSUE-60 — Improve Focus Order and ARIA Labels

**Affected files**
- `client/src/features/chromatic-circle/components/ChromaticCircle.tsx`
- `client/src/features/current-chord/components/CurrentChordPanel.tsx`
- `client/src/features/progression-sidebar/components/ProgressionSidebar.tsx`
- `client/src/features/progression-sidebar/components/ChordTile.tsx`

**Summary**

Keyboard accessibility is foundational. This issue audits and fixes the tab order and ARIA labelling across the entire application, and ensures that toast/live-region announcements are audible to screen readers.

**Requirements**
- **Tab order**: Verify and enforce the logical sequence: chromatic circle → chord panel → "Add to Progression" button → sidebar tiles. Use `tabIndex` sparingly; rely on DOM order where possible
- **ARIA labels**:
  - Play buttons: `aria-label="Play {chordName}"`
  - Add button: `aria-label="Add {chordName} to progression"`
  - Preview button (ISSUE-53): `aria-label="Load {chordName} into circle"`
  - Delete button: `aria-label="Remove {chordName} from progression"`
  - Toggle buttons (ISSUE-50): `aria-pressed={isActive}` + descriptive `aria-label`
  - Sidebar: already has `aria-label="Chord progression"` — confirm it is present after refactoring
- **Live regions**: Ensure the toast `<div>` from ISSUE-53/54 uses `role="status"` and `aria-live="polite"` (non-intrusive) rather than `aria-live="assertive"`
- **Focus management**: After deleting a tile, move focus to the previous tile (or the empty-state element if the list is now empty)

**Acceptance Criteria**
- [ ] Tab order follows circle → panel → add button → sidebar without skipping
- [ ] All interactive elements have descriptive `aria-label` or visible label text
- [ ] Toggle buttons include `aria-pressed`
- [ ] Toast live region uses `role="status"` and `aria-live="polite"`
- [ ] Focus moves correctly after tile deletion
- [ ] ESLint passes with `--max-warnings=0`
- [ ] TypeScript strict mode satisfied

---

## Issue Dependency Map

```
ISSUE-46 (Primary Add button)
  └── ISSUE-47 (Tile highlight)     ← depends on add action completing
  └── ISSUE-48 (Capacity pill)      ← shares disabled state logic

ISSUE-50 (Toggle buttons)
  └── ISSUE-60 (ARIA: aria-pressed) ← depends on toggle implementation

ISSUE-53 (Tile preview + delete)
  └── ISSUE-54 (Undo add toast)     ← share Toast component pattern
  └── ISSUE-60 (ARIA: focus on delete)

ISSUE-59 (Lock/reset)
  └── ISSUE-58 (Keyboard A shortcut) ← shortcut must respect locked state
```

---

## Shared Component Recommendation

Issues 53 and 54 both require a toast / snackbar pattern. Rather than duplicating the markup, extract a shared component:

```
client/src/shared/components/Toast.tsx
client/src/shared/components/Toast.module.css
```

Props: `message`, `actionLabel`, `onAction`, `durationMs` (default 4000), `onDismiss`.

---

## File Impact Summary

| File | Issues |
|------|--------|
| `app/App.tsx` | 47, 53, 54, 58, 59 |
| `app/App.module.css` | 56, 58 |
| `features/current-chord/components/CurrentChordPanel.tsx` | 46, 56 |
| `features/current-chord/components/CurrentChordPanel.module.css` | 46, 56 |
| `features/current-chord/components/ChordThumbnail.tsx` | 52 |
| `features/chromatic-circle/components/ChromaticCircle.tsx` | 49, 50, 51, 52, 55, 60 |
| `features/progression-sidebar/components/ProgressionSidebar.tsx` | 47, 48, 53, 54, 57, 59, 60 |
| `features/progression-sidebar/components/ProgressionSidebar.module.css` | 47, 48, 53, 54, 57, 59 |
| `features/progression-sidebar/components/ChordTile.tsx` | 47, 53, 60 |
| `features/progression-sidebar/components/ChordTile.module.css` | 47, 53 |
| `features/progression-sidebar/hooks/useProgression.ts` | 59 |
| `features/audio/hooks/useAudioPlayback.ts` | 51 |
| `shared/components/Toast.tsx` (new) | 53, 54 |
| `shared/components/Toast.module.css` (new) | 53, 54 |
