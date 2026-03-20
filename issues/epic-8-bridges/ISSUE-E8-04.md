# ISSUE-E8-04 — Bridge Preview Playback

**Epic:** Epic 8 — ii–V Bridge Suggestions  
**Priority:** Medium  
**Estimate:** 1–2 story points  
**Depends on:** ISSUE-E8-03

---

## Summary

Wire the **▶** button in `BridgeSuggestionPopover` to play the source → bridge → target chord sequence using the existing `playChord` / `useAudioPlayback` audio infrastructure, without mutating the progression state. Show ghost tiles in the sidebar during preview so the user can hear and see where the bridge would be inserted.

---

## Background

The existing audio stack in `client/src/features/audio/` already exposes:
- `playChord(notes: ChordNoteInfo[], options)` from `audioUtils.ts`
- `useAudioPlayback(audioParams)` from `hooks/useAudioPlayback.ts` — returns `{ isPlaying, play, stop }`

The progression playback hook in `ProgressionSidebar` plays chords sequentially using `chordDurationMs`. The bridge preview should honour the same duration setting.

---

## Files to Modify / Create

| File | Action |
|---|---|
| `client/src/features/progression-sidebar/hooks/useBridgePreview.ts` | Create |
| `client/src/features/progression-sidebar/components/BridgeSuggestionPopover.tsx` | Modify (from ISSUE-E8-03) |
| `client/src/features/progression-sidebar/components/ProgressionSidebar.tsx` | Modify |
| `client/src/app/App.tsx` | Modify |

---

## Requirements

### `useBridgePreview` hook

```typescript
export function useBridgePreview(
  chordDurationMs: number,
  audioParams: AudioParams,
): {
  isPreviewPlaying: boolean;
  previewBridge: Chord[] | null;
  startPreview: (source: Chord, bridge: Chord[], target: Chord) => void;
  stopPreview: () => void;
}
```

- Uses `useAudioPlayback` internally.
- `startPreview` builds the sequence `[source, ...bridge, target]`, converts each chord to `ChordNoteInfo[]` via `transposeChord` / `getChordPitchClasses`, then plays them in series with `chordDurationMs` spacing (using `setTimeout` or sequential `await play(...)`).
- Exposes `previewBridge: Chord[] | null` (the bridge portion only — used for ghost tile rendering; `null` when not playing).
- Calling `startPreview` while already playing stops the in-progress sequence first.
- Pressing `Escape` or closing the popover calls `stopPreview`.

### Ghost tile rendering in `ProgressionSidebar`

- When `previewBridge !== null`, render temporary ghost tiles immediately after `tileRefs.current[insertAfterIndex]` in the `<ol>`.
- Ghost tiles: render `ChordTile` with `opacity: 0.4` or a dedicated `.ghostTile` CSS class; suppress all controls (no move/delete buttons); not focusable (`tabIndex={-1}`).
- Ghost tiles do not have `aria-label` exposing them as real items; add `aria-hidden="true"` to the wrapper.
- On `stopPreview` or popover close, ghost tiles disappear.

### Preview button state in `BridgeSuggestionPopover`

- While this suggestion's bridge is preview-playing: show `■` (stop square); `aria-label="Stop preview"`.
- While idle or another bridge is previewing: show `▶`; `aria-label="Preview bridge: {chordNames}"`.
- Clicking `▶` on a row while another row is previewing stops the previous and starts the new one.

### Wiring in `App.tsx` and `ProgressionSidebar`

- `useBridgePreview` is instantiated in `App.tsx` (so it has access to `audioParams` and `chordDurationMs` already threaded there).
- `App.tsx` passes `onPreviewBridge`, `previewBridge`, and `isPreviewPlaying` down to `ProgressionSidebar`.
- `ProgressionSidebar` passes `onPreviewBridge` through to `BridgeSuggestionPopover`.

---

## Acceptance Criteria

- [ ] Pressing ▶ plays source → bridge → target in sequence at `chordDurationMs` per chord
- [ ] Ghost tiles appear during preview at the correct insertion point
- [ ] Ghost tiles disappear when preview ends or popover closes
- [ ] Pressing ▶ again (or ■ while playing) stops playback
- [ ] Preview does not mutate progression state (`chords` array is unchanged)
- [ ] `npm run lint` passes with `--max-warnings=0`
- [ ] TypeScript strict mode satisfied
