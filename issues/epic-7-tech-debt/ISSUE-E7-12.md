# ISSUE-E7-12 — Add `test:coverage` and `test:watch` npm Scripts

## Objective
Add two missing npm scripts to `client/package.json` so developers can run Vitest in watch mode during development and generate coverage reports.

## Background
`client/package.json` currently exposes only a single test script:
```json
"test": "vitest run"
```

Two standard Vitest invocations are missing:

| Script | Command | Purpose |
|---|---|---|
| `test:watch` | `vitest` | Re-runs affected tests on every file save (developer workflow) |
| `test:coverage` | `vitest run --coverage` | Generates an Istanbul/v8 coverage report |

Without `test:watch`, developers must manually re-run `npm test` after every change. Without `test:coverage`, there is no way to measure the coverage improvements made in E7-08 and E7-09 or to set a baseline for future epics.

**Note on coverage provider:** Vitest supports both `v8` (built-in, zero config) and `istanbul` (requires `@vitest/coverage-istanbul`). The `v8` provider is preferred here because it requires no additional dependency.

## Files To Edit
- `client/package.json` — add `test:watch` and `test:coverage` scripts.

## Files To Add
None.

## Acceptance Criteria
- [ ] `npm run test:watch` starts Vitest in interactive watch mode.
- [ ] `npm run test:coverage` runs all tests and outputs a coverage summary to the terminal.
- [ ] No new runtime dependencies are added (v8 coverage provider is built into Vitest).
- [ ] `npm run lint` passes with `--max-warnings=0`.
- [ ] `npm run build` succeeds with no errors.
- [ ] Existing `npm test` behaviour is unchanged.

## Verification Commands
```bash
cd client
npm run test:coverage   # should print a coverage table and exit 0
npm run lint
npm run build
```
