# ISSUE-E8-03 — `BridgeSuggestionIcon` and `BridgeSuggestionPopover` Components

**Epic:** Epic 8 — ii–V Bridge Suggestions  
**Priority:** High  
**Estimate:** 2–3 story points  
**Depends on:** ISSUE-E8-01, ISSUE-E8-02

---

## Summary

Build the two UI components that surface bridge suggestions to the user:

1. **`BridgeSuggestionIcon`** — a small, always-visible button that appears between adjacent chord tiles in the progression sidebar when at least one bridge suggestion exists. Serves as the entry point.
2. **`BridgeSuggestionPopover`** — a non-modal popover that opens when the icon is activated, listing ranked bridge suggestions with score bars, preview (▶), and apply (✓) actions.

Wire both into `ProgressionSidebar.tsx` between chord tiles (replacing or augmenting the current `PairMetricBadge` gap).

---

## Files to Create / Modify

| File | Action |
|---|---|
| `client/src/features/progression-sidebar/components/BridgeSuggestionIcon.tsx` | Create |
| `client/src/features/progression-sidebar/components/BridgeSuggestionIcon.module.css` | Create |
| `client/src/features/progression-sidebar/components/BridgeSuggestionPopover.tsx` | Create |
| `client/src/features/progression-sidebar/components/BridgeSuggestionPopover.module.css` | Create |
| `client/src/features/progression-sidebar/components/ProgressionSidebar.tsx` | Modify |

---

## Requirements

### `BridgeSuggestionIcon`

**Props:**
```typescript
interface BridgeSuggestionIconProps {
  suggestionCount: number;         // number of available suggestions (0 = hidden)
  sourceChordName: string;         // used in aria-label
  targetChordName: string;         // used in aria-label
  isOpen: boolean;
  onToggle: () => void;
}
```

**Behaviour:**
- Render `null` when `suggestionCount === 0`.
- Render a small `<button>` with a `⟿` or `+` glyph and a suppressed badge showing `suggestionCount`.
- Always visible (not hover-only) so keyboard users can reach it.
- `aria-label="Show ii–V bridge suggestions between {sourceChordName} and {targetChordName}"`
- `aria-expanded={isOpen}`
- `title="ii–V bridge suggestions ({n} available)"`

**Appearance:**
- Styled as a compact inline badge between tiles (consistent with the existing `PairMetricBadge` visual slot in the tile gap).
- Use `var(--color-accent)` for the badge background; neutral/muted when `suggestionCount === 0` (though icon is hidden in that case).
- Should not break existing `PairMetricBadge` layout; the two can co-exist in the gap `<li>` (metric badge above, suggestion icon below, or consolidated into one `<li>`).

---

### `BridgeSuggestionPopover`

**Props:**
```typescript
interface BridgeSuggestionPopoverProps {
  suggestions: BridgeSuggestion[];
  sourceChordName: string;
  targetChordName: string;
  insertAfterIndex: number;
  progressionLength: number;
  maxProgressionLength: number;
  onApply: (bridge: Chord[]) => void;
  onPreview: (bridge: Chord[]) => void;
  onClose: () => void;
}
```

**Behaviour:**
- Rendered inline (not portal) anchored below its trigger in the sidebar layout.
- `role="dialog"`, `aria-label="ii–V bridge suggestions between {sourceChordName} and {targetChordName}"`.
- Focus is moved into the popover when it opens (focus the first suggestion row or the close button).
- `Escape` key calls `onClose`.
- Clicking outside the popover calls `onClose`.

**Suggestion row layout:**
```
[ chord names ]  [ label ]  [ ████▓ score bar ]  [ score ]  [ ▶ ]  [ ✓ ]
```
- **Chord names**: e.g. `Am7 → D7` (use `pitchClasses` from `useEnharmonic` — see ISSUE-E8-06 for full resolution; for this issue, use root indices as stand-in until E8-06 lands).
- **Label**: short label from `BridgeSuggestion.label`.
- **Score bar**: `<div>` fill as `width: {score * 100}%`; `aria-hidden="true"`.
- **Score**: numeric, e.g. `0.88`; included in accessible row label.
- **▶ Preview button**: `aria-label="Preview bridge: {chordNames}"`, calls `onPreview(suggestion.bridge)`. See ISSUE-E8-04 for full playback wiring.
- **✓ Apply button**: `aria-label="Apply bridge: {chordNames}"`, calls `onApply(suggestion.bridge)`.
  - Disabled (`aria-disabled="true"`) when `progressionLength + suggestion.bridge.length > maxProgressionLength`.
  - Shows a title tooltip: `"Adding this bridge would exceed the {maxProgressionLength}-chord limit"` when disabled.

**Each row `aria-label`:** `"{chordNames} — {label} — score {score}"`

---

### `ProgressionSidebar.tsx` Integration

- Add `onApplyBridge: (insertAfterIndex: number, bridge: Chord[]) => void` and `onPreviewBridge: (bridge: Chord[]) => void` props (wired in App.tsx per ISSUE-E8-04 / ISSUE-E8-05).
- Add `scale: ScaleContext | null` prop (pass down from App.tsx's existing scale state).
- In the tile gap `<li>`, after the `PairMetricBadge`, render `BridgeSuggestionIcon` and conditionally `BridgeSuggestionPopover`.
- Manage `openBridgeIndex: number | null` state in `ProgressionSidebar` to track which gap's popover is open.
- When `openBridgeIndex === i`, render `BridgeSuggestionPopover` for that gap.
- Pass `useBridgeSuggestions(chords, i, scale)` result as `suggestions` to the icon and popover.

---

## Accessibility Checklist

| Element | Requirement |
|---|---|
| Icon button | `role="button"`, `aria-label`, `aria-expanded`, keyboard-focusable |
| Popover | `role="dialog"`, `aria-label`, focus trap while open |
| Suggestion rows | Readable `aria-label` including chord names, label, and score |
| Preview button | `aria-label="Preview bridge: {names}"` |
| Apply button | `aria-label="Apply bridge: {names}"`, `aria-disabled` when cap exceeded |
| Score bar | `aria-hidden="true"` |
| `Escape` dismissal | Returns focus to the trigger icon button |

---

## Acceptance Criteria

- [ ] `BridgeSuggestionIcon` is hidden when `suggestionCount === 0`
- [ ] `BridgeSuggestionIcon` is always keyboard-reachable (not hover-only)
- [ ] `BridgeSuggestionPopover` opens on icon activation and closes on Escape / outside click
- [ ] Focus moves into popover on open; returns to trigger on close
- [ ] Each suggestion row displays chord names, label, score bar, ▶, and ✓
- [ ] Apply button is disabled when bridge would exceed progression cap
- [ ] `ProgressionSidebar` receives and passes `scale` context through to `useBridgeSuggestions`
- [ ] Existing `PairMetricBadge` layout is not broken by the new affordance
- [ ] `npm run lint` passes with `--max-warnings=0`
- [ ] TypeScript strict mode satisfied
