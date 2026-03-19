# ISSUE-E7-07 — Add React Error Boundary for Graceful Crash Recovery

## Objective
Wrap the application's component tree in a React Error Boundary so that unhandled runtime errors produce a visible, recoverable error UI instead of a blank white screen.

## Background
The app currently has no `ErrorBoundary` component. Any unhandled exception thrown during rendering, or in a `useEffect` / lifecycle method, silently replaces the entire viewport with nothing. Users have no indication of what went wrong and no path to recovery.

React Error Boundaries catch rendering and lifecycle errors from any descendant component and render a fallback UI. They do not catch errors inside event handlers or asynchronous code (those need separate try/catch), but they protect against the most common "white screen of death" scenarios.

## Proposed Design

### `AppErrorBoundary` component
```tsx
// client/src/app/components/AppErrorBoundary.tsx
// Class component — required by React Error Boundary API
```

The fallback UI should:
- Display a brief, user-friendly error message (e.g., "Something went wrong.")
- Provide a "Reload" button that calls `window.location.reload()`.
- Optionally render the error message in development mode (`import.meta.env.DEV`).

### Integration in `App.tsx`
```tsx
<AppErrorBoundary>
  {/* existing app tree */}
</AppErrorBoundary>
```

## Files To Add
- `client/src/app/components/AppErrorBoundary.tsx`

## Files To Edit
- `client/src/app/App.tsx` — wrap the JSX tree with `<AppErrorBoundary>`.

## Acceptance Criteria
- [ ] `AppErrorBoundary` is a React class component implementing `componentDidCatch` and `getDerivedStateFromError`.
- [ ] The fallback UI is visible and includes a reload affordance.
- [ ] In development mode (`import.meta.env.DEV`), the error detail is also rendered.
- [ ] The entire app tree in `App.tsx` is wrapped by `AppErrorBoundary`.
- [ ] `npm run lint` passes with `--max-warnings=0`.
- [ ] `npm run build` succeeds with no TypeScript errors.

## Verification Commands
```bash
cd client
npm run lint
npm run build
```
