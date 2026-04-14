# ISSUE-E12-05 — Tonic Emphasis on the Chromatic Circle

## Objective

Visually distinguish the tonic (key root) node on the chromatic circle so that
modal keys are readable without interaction. Without this, D Dorian and C major
show identical visual patterns (same 7 bright nodes, same 5 dim nodes).

## Background

The circle's diatonic opacity already correctly dims non-diatonic nodes, but
there is no visual distinction between the tonic and other diatonic notes.
This means modal context is invisible: a user declaring D Dorian sees the same
7-note pattern they would see in C major. Tonic emphasis is not optional in a
system where mode matters.

## Visual Specification

### Marker form

A ring, stronger border, or distinct inner ring on the `keyRoot` node. It must:

- Be visible when the tonic is **not** a chord tone (no quality fill present)
- Remain distinguishable when the tonic **is** a chord tone (quality fill
  present simultaneously)
- Be distinct from both quality gradient fill and standard diatonic brightness

### NodeVisualState render contract

To prevent CSS drift and scattered conditional styling, all node rendering must
derive from a single typed state object:

```ts
interface NodeVisualState {
  isTonic: boolean;
  isChordTone: boolean;
  isDiatonic: boolean;
}
```

A **single renderer function** maps `NodeVisualState` → visual output. CSS
conditionals for tonic, chord tone, and diatonic state must not be scattered
across components — all resolution flows through this mapping.

### Visual dominance order

When multiple signals converge on the same node, resolution must follow this
explicit priority:

1. **Tonic marker** — structural anchor; always rendered regardless of other state
2. **Chord tone fill** — active harmonic context; dynamic
3. **Diatonic opacity** — background classification; lowest priority

### State × visual mapping (normative reference)

| State | Visual |
|---|---|
| Diatonic, not chord tone | Full opacity + standard fill |
| Chord tone (non-tonic) | Quality gradient fill + full opacity |
| Tonic, not chord tone | Full opacity + tonic marker (ring/border) |
| Tonic + chord tone | Quality gradient fill + tonic marker (both layers visible) |

This table is the normative reference for all node rendering in this issue. If
implementation needs to deviate, update this table first — do not deviate
silently.

## Files To Edit

| File | Change |
|---|---|
| `client/src/features/chromatic-circle/components/ChromaticCircle.tsx` | Introduce `NodeVisualState`; implement tonic node marker; map all node states through single renderer |

## Files Potentially Affected

- Chord thumbnail components if they share the same node rendering path

## Acceptance Criteria

- Tonic node shows a distinct marker (ring or border) regardless of which chord
  is selected
- When the tonic node is also a chord tone, both the quality fill and tonic
  ring are visible simultaneously — neither replaces the other
- D Dorian (D as tonic) and C major (C as tonic) produce visually distinct
  circles even though both have the same 7 diatonic note set
- Tonic marker does not obscure the chord polygon or voice-leading paths
- All node rendering derives from `NodeVisualState` → single renderer; no
  scattered CSS conditionals for tonic vs chord tone vs diatonic

## Verification Commands

```bash
cd client
npm run lint
npm run build
```
