/**
 * Tutorial Action Event Registry
 *
 * Canonical list of all action event names used by tutorial trigger
 * definitions.  Each entry documents the event name, the module responsible
 * for emitting it, and a human-readable description of the user action it
 * represents.
 *
 * ## Ownership Contract
 *
 * Every `{ type: "onAction" }` trigger in `ALL_TUTORIAL_STEPS` must reference
 * an event that is listed in `TUTORIAL_ACTION_EVENTS`.  Contract tests in
 * `__tests__/tutorialIntegrationContracts.test.ts` enforce this at CI time
 * so that silent integration drift (removing a `fireEvent` call without
 * updating the tutorial step) is caught before merge.
 *
 * ## Adding a New Event
 *
 * 1. Add an entry to `TUTORIAL_ACTION_EVENTS` below.
 * 2. Call `fireEvent('<eventName>')` in the owning module at the right point.
 * 3. Reference the event in a tutorial step trigger inside `data/tutorials.ts`.
 * 4. Update `docs/tutorial-integration.md` with the new event.
 *
 * ## Removing an Event
 *
 * 1. Remove the `fireEvent` call from the owning module.
 * 2. Remove or update the tutorial step that references the event.
 * 3. Delete the entry from `TUTORIAL_ACTION_EVENTS` below.
 *
 * Contract tests will fail at step 1 or 2 if either side is left dangling.
 */

export interface TutorialActionEventEntry {
  /** The event name string — must match the `action` field in `ActionTrigger`. */
  event: string;
  /** The source file and function responsible for calling `fireEvent(event)`. */
  owner: string;
  /** Human-readable description of the user action this event represents. */
  description: string;
}

/**
 * Registry of all tutorial action events.
 *
 * Keys are event name strings; values describe ownership and semantics.
 * Contract tests verify that every `onAction` trigger in the tutorial
 * definitions references a key that exists in this map, and that every
 * key in this map is used by at least one tutorial step.
 */
export const TUTORIAL_ACTION_EVENTS = {
  chordSelected: {
    event: 'chordSelected',
    owner: 'client/src/app/App.tsx → handleCurrentChordChange',
    description:
      'Fired when the user selects a new chord on the chromatic circle ' +
      'by clicking a note or otherwise changing the active chord.',
  },
  chordAdded: {
    event: 'chordAdded',
    owner: 'client/src/app/App.tsx → handleAddChord',
    description:
      'Fired when the user adds the current chord to the progression ' +
      'via the "Add to Progression" button in CurrentChordPanel.',
  },
  chordClicked: {
    event: 'chordClicked',
    owner: 'client/src/app/App.tsx → handleSendChordToCircle',
    description:
      'Fired when the user clicks an existing chord in the progression sidebar ' +
      'to send it back to the chromatic circle for inspection or editing.',
  },
} as const satisfies Record<string, TutorialActionEventEntry>;

/** Union type of all registered tutorial action event names. */
export type TutorialActionEventName = keyof typeof TUTORIAL_ACTION_EVENTS;

/**
 * Set of all registered action event name strings.
 * Useful for O(1) lookups in contract tests.
 */
export const REGISTERED_ACTION_EVENT_NAMES: ReadonlySet<string> = new Set(
  Object.keys(TUTORIAL_ACTION_EVENTS),
);
