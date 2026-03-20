# ISSUE-E8-06 — Enharmonic-Aware Bridge Label Generation

**Epic:** Epic 8 — ii–V Bridge Suggestions  
**Priority:** Medium  
**Estimate:** 1 story point  
**Depends on:** ISSUE-E8-01

---

## Summary

Bridge suggestion labels (e.g. "ii–V into G", "Diatonic ii–V of G7") and explanation strings ("Am7 shares E with target") must be generated at render time using the enharmonic context from `useEnharmonic`, not baked into the engine output. Create a `bridgeLabel.ts` utility and wire it into `BridgeSuggestionPopover`.

---

## Background

The app supports two enharmonic modes (sharps vs. flats) via the `useEnharmonic` provider, which exposes a `pitchClasses: string[]` array of 12 note names indexed by pitch class (0–11). The bridge engine (`suggestBridges`) returns `BridgeSuggestion` objects with numeric pitch-class data; it must **not** contain hard-coded note-name strings.

---

## Files to Create / Modify

| File | Action |
|---|---|
| `client/src/features/ii-v-suggestions/utils/bridgeLabel.ts` | Create |
| `client/src/features/progression-sidebar/components/BridgeSuggestionPopover.tsx` | Modify (consume labels) |

---

## `bridgeLabel.ts` API

```typescript
import type { BridgeSuggestion } from '../types';

/**
 * Returns a short human-readable label for the bridge row heading.
 * Examples: "ii–V into G7", "Tritone sub into C", "Chromatic approach to F#m"
 */
export function generateBridgeLabel(
  suggestion: BridgeSuggestion,
  targetName: string,
  pitchClasses: string[],  // from useEnharmonic — length 12
): string

/**
 * Returns a one-line explanation shown as secondary text in the popover row.
 * Examples:
 *   "Am7 shares 2 notes with Dm7; G7 resolves by half step"
 *   "Tritone substitution: Db7 → C (tritone of G7)"
 */
export function generateBridgeExplanation(
  suggestion: BridgeSuggestion,
  targetName: string,
  pitchClasses: string[],
): string
```

### Label templates by `BridgeType`

| `BridgeType` | Label template |
|---|---|
| `"ii-V"` | `ii–V into <targetName>` |
| `"tritone-sub"` | `Tritone sub into <targetName>` |
| `"chromatic-approach"` | `Chromatic approach to <targetName>` |
| `"diatonic-passing"` | `Diatonic passing to <targetName>` |
| `"secondary-dominant"` | `V of V into <targetName>` |

- Note names within labels use `pitchClasses[pc]` for enharmonic-correct rendering.
- `targetName` is passed in as an already-resolved string from the caller (the popover already has the target chord's display name).

### Explanation logic

- For `"ii-V"`: list the set of shared notes between the ii chord and the target, e.g. "Dm7 shares E, A with Am7".
- For `"tritone-sub"`: name the tritone interval, e.g. "Db7 is the tritone sub of G7 (6 semitones apart)".
- For `"chromatic-approach"`: mention the semitone motion from the approach chord root to the target root.
- All note names resolved through `pitchClasses[pc]`.

---

## Integration in `BridgeSuggestionPopover`

```typescript
const { pitchClasses } = useEnharmonic();

// Per suggestion row:
const label = generateBridgeLabel(suggestion, targetName, pitchClasses);
const explanation = generateBridgeExplanation(suggestion, targetName, pitchClasses);
```

Replace any placeholder strings (`suggestion.label`, `suggestion.explanation`) that were wired as pass-throughs from the engine.

---

## Acceptance Criteria

- [ ] `generateBridgeLabel` returns correct template string for each `BridgeType`
- [ ] `generateBridgeExplanation` produces a non-empty, accurate string for each `BridgeType`
- [ ] All note names reflect current enharmonic context (sharps toggle → labels flip)
- [ ] Engine (`suggestBridges`) emits no string note-name data — only pitch-class integers
- [ ] Unit tests cover `generateBridgeLabel` and `generateBridgeExplanation` for all 5 bridge types in both sharp and flat enharmonic contexts
- [ ] `npm run lint` passes with `--max-warnings=0`
- [ ] TypeScript strict mode satisfied
