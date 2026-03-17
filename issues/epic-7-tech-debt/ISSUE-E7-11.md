# ISSUE-E7-11 — Standardise Feature Module Folder Structure

## Objective
Define and document a canonical folder convention for the 15 feature modules, then align every module to that convention.

## Background
The 15 feature modules under `client/src/features/` have grown organically and each follows a slightly different layout:

| Feature | types/ | api/ | constants/ | hooks/ | utils/ | components/ | data/ |
|---|---|---|---|---|---|---|---|
| `chromatic-circle` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| `chord` | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ |
| `audio` | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ | ❌ |
| `scale` | ✅ | ✅ | ❌ | ✅* | ✅ | ✅ | ❌ |
| `voice-leading` | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| `chord-animation` | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| `chord-morphing` | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ |

*`scale/hooks/` exists but contains only an index re-export with no hook implementation.

Additional inconsistencies:
- Some features export from a feature-level `index.ts`; others do not.
- `chord-animation` and `chord-morphing` appear to overlap in purpose (both deal with polygon morphing); the distinction between them is not documented.
- Naming mixes feature+concern (`chord-animation`, `chord-geometry`, `chord-inspection`) with plain feature names (`chord`, `audio`, `scale`).

## Proposed Convention
A feature module should only include sub-folders it actually uses. The allowed sub-folders and their purpose are:

| Sub-folder | Purpose |
|---|---|
| `components/` | React components specific to this feature |
| `hooks/` | React hooks specific to this feature |
| `utils/` | Pure functions and helpers |
| `types/` | TypeScript type and interface definitions |
| `constants/` | Named constants and enumerations |
| `api/` | API call functions (wrapping the generated client) |
| `data/` | Static data fixtures or lookup tables |

Every feature must have a top-level `index.ts` that explicitly re-exports its public surface.

## Files To Add
- `docs/feature-module-convention.md` — documents the convention so future contributors can follow it. Place in the root-level `docs/` directory, which already contains `accessibility-audit.md` and the `spikes/` sub-folder.

## Files To Edit
- Feature modules that are missing a top-level `index.ts` — add one.
- Feature modules that have empty sub-folders with only `.gitkeep` — remove the empty folder or add a meaningful file.
- `scale/hooks/index.ts` — if the hooks folder contains only a re-export with no hook, either add a real hook or remove the folder.

## Files Not To Edit
Implementation files (components, hooks, utils) — this issue is structural only.

## Acceptance Criteria
- [ ] `docs/feature-module-convention.md` exists and describes the allowed sub-folders and the index requirement.
- [ ] Every feature module has a top-level `index.ts` that exports its public surface.
- [ ] No feature module contains an empty sub-folder (sub-folders with only `.gitkeep` are removed or populated).
- [ ] `npm run lint` passes with `--max-warnings=0`.
- [ ] `npm run build` succeeds with no TypeScript errors.

## Verification Commands
```bash
cd client
npm run lint
npm run build
```
