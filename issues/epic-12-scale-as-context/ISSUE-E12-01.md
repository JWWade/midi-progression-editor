# ISSUE-E12-01 — Key Context Panel (root + mode selector)

## Objective

Replace `ScalePlaceholder` with a real `KeyContextPanel` component that gives
users explicit control over the active key root and mode. This is the primary
UI surface through which composers declare their harmonic context.

## Background

`ScalePlaceholder` is a literal empty fragment. `keyRoot` and `keyScale` in
`App.tsx` are currently driven by chord root changes (fixed in E12-02), making
the key invisible and uncontrollable. The circle's diatonic opacity rendering
is correct mechanically but meaningless to the user because neither the key nor
the mode is surfaced.

This issue introduces the second coordinate system into the app:

- **Absolute pitch space** — the chromatic circle and chord graph (existing)
- **Relative harmonic space** — key-relative context (introduced in Epic 12)

`KeyContextPanel` is where the user anchors the second coordinate. It must
write to key state **only through `setKeyContext()`** (defined in E12-02) —
never directly to `keyRoot` / `keyScale` in App state.

## UI Contract

### Root selector

- 12 chromatic roots displayed as note names
- Respects the global flat/sharp preference: reads from the same `pitchClasses`
  / `useEnharmonic` sources as all other label rendering in the app

### Mode selector

- All 8 existing `ScaleType` values
- Display labels use parenthetical common-name aliases for familiar modes:
  - "Major (Ionian)", "Minor (Aeolian)", then bare names for the remaining 6
- Source: existing `SCALE_LABELS` constant, extended with alias strings

### Secondary tonic-snap affordance

- A "Set to chord" button (secondary; the primary affordance lives in
  `CurrentChordPanel` — see E12-03)
- Calls `setKeyContext({ root: currentChordRoot, scale: currentKeyScale, source: "tonicSnap" })`
- Updates root only; mode is preserved

## State Contract

All writes to `keyRoot` / `keyScale` must go through `setKeyContext()`. The
panel must call `setKeyContext` and must not mutate key state directly. The
`source` field for all writes originating here is `"panel"`.

## Startup Behaviour

Default on first load: **C Major** (root 0, scale `"major"`), set via
`setKeyContext({ root: 0, scale: "major", source: "startup" })`.

The startup chord must be diatonic to C major — uniform random from the 7
diatonic degrees, with no weighting in v1. `selectRandomDiatonicStartupChord`
must be updated to always use C major as the key context.

## Files To Add

- `client/src/features/scale/components/KeyContextPanel.tsx`

## Files To Edit

| File | Change |
|---|---|
| `client/src/features/scale/components/ScalePlaceholder.tsx` | Delete (or rename/replace with `KeyContextPanel.tsx`) |
| `client/src/features/scale/index.ts` | Re-export `KeyContextPanel` |
| `client/src/app/App.tsx` | Wire `KeyContextPanel`; pass `setKeyContext` from E12-02; fire startup via `setKeyContext` |
| `client/src/features/chord/utils/selectRandomDiatonicStartupChord.ts` | Always use root 0 + scale `"major"`; return uniform random diatonic chord |

## Acceptance Criteria

- `KeyContextPanel` renders a root selector and mode dropdown
- Root selector labels match the current flat/sharp preference
- Mode dropdown shows all 8 modes; "Major" and "Minor" include parenthetical aliases
- Changing the root calls `setKeyContext({ ..., source: "panel" })`
- Changing the mode calls `setKeyContext({ ..., source: "panel" })`
- On first load, key displays C Major regardless of which chord is selected
- Startup chord is always diatonic to C major
- "Set to chord" button updates `keyRoot` only (mode unchanged) via `setKeyContext`

## Verification Commands

```bash
cd client
npm run lint
npm run build
npm test
```
