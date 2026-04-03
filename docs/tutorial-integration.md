# Tutorial System Integration Guide

This document describes how the tutorial engine works, who owns each integration point, and how to extend it safely.

---

## Table of Contents

1. [Ownership Boundaries](#1-ownership-boundaries)
2. [Action Event Registry](#2-action-event-registry)
3. [App Context Bridge](#3-app-context-bridge)
4. [Telemetry Schema](#4-telemetry-schema)
5. [Adding a New Tutorial Step](#5-adding-a-new-tutorial-step)
6. [Connecting a New Feature](#6-connecting-a-new-feature)
7. [Governance and Validation Checklist](#7-governance-and-validation-checklist)
8. [Accessibility Requirements](#8-accessibility-requirements)
9. [Experience Modes](#9-experience-modes)
10. [Persistence and Versioning](#10-persistence-and-versioning)

---

## 1. Ownership Boundaries

The tutorial system is divided into four layers with clear ownership responsibilities.

### Tutorial Engine Core
**Owner:** `client/src/features/tutorial/`

Responsible for:
- Step resolution (trigger evaluation, priority, completed/skipped filtering)
- Persisted state (localStorage via reducer)
- Experience mode filtering
- Snooze/pause lifecycle
- UI rendering (TutorialTooltip, TutorialModal)
- Telemetry emission

The engine is a black box from the feature layer's perspective: features push events and context in; the engine decides whether to show a step.

### Feature Event Emitters
**Owner:** Individual feature modules and `client/src/app/App.tsx`

Responsible for calling `fireEvent(eventName)` at the right point in user interactions. The canonical list of all expected event names is maintained in:

```
client/src/features/tutorial/constants/tutorialEvents.ts
```

No feature should invent a new event name without registering it there first.

### App Context Bridge
**Owner:** `client/src/app/App.tsx`

Responsible for calling `updateAppContext({ progressionLength, isPlaying })` whenever the relevant app state changes.  This feeds the state-based trigger evaluation loop inside `TutorialProvider`.

Current context shape (defined in `TutorialAppContext`):

| Field | Type | Updated by |
|---|---|---|
| `progressionLength` | `number` | `useEffect` on `chords.length` |
| `isPlaying` | `boolean` | `useEffect` on `isPlaying` |

### Tutorial Settings and Persistence Boundary
**Owner:** `client/src/features/tutorial/context/TutorialProvider.tsx`

Responsible for reading and writing the single `localStorage` key `tutorial_state`. The persisted shape is `TutorialPersistedState`:

```ts
interface TutorialPersistedState {
  completedSteps: string[];
  skippedSteps: string[];
  tutorialVersion: string;   // reset on version mismatch
  dismissed: boolean;
  experienceMode: TutorialExperienceMode;
}
```

Snooze state is **session-only** (not persisted) so a 30-minute snooze does not survive a page reload.

---

## 2. Action Event Registry

Every `onAction` tutorial trigger must reference an event name that is registered in:

```
client/src/features/tutorial/constants/tutorialEvents.ts → TUTORIAL_ACTION_EVENTS
```

### Current Event Registry

| Event Name | Emitted By | Trigger |
|---|---|---|
| `chordSelected` | `App.tsx → handleCurrentChordChange` | User selects a chord on the chromatic circle |
| `chordAdded` | `App.tsx → handleAddChord` | User adds current chord to the progression |
| `chordClicked` | `App.tsx → handleSendChordToCircle` | User clicks a progression chord to send it back to the circle |

### Event Naming Convention

- Use **camelCase** for action event names (e.g. `chordAdded`, not `chord_added`).
- Name events after the **user action** that just occurred, in past tense (e.g. `chordAdded`, `exportStarted`).
- Avoid implementation-detail names (e.g. not `handleAddChordCalled`).

### Contract Enforcement

The test file `tutorialIntegrationContracts.test.ts` contains two contract assertions that run in CI:

1. **Forward contract**: every `onAction` trigger in `ALL_TUTORIAL_STEPS` must reference a key in `TUTORIAL_ACTION_EVENTS`. If a `fireEvent` call is removed from application code without updating the tutorial definition, this test fails.

2. **Reverse contract**: every key in `TUTORIAL_ACTION_EVENTS` must be referenced by at least one tutorial step. If a step is removed without cleaning up the registry, this test fails.

---

## 3. App Context Bridge

The app context bridge keeps state-based and composite triggers up to date.

### Current Setup (`App.tsx`)

```tsx
const { fireEvent, updateAppContext } = useTutorial();

// Keep the tutorial engine in sync with app state.
useEffect(() => {
  updateAppContext({ progressionLength: chords.length, isPlaying });
}, [chords.length, isPlaying, updateAppContext]);
```

### Adding a New Context Field

1. Add the field to the `TutorialAppContext` interface in `types/index.ts`.
2. Add a new `TutorialCondition` if the field supports a state-based trigger.
3. Implement the condition in `evaluateCondition()` in `data/tutorials.ts`.
4. Update `App.tsx` to pass the new field via `updateAppContext()`.
5. Update `EXPECTED_APP_CONTEXT_FIELDS` in `tutorialIntegrationContracts.test.ts`.

---

## 4. Telemetry Schema

### Event Names (`TutorialEventName`)

| Event | When Fired |
|---|---|
| `step_eligible` | A step passes trigger evaluation for the first time |
| `step_shown` | The step is actually rendered to the user |
| `step_completed` | User clicked "Got it" (positive completion) |
| `step_skipped` | User clicked "Skip" (deferred, not completed) |
| `tutorial_dismissed_all` | User disabled all tutorials permanently |
| `tutorial_reset` | Tutorial progress was reset programmatically |

### Payload Shape (`TutorialEventPayload`)

```ts
interface TutorialEventPayload {
  event: TutorialEventName;
  stepId: string | null;       // null for tutorial-level events
  feature: string | null;      // null for tutorial-level events
  triggerType: TutorialTrigger['type'] | null;
  contentVersion: string;      // semver from TUTORIAL_CONTENT_VERSION
  sessionOffsetMs: number;     // ms since page session start (privacy-safe)
  a11y?: TutorialA11yDiagnostic;
}
```

### Privacy Guardrails

- `stepId` and `feature` are **author-defined identifiers**, never user-entered text.
- `sessionOffsetMs` is relative to session start — no wall-clock time or timezone.
- No UI copy, CSS selectors, or free-form strings are included.
- No external transport is attached in this codebase. The in-memory ring buffer (capped at 200 events) is the only sink.

### Accessing the Event Log (Development)

```ts
import { getTutorialEventLog, clearTutorialEventLog } from '@/features/tutorial';

const events = getTutorialEventLog(); // read-only snapshot
clearTutorialEventLog();              // useful for test isolation
```

### Extending the Schema

1. Add the new event name to the `TutorialEventName` union in `types/index.ts`.
2. Call `emitTutorialEvent(...)` at the appropriate point in `TutorialProvider.tsx`.
3. Update `EXPECTED_TELEMETRY_EVENTS` in `tutorialIntegrationContracts.test.ts`.
4. Update the table in this document.

---

## 5. Adding a New Tutorial Step

### Step 1: Design the Step

Decide:
- **ID** — unique, kebab-case (e.g. `export-midi`). No two steps may share an ID.
- **Feature** — which feature module owns this step (e.g. `"midi-export"`).
- **Title** — short headline shown in the UI (≤8 words recommended).
- **Description** — one to two sentences of guidance copy.
- **Priority** — integer 1–100 (higher = shown first). Use priority bands:
  - 8–10: Critical onboarding (first actions, empty state)
  - 5–7:  Core feature discovery
  - 3–4:  Advanced feature discovery
  - 1–2:  Power-user tips
- **uiType** — `"modal"` for full-screen onboarding; `"tooltip"` for contextual tips.
- **Trigger** — when should this step appear? (see trigger types below)
- **targetSelector** — required for tooltip steps; the CSS selector for the anchor element.

### Step 2: Choose a Trigger

| Trigger | Use When |
|---|---|
| `{ type: 'onAction', action: 'eventName' }` | A user action just occurred |
| `{ type: 'onState', condition: 'conditionName' }` | App state matches a named condition |
| `{ type: 'onIdle', idleSeconds: N }` | User has been idle for N seconds |
| `{ type: 'composite', mode: 'all', conditions: [...] }` | All sub-conditions must be true |
| `{ type: 'composite', mode: 'any', conditions: [...] }` | Any one sub-condition must be true |

**Guidance:**
- Prefer `onAction` triggers for contextual tips — they fire in direct response to user intent.
- Wrap `onIdle` triggers in a composite with an `onState` guard to avoid showing them at unexpected moments.
- Avoid top-level `onState` triggers without a composite guard (the validator will warn).
- Never use a composite `all` trigger that combines `emptyProgression` with `fullProgression` — this is contradictory and can never fire.

### Step 3: Register an Action Event (if needed)

If your trigger uses `onAction` with a new event name:

1. Add the entry to `TUTORIAL_ACTION_EVENTS` in `constants/tutorialEvents.ts`.
2. Identify the correct location in `App.tsx` (or a feature hook) and add a `fireEvent('yourEventName')` call.

### Step 4: Add the Step to `data/tutorials.ts`

Add a new entry to the appropriate `TutorialDefinition` in `TUTORIAL_DEFINITIONS`, or create a new definition block for a new feature:

```ts
{
  version: TUTORIAL_CONTENT_VERSION,
  feature: 'your-feature',
  steps: [
    {
      id: 'your-step-id',
      feature: 'your-feature',
      title: 'Your Step Title',
      description: 'One or two sentences explaining what to do.',
      trigger: { type: 'onAction', action: 'yourEventName' },
      priority: 5,
      uiType: 'tooltip',
      targetSelector: '#your-element-id',
    },
  ],
},
```

### Step 5: Validate

Run the development server or tests. The validator (`assertValidTutorialDefinitions`) runs automatically in development mode and will throw if:

- The step ID is duplicated.
- Priority is outside 1–100.
- A tooltip step is missing `targetSelector`.

Run the test suite to catch contract violations:

```bash
cd client
npm test
```

---

## 6. Connecting a New Feature

To integrate a new feature with the tutorial engine:

### Step 1: Identify Integration Points

Decide which user actions in your feature are meaningful enough to trigger tutorial steps. Common patterns:

- Feature first used (action trigger)
- Feature result reaches a notable state (state trigger)
- Feature idle after setup (composite idle trigger)

### Step 2: Emit Action Events

In your feature hook or the App.tsx integration layer, call `fireEvent` at the right moment:

```tsx
// In App.tsx or a feature-level hook:
const { fireEvent } = useTutorial();

const handleMyAction = useCallback(() => {
  // ... your logic ...
  fireEvent('myFeatureActionName');
}, [fireEvent]);
```

Register the event name in `constants/tutorialEvents.ts` before using it.

### Step 3: Add State Context (if needed)

If your feature needs state-based triggers, add a field to `TutorialAppContext` and update the `updateAppContext` call in `App.tsx`.

### Step 4: Write Tutorial Steps

Follow the [Adding a New Tutorial Step](#5-adding-a-new-tutorial-step) guide.

### Step 5: Test the Integration

Verify that:

- `npm test` passes (contract tests enforce the event registry).
- The tutorial step appears in the UI at the expected moment (manual verification).
- The step respects experience mode filtering (test with `standard` and `minimal` modes).

---

## 7. Governance and Validation Checklist

Use this checklist when authoring or reviewing a tutorial step.

### Content Quality
- [ ] Step ID is unique across all tutorial definitions.
- [ ] Step title is ≤8 words and action-oriented.
- [ ] Step description is 1–2 clear sentences with a concrete action.
- [ ] Priority is an integer in 1–100 and uses the correct priority band.

### Trigger Correctness
- [ ] Trigger type matches the intended firing condition.
- [ ] `onAction` events are registered in `TUTORIAL_ACTION_EVENTS`.
- [ ] `onIdle` triggers are wrapped in a composite guard (not standalone).
- [ ] `composite all` trigger has no contradictory condition pairs.

### Accessibility
- [ ] Tooltip steps have a valid `targetSelector` (WCAG 1.3.1).
- [ ] Modal steps have no `targetSelector` (it would be silently ignored).
- [ ] Step copy does not rely on color or visual position alone.

### Integration
- [ ] `fireEvent('eventName')` is called at the correct moment in the owning module.
- [ ] New events are added to `TUTORIAL_ACTION_EVENTS` registry.
- [ ] `npm test` passes after changes.
- [ ] `npm run lint` passes with zero warnings.

### Version Bump
- [ ] `TUTORIAL_CONTENT_VERSION` in `data/tutorials.ts` is bumped if the change would cause persisted progress to become invalid for existing users (e.g. step IDs renamed, triggers fundamentally changed).

---

## 8. Accessibility Requirements

All tutorial UI must meet the following requirements.

### TutorialTooltip
- `role="dialog"` — identifies the tooltip as a dialog region.
- `aria-modal="false"` — non-modal; background content remains accessible.
- `aria-label` — includes the step title for screen reader announcement.
- `aria-describedby` — points to the description paragraph.
- `tabIndex={-1}` — allows programmatic focus via `element.focus()`.
- Focus moves into the tooltip on mount and returns to the previously focused element on close.
- Pressing **Escape** dismisses the tooltip with `inputMethod: 'keyboard'`.
- `autoFocus` on the primary "Got it" button for immediate keyboard access.

### TutorialModal
- `role="dialog"` — identifies the modal as a dialog region.
- `aria-modal="true"` — signals to AT that background content is inert.
- `aria-labelledby` — points to the `<h2>` title element.
- `aria-describedby` — points to the description paragraph.
- `tabIndex={-1}` — allows programmatic focus on the dialog container.
- Focus moves into the dialog on mount and returns to the trigger element on close.
- Pressing **Escape** dismisses the modal.
- **Tab focus trap** — Tab and Shift+Tab cycle through focusable elements within the modal only.
- `autoFocus` on the primary "Got it" button.

### Reduced Motion
The tutorial CSS includes a `prefers-reduced-motion` media query that removes or reduces animations for users who have requested reduced motion at the OS level.

### Screen Reader Semantics
- Progress indicator uses `aria-label="Step N of M"` to convey position without requiring sighted context.
- Decorative emoji (🎓, 💡) are wrapped with `aria-hidden="true"`.
- The backdrop div does **not** carry `aria-hidden="true"` (which would hide the dialog from the accessibility tree). The `aria-modal="true"` attribute on the dialog itself is sufficient to mark background content as inert.

---

## 9. Experience Modes

| Mode | Allowed Step Types |
|---|---|
| `guided` | All steps (modal, action tooltip, state tooltip, idle tooltip) |
| `standard` | Modal steps + action-triggered tooltip steps (no idle or state-only tooltips) |
| `minimal` | Modal steps only (essential onboarding) |

The filtering logic lives in `utils/modeFiltering.ts` (`isStepAllowedInMode`). The mode is persisted in localStorage and can be changed at runtime via `setExperienceMode(mode)`.

---

## 10. Persistence and Versioning

Tutorial progress is stored under a single `localStorage` key managed by `TutorialProvider`.

### Version Reset Strategy

When `TUTORIAL_CONTENT_VERSION` is bumped, any persisted state with a different version is discarded and replaced with fresh defaults. This ensures users start from a clean state after major content changes.

**When to bump the version:**
- Step IDs are renamed (persisted completed/skipped sets reference IDs).
- The progression of steps changes in a way that makes old progress misleading.
- A step's trigger fundamentally changes its semantics.

**When NOT to bump:**
- Copy-only changes (title, description wording).
- Adding new steps (old completed IDs remain valid).
- Priority or mode changes.

### Snooze Behavior

Snooze state is **session-only** — it is not written to localStorage. A snoozed tutorial will resume at the next page load, or automatically after the snooze duration expires within the current session (default: 30 minutes).
