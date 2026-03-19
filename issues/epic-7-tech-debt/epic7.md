# Epic 7 — Tech Debt Reduction

## Theme
Systematically address accumulated technical debt across the frontend codebase: duplicated logic, oversized components, dead code, missing constants, absent error boundaries, thin test coverage, and structural inconsistencies.

## Motivation
As the codebase has grown through Epics 1–6, several patterns have solidified that will become increasingly costly to work around:

1. **Duplicated logic** — scale utilities exist in two feature modules with near-identical implementations. Chord-note retrieval is copy-pasted in at least five files. Each divergence creates a maintenance hazard.
2. **Oversized hook with too many responsibilities** — `useChordState.ts` (309 lines, 7 useState calls, 5 useCallback functions) manages drag state, chord selection, custom chord construction, primitive shape logic, and screen-reader announcements in a single unit. It cannot be tested in isolation and is difficult to reason about.
3. **Dead code** — `client/src/shared/ChromaticCircle.tsx` is an unused duplicate of the main component. The `shared/` folder is otherwise empty placeholder files.
4. **Mixed generated / hand-written API code** — `client/src/api/client/index.ts` fuses auto-generated type bindings with hand-crafted endpoint wrappers. Regenerating the client risks overwriting manual additions.
5. **Magic numbers** — literal values such as `1200` (chord duration ms), `1500` (copy feedback ms), and hex color bytes appear without explanation in component files.
6. **No crash boundary** — the app has no React Error Boundary. A runtime exception in any hook or component silently white-screens the entire application with no recovery path.
7. **Thin test coverage** — the largest hook (`useChordState`), all chromatic-circle utilities, all chord utilities, and all color-language utilities have zero direct tests. No test infrastructure exists for coverage reporting or watch mode.
8. **Nullable context pattern** — `ThemeContext` and `EnharmonicContext` are created with `null` defaults, forcing every consumer to null-check or cast.
9. **Inconsistent feature structure** — the 15 feature modules have no agreed-upon folder layout, making it hard to navigate and onboard.

Addressing these items before the next feature epic will reduce the risk of regressions, lower the cost of future changes, and make the codebase approachable for new contributors.

## Baseline State (start of Epic 7)

| Area | Status |
|---|---|
| Scale utils (`getDiatonicIndices` / `getScaleNotes`) | ❌ Duplicated across two feature modules |
| Chord-note retrieval pattern | ❌ Repeated in 5+ files |
| `useChordState.ts` | ❌ 309 lines, multiple concerns, no tests |
| `shared/ChromaticCircle.tsx` | ❌ Unused dead code |
| API client / generated types | ❌ Mixed in one file; regeneration is risky |
| Magic numbers in components | ❌ At least 4 undocumented literals |
| React Error Boundary | ❌ Missing entirely |
| Unit tests for hooks | ❌ 0 of ~8 hooks tested directly |
| Unit tests for utility modules | ❌ Only indirect coverage via midiBuilder tests |
| Nullable context defaults | ❌ Consumers must guard or cast |
| Feature module folder convention | ❌ No agreed structure across 15 modules |
| `test:coverage` / `test:watch` scripts | ❌ Missing from package.json |

## Issues

| ID | Title | Effort | Depends On |
|---|---|---|---|
| [E7-01](./ISSUE-E7-01.md) | Consolidate duplicate scale utilities | XS (1–2 h) | — |
| [E7-02](./ISSUE-E7-02.md) | Extract repeated chord-note retrieval into a shared utility | S (2–3 h) | — |
| [E7-03](./ISSUE-E7-03.md) | Refactor `useChordState` into focused single-concern hooks | L (6–10 h) | — |
| [E7-04](./ISSUE-E7-04.md) | Remove dead code in `shared/` | XS (<1 h) | — |
| [E7-05](./ISSUE-E7-05.md) | Separate auto-generated API types from hand-written client wrappers | S (2–3 h) | — |
| [E7-06](./ISSUE-E7-06.md) | Replace magic numbers with named constants | S (2–3 h) | — |
| [E7-07](./ISSUE-E7-07.md) | Add React Error Boundary for graceful crash recovery | S (2–4 h) | — |
| [E7-08](./ISSUE-E7-08.md) | Unit tests for chromatic-circle hooks and utilities | M (4–6 h) | E7-01, E7-03 |
| [E7-09](./ISSUE-E7-09.md) | Unit tests for chord and color-language utilities | M (4–6 h) | E7-02 |
| [E7-10](./ISSUE-E7-10.md) | Harden nullable context patterns | XS (1–2 h) | — |
| [E7-11](./ISSUE-E7-11.md) | Standardise feature module folder structure | S (2–4 h) | E7-01, E7-02, E7-04 |
| [E7-12](./ISSUE-E7-12.md) | Add `test:coverage` and `test:watch` npm scripts | XS (1 h) | — |

## Execution Order

```
E7-04 ──────────────────────────────────────► (standalone, no deps)
E7-05 ──────────────────────────────────────► (standalone, no deps)
E7-06 ──────────────────────────────────────► (standalone, no deps)
E7-07 ──────────────────────────────────────► (standalone, no deps)
E7-10 ──────────────────────────────────────► (standalone, no deps)
E7-12 ──────────────────────────────────────► (standalone, no deps)

E7-01 ──┬──► E7-08
         └──► E7-11
E7-02 ──┬──► E7-09
         └──► E7-11
E7-03 ──────► E7-08
```

E7-04 through E7-07, E7-10, and E7-12 are fully independent and may be worked in any order or in parallel. E7-01 and E7-02 should land before E7-08, E7-09, and E7-11 to avoid redundant changes. E7-03 should land before E7-08 so tests target the refactored hook surface.

## Architecture Notes

### Scale utilities consolidation (E7-01)
- `client/src/features/chromatic-circle/utils/scaleUtils.ts` — exports `getDiatonicIndices(root, mode)` returning `Set<number>`
- `client/src/features/scale/utils/scaleUtils.ts` — exports `getScaleNotes(rootIndex, scaleType)` returning `number[]`
- Both compute the same diatonic pitch-class set. The canonical implementation should live in `client/src/features/scale/utils/scaleUtils.ts`; the chromatic-circle module should import from there.

### Chord-note retrieval pattern (E7-02)
The following snippet appears verbatim in at least five files:
```ts
isCustomChord(chord) ? chord.customNotes : getChordNoteIndices(chord.root, chord.type)
```
A single `getChordPitchClasses(chord: Chord): number[]` utility in `client/src/features/chord/utils/` should replace every occurrence.

### useChordState decomposition (E7-03)
Proposed split:
- `useDragState` — dragStart, currentDrag, dragHasMoved
- `useChordSelection` — selectedChord, selectChord callback
- `useCustomChordState` — customNotes, toggleCustomNote, clearCustomNotes, isCustomMode
- `useChordState` (thin orchestrator) — composes the above + exposes the combined interface unchanged to callers

### API client separation (E7-05)
- `client/src/api/generated/index.ts` — auto-generated, never edited (existing)
- `client/src/api/client/index.ts` — hand-written typed wrappers (existing, to be cleaned up)
- The hand-written wrappers should import from `generated/index.ts` exclusively and not duplicate type definitions.

## Done Definition
Epic 7 is complete when:
- No scale-utility duplication exists between features (E7-01)
- `getChordPitchClasses` replaces all inline chord-note retrieval (E7-02)
- `useChordState` is split into ≤3 focused hooks each ≤150 lines (E7-03)
- `shared/ChromaticCircle.tsx` is deleted (E7-04)
- API client and generated files are cleanly separated (E7-05)
- All identified magic numbers have named constants (E7-06)
- An Error Boundary wraps the main app tree (E7-07)
- Direct unit tests exist for chromatic-circle hooks and utils (E7-08)
- Direct unit tests exist for chord and color-language utilities (E7-09)
- Contexts use non-null defaults and throw at misconfiguration (E7-10)
- All 15 feature modules follow the agreed folder convention (E7-11)
- `npm run test:coverage` and `npm run test:watch` exist and work (E7-12)
- `npm run lint` passes with `--max-warnings=0` throughout
- `npm run build` succeeds with no TypeScript errors throughout
