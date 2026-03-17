# ISSUE-E7-10 — Harden Nullable Context Patterns

## Objective
Replace the `null`-defaulted React context pattern used by `ThemeContext` and `EnharmonicContext` with a safer pattern that throws a descriptive error at development time if a consumer is rendered outside its provider.

## Background
Both application contexts are created with `null` as the default value:

```ts
// ThemeContext.ts
export const ThemeContext = createContext<ThemeContextValue | null>(null);

// EnharmonicContext.ts
export const EnharmonicContext = createContext<EnharmonicContextValue | null>(null);
```

Every consuming hook must therefore either:
1. Check for `null` before use (verbosely), or
2. Cast the value: `useContext(ThemeContext)!` (unsafely).

If a component is accidentally rendered outside the provider — during testing, in a Storybook story, or after a future refactor — the error manifests as a cryptic `Cannot read properties of null` rather than a clear "ThemeProvider missing" message.

## Proposed Pattern
```ts
// Sentinel — never reaches consumers, exists only for createContext
const MISSING_PROVIDER = {} as ThemeContextValue;

export const ThemeContext = createContext<ThemeContextValue>(MISSING_PROVIDER);

// Inside the custom hook
export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (ctx === MISSING_PROVIDER) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return ctx;
}
```

This pattern:
- Eliminates all `| null` from the context type, removing the need for null-checks or non-null assertions in consumers.
- Fails fast with a developer-friendly message if the provider is missing.
- Has zero runtime cost in correctly configured trees.

## Files To Edit
- `client/src/app/providers/ThemeContext.ts` — apply the sentinel pattern; update `useTheme` hook.
- `client/src/app/providers/EnharmonicContext.ts` — apply the sentinel pattern; update `useEnharmonic` hook.
- Any consumer that currently null-checks or non-null-asserts these contexts — remove the guard (return type is now non-nullable).

## Acceptance Criteria
- [ ] `ThemeContext` and `EnharmonicContext` no longer use `null` as their default value.
- [ ] `useTheme()` and `useEnharmonic()` throw a descriptive error if called outside their respective providers.
- [ ] No consumer file contains `useContext(ThemeContext)!` or `?? null` guards for these contexts.
- [ ] `npm run lint` passes with `--max-warnings=0`.
- [ ] `npm run build` succeeds with no TypeScript errors.

## Verification Commands
```bash
cd client
npm run lint
npm run build
npm test
```
