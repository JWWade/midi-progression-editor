# ISSUE-E10-01 — Tutorial Foundations, Governance, and Validation

## Objective

Lay the foundation for a safer, more deterministic, and accessibility-aware tutorial system by adding content validation, authoring rules, and explicit trigger-resolution semantics.

## Background

The current tutorial engine is functional, but its content definitions are centralized and handwritten in TypeScript. As the number of tutorial steps grows, the risk of duplicate IDs, invalid selectors, inaccessible UI metadata, and ambiguous trigger behavior increases.

This issue establishes the governance layer required before expanding the system further.

## Scope

1. Implement a tutorial content authoring validation layer.
2. Add lint-like rules for accessibility and authoring quality.
3. Define and enforce trigger conflict resolution semantics.
4. Add unit tests for validation logic and step resolution behavior.

## Files To Edit

- `client/src/features/tutorial/types/index.ts`
- `client/src/features/tutorial/data/tutorials.ts`
- `client/src/features/tutorial/utils/triggerManager.ts`
- `client/src/features/tutorial/context/TutorialProvider.tsx`
- `client/src/features/tutorial/__tests__/triggerManager.test.ts`
- Any new validation utility file(s) under `client/src/features/tutorial/utils/`
- Any new documentation file(s) if authoring rules need a dedicated reference

## Files To Add

Suggested additions:

- `client/src/features/tutorial/utils/validateTutorialDefinitions.ts`
- `client/src/features/tutorial/__tests__/validateTutorialDefinitions.test.ts`

## Requirements

### Content Authoring Validation

- Fail fast in development when tutorial definitions are invalid.
- Detect duplicate step IDs.
- Detect invalid or missing `targetSelector` values for tooltip steps.
- Detect out-of-range priority values.
- Detect contradictory or unreachable trigger combinations where practical.
- Document expected mappings for accessibility checks, including WCAG and Trusted Tester references where relevant.

### Authoring Lint Rules

Validate at minimum:

- tooltip steps missing required descriptive relationships
- modal steps missing focus-management requirements in their authoring contract
- auto-trigger steps that appear without explicit intent or documented justification

These checks may be implemented as runtime validation, test-time validation, or both, but they must be enforceable before merge.

### Trigger Conflict Resolution

Define and test:

- priority resolution
- tie-breaking rules
- skip/completed precedence
- action event consumption behavior
- deterministic outcomes when multiple steps are simultaneously eligible

## Acceptance Criteria

- [ ] Invalid tutorial definitions fail in development or test runs.
- [ ] Duplicate IDs and invalid selectors are detected automatically.
- [ ] Accessibility validation for tutorial authoring is enforced pre-merge.
- [ ] Trigger conflict resolution rules are explicit and test-covered.
- [ ] No ambiguous outcomes remain when multiple steps become eligible together.
- [ ] `npm run lint` passes with `--max-warnings=0`.
- [ ] `npm run build` succeeds with no TypeScript errors.
- [ ] `npm test` passes.

## Verification Commands

```bash
cd client
npm run lint
npm run build
npm test
```
