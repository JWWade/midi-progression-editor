# ISSUE-E7-06 — Replace Magic Numbers with Named Constants

## Objective
Replace all unattributed numeric and color literals in component and utility files with named constants that document their purpose.

## Background
Several components and utilities contain literal values whose meaning is not self-evident. These make the code harder to understand and create silent maintenance hazards (e.g., changing one instance without updating the others).

**Identified magic numbers:**

| Location | Value | Meaning |
|---|---|---|
| `client/src/app/App.tsx` line ~8 | `1200` | Default chord duration in milliseconds |
| `client/src/features/current-chord/components/CurrentChordPanel.tsx` line ~123 | `1500` | Duration of "Copied!" feedback badge in milliseconds |
| `client/src/features/chromatic-circle/components/NoteNode.tsx` line ~22 | `"#10b981"` | Hard-coded emerald highlight color |
| `client/src/features/chord-intervals/components/IntervalLabel.tsx` line ~16 | `"#1F2937"` | Hard-coded dark text color |
| `client/src/features/color-language/utils/chordColorUtils.ts` lines ~23–24 | `0x11`, `0x18`, `0x27` | RGB byte values of the dark text color used in contrast checks |
| `client/src/features/color-language/utils/chordColorUtils.ts` line ~33 | `0.04045`, `12.92`, `0.055`, `1.055`, `2.4` | sRGB linearisation constants (gamma correction) |
| `client/src/shared/ChromaticCircle.tsx` line ~7 | `300` | SVG viewBox size (already a constant in the main component — see E7-04) |

## Proposed Constants

```ts
// App.tsx or a new client/src/app/constants.ts
export const DEFAULT_CHORD_DURATION_MS = 1200;

// CurrentChordPanel or shared/constants
export const COPY_FEEDBACK_DURATION_MS = 1500;

// chordColorUtils.ts (inline, documented)
const DARK_TEXT_R = 0x11;
const DARK_TEXT_G = 0x18;
const DARK_TEXT_B = 0x27;

// chordColorUtils.ts (inline, documented)
// sRGB IEC 61966-2-1 linearisation coefficients
const SRGB_LINEAR_THRESHOLD = 0.04045;
const SRGB_LINEAR_DIVISOR   = 12.92;
const SRGB_GAMMA_OFFSET     = 0.055;
const SRGB_GAMMA_DIVISOR    = 1.055;
const SRGB_GAMMA_EXPONENT   = 2.4;
```

Inline color literals (`"#10b981"`, `"#1F2937"`) should either reference the existing `chordQualityColors` constants or be moved to `visualConstants.ts`.

## Files To Edit
- `client/src/app/App.tsx` — extract `1200` to a named constant.
- `client/src/features/current-chord/components/CurrentChordPanel.tsx` — extract `1500` to a named constant.
- `client/src/features/color-language/utils/chordColorUtils.ts` — name RGB bytes and sRGB constants.
- `client/src/features/chromatic-circle/components/NoteNode.tsx` — replace `"#10b981"` with a constant or CSS variable.
- `client/src/features/chord-intervals/components/IntervalLabel.tsx` — replace `"#1F2937"` with a constant.

## Files To Add
None required; constants may be co-located with the files that use them.

## Acceptance Criteria
- [ ] None of the literal values listed in the table above appear unattributed in source files.
- [ ] Each constant has a name that conveys its purpose.
- [ ] Colour constants in `chordColorUtils.ts` have inline comments citing their standard (sRGB IEC 61966-2-1).
- [ ] `npm run lint` passes with `--max-warnings=0`.
- [ ] `npm run build` succeeds with no TypeScript errors.

## Verification Commands
```bash
cd client
npm run lint
npm run build
```
