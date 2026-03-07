# ISSUE-39 — Frontend: Session-only Persistence for the Progression

## User Story

As a user, I want **the progression to persist while I'm working but reset when I reload** so I can experiment freely without worrying about saving.

## Summary

The chord progression should be held in component or application state (not in localStorage, a database, or any persistent storage). The progression naturally resets when the browser tab is reloaded, which is the intended and expected behavior for this prototype. No save/load functionality is needed for this story.

## Requirements

### Persistence Model
- Progression state lives in React state (e.g., `useState` or a context/reducer)
- No `localStorage`, `sessionStorage`, or back-end API calls for persistence
- The state is initialized as an empty array on every page load
- All add, reorder, and delete operations (ISSUE-37, ISSUE-40) mutate this in-memory state

### User Expectation Management
- The UI should not imply that the progression will be saved (no "save" button or persistent-storage language)
- Optionally, add a brief note in the sidebar or UI (e.g., "Resets on page reload") to set expectations
- The reset behavior is a feature, not a bug — it encourages experimentation

### Frontend Architecture
- Create or update `src/features/progression-sidebar/hooks/useProgression.ts`
  - Manages the `Chord[]` array in local state
  - Exports `{ chords, addChord, moveChord, deleteChord }` with correct TypeScript signatures
  - Enforces `MAX_PROGRESSION_LENGTH` (ISSUE-38) within `addChord`
- Integrate `useProgression` in the main layout or `App.tsx`
- Pass the returned state and handlers down to `CurrentChordPanel` and `ProgressionSidebar`

### Constraints
- No persistence layer of any kind (localStorage, IndexedDB, server) in this story
- No "are you sure?" prompt on reload — reset is intentional
- State must not be shared across tabs (window-scoped React state is correct)

## Acceptance Criteria
- [ ] The progression state is held in React state (no persistent storage)
- [ ] The progression is empty on page load
- [ ] Reloading the page resets the progression
- [ ] All progression operations (add, move, delete) work correctly during a session
- [ ] `useProgression` hook encapsulates all state logic with correct TypeScript types
- [ ] ESLint passes with `--max-warnings=0`
- [ ] TypeScript strict mode satisfied

## Related Issues
- **ISSUE-35**: Right-hand Vertical Progression Sidebar
- **ISSUE-37**: Simple Editing Controls
- **ISSUE-38**: Finite Progression Length
- **ISSUE-40**: Add-to-Progression Flow
