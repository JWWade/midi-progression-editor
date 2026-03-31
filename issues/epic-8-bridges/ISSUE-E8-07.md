# ISSUE-E8-07 — Integration Tests for Bridge Suggestions

**Epic:** Epic 8 — ii–V Bridge Suggestions  
**Priority:** Medium  
**Estimate:** 1–2 story points  
**Depends on:** ISSUE-E8-03, ISSUE-E8-04, ISSUE-E8-05

---

## Summary

Write end-to-end integration tests that cover the complete bridge suggestion flow: suggestion generation, UI rendering, preview playback, apply, and undo. Use Vitest + React Testing Library in the existing test suite.

---

## Test File Locations

| File | Coverage |
|---|---|
| `client/src/features/ii-v-suggestions/__tests__/suggestBridges.integration.test.ts` | Engine correctness for multi-chord progression inputs |
| `client/src/features/progression-sidebar/__tests__/BridgeSuggestionPopover.test.tsx` | Popover UI rendering + interactions |
| `client/src/features/progression-sidebar/__tests__/useBridgeApply.test.ts` | Apply / undo state logic |
| `client/src/features/progression-sidebar/__tests__/useBridgePreview.test.ts` | Preview start / stop / ghost state |

---

## Test Scenarios

### Engine integration (`suggestBridges.integration.test.ts`)

1. **Bridge within cap** — Given progression `[Cmaj7, Am7]` in C major, `suggestBridges(Am7, Cmaj7, scale, { maxBridgeLength: 2 })` returns at least one `"ii-V"` candidate with score > 0.
2. **Bridge exceeding cap** — Requesting `maxBridgeLength: 0` returns an empty array (no suggestions).
3. **Non-7-note scale** — For a pentatonic scale subset, diatonic bonus does not apply; results still return without error.
4. **Single-chord progression** — When source === target === same chord, result array may be empty or contain only valid distinct candidates.
5. **Test vectors from spike §9.2** — `ii–V` bridge from `Am7 → Cmaj7`: bridge is `[Dm7, G7]`; pitch classes = `{2,5,9}` (Dm7) and `{7,11,2,5}` (G7).

### Popover UI (`BridgeSuggestionPopover.test.tsx`)

6. **Renders suggestion rows** — Each `BridgeSuggestion` in the list renders a row with label text and `▶` button.
7. **Applies bridge** — Clicking **Apply** on a row calls `onApplyBridge` with the correct `Chord[]` and insertion index.
8. **No suggestions state** — When `suggestions` prop is empty, renders "No bridge suggestions" text.
9. **Empty progression guard** — Popover is not rendered when progression length < 2.

### Undo logic (`useBridgeApply.test.ts`)

10. **Apply inserts chords** — After `applyBridge([Dm7, G7], 0)`, `chords` contains the two bridge chords spliced after index 0.
11. **Undo restores** — After `undoBridge()`, `chords` is back to the pre-apply snapshot.
12. **Timer auto-clears** — After 6 seconds (using `vi.useFakeTimers`), `undoPending` becomes `false` without explicit `undoBridge` call.
13. **Double apply** — A second `applyBridge` discards the first snapshot; undo reverts to state between first and second apply.

### Preview logic (`useBridgePreview.test.ts`)

14. **`startPreview` sets `previewBridge`** — After calling `startPreview(source, bridge, target)`, `previewBridge` equals the `bridge` array.
15. **`stopPreview` clears state** — After `stopPreview()`, `previewBridge` is `null` and `isPreviewPlaying` is `false`.
16. **Re-entrant call** — Calling `startPreview` a second time while already playing stops the first sequence and starts the second.

---

## Acceptance Criteria

- [ ] All 16 test scenarios above have corresponding test cases
- [ ] All test cases pass (`npm test` green)
- [ ] No test uses `any` or suppresses TypeScript errors
- [ ] Fake timers (`vi.useFakeTimers`) used for timer-dependent tests (scenarios 12–13)
- [ ] Audio playback is mocked — no real `AudioContext` created in tests
- [ ] `npm run lint` passes with `--max-warnings=0`
