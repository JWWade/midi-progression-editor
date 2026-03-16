# Epic 6 — Synchronized Chromatic Circle Animation During Playback

## Theme
Synchronize the `ChromaticCircle` visualization with progression playback so the polygon morphs live as each chord sounds.

## Motivation
Epic 5 delivered a fully functional progression playback sequencer (`useProgressionPlayback`). However, `playingIndex` is consumed only inside `ProgressionSidebar` for tile highlighting — the `ChromaticCircle` has no awareness of playback state. The result is a visual disconnect: audio plays a sequence of chords while the circle remains frozen on the user's last selection.

The SPIKE investigation (`docs/spikes/SPIKE-synchronized-chromatic-circle-animation.md`) confirmed the fix requires minimal refactoring: lift playback state to `App.tsx`, add one new prop to `ChromaticCircle`, and let the existing `useChordMorphing` hook animate automatically. No new audio primitives, no new animation engine, and no global event system are required.

## Baseline State (start of Epic 6)

| Capability | Status |
|---|---|
| Progression playback sequencer (`useProgressionPlayback`) | ✅ Implemented — lives in `ProgressionSidebar` |
| Polygon morphing on user interaction (`useChordMorphing`) | ✅ Implemented — used in `ChromaticCircle` |
| Per-tile playback highlight (`ChordTile` `isPlaying` prop) | ✅ Implemented |
| **Circle synchronized to playback** | ❌ Missing — `playingIndex` never reaches `ChromaticCircle` |
| **Visual indicator that playback is active** | ❌ Missing |
| **Guard against mid-playback mutations** | ❌ Missing |
| **Configurable chord duration** | ❌ Hardcoded to 1200 ms |
| **ARIA live region for playback** | ❌ Missing |

## Issues

| ID | Title | Effort | Depends On |
|---|---|---|---|
| [E6-01](./ISSUE-E6-01.md) | Lift `useProgressionPlayback` to `App.tsx` | XS (1–2 h) | — |
| [E6-02](./ISSUE-E6-02.md) | Add `externalChord` prop to `ChromaticCircle` | S (2–3 h) | E6-01 |
| [E6-03](./ISSUE-E6-03.md) | Playback-active visual indicator on `ChromaticCircle` | S (2–4 h) | E6-02 |
| [E6-04](./ISSUE-E6-04.md) | Guard against mid-playback progression mutations | XS (1 h) | E6-01 |
| [E6-05](./ISSUE-E6-05.md) | Configurable chord duration in `useProgressionPlayback` | S (2–4 h) | E6-01 |
| [E6-06](./ISSUE-E6-06.md) | Investigate `AudioContext.currentTime`-driven sequencing | M (4–8 h) | E6-01 |
| [E6-07](./ISSUE-E6-07.md) | Pulse/glow effect on polygon entry during playback | S (2–4 h) | E6-02 |
| [E6-08](./ISSUE-E6-08.md) | ARIA live region announcing current chord during playback | S (2–4 h) | E6-02 |

## Execution Order

```
E6-01 ──► E6-02 ──► E6-03
      │          └──► E6-07
      │          └──► E6-08
      ├──► E6-04
      ├──► E6-05
      └──► E6-06
```

E6-01 is the sole blocker. E6-04, E6-05, and E6-06 can proceed in parallel after E6-01. E6-03, E6-07, and E6-08 each require E6-02.

## Architecture Notes

See `docs/spikes/SPIKE-synchronized-chromatic-circle-animation.md` for the full investigation, including pseudocode, timing analysis, and per-file change details.

### Data flow after E6-01 + E6-02

```
App
 ├── useProgressionPlayback(chords)   ← lifted from ProgressionSidebar
 │     ├── isPlaying, playingIndex
 │     ├── play(), stop()
 │     └── playingChord = chords[playingIndex] ?? null
 │
 ├── ChromaticCircle
 │     └── externalChord={playingChord}   ← new prop; overrides internal state
 │
 └── ProgressionSidebar
       ├── isPlaying, playingIndex   ← received as props
       ├── onPlay, onStop            ← received as props
       └── ChordTile isPlaying={playingIndex === i}
```
