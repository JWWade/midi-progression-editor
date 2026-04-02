/**
 * Tutorial System Types
 *
 * Defines the data structures for tutorial steps, triggers, app context,
 * persisted state, and the React context value exposed via `useTutorial()`.
 */

// ── Trigger types ─────────────────────────────────────────────────────────

/**
 * Action-based trigger: fires when `fireEvent(action)` is called by a
 * feature hook or component (e.g. after a chord is clicked).
 */
export interface ActionTrigger {
  type: 'onAction';
  /** The event name that activates this step (e.g. "chordClicked"). */
  action: string;
}

/**
 * State-based trigger: fires when the named condition evaluates to `true`
 * against the current app context (checked on every context update).
 */
export interface StateTrigger {
  type: 'onState';
  condition: TutorialCondition;
}

/**
 * Idle-based trigger: fires when the user has been inactive for at least
 * `idleSeconds` seconds (respects `document.visibilityState`).
 */
export interface IdleTrigger {
  type: 'onIdle';
  idleSeconds: number;
}

/**
 * Composite trigger: combines multiple triggers with `"all"` (every condition
 * must be satisfied) or `"any"` (at least one must be satisfied) logic.
 */
export interface CompositeTrigger {
  type: 'composite';
  mode: 'all' | 'any';
  conditions: TutorialTrigger[];
}

export type TutorialTrigger =
  | ActionTrigger
  | StateTrigger
  | IdleTrigger
  | CompositeTrigger;

// ── Named state conditions ────────────────────────────────────────────────

/**
 * Named predicates evaluated against `TutorialAppContext`.
 * New conditions can be added here without touching the trigger manager.
 */
export type TutorialCondition =
  | 'emptyProgression'   // progression has no chords
  | 'shortProgression'   // progression has 1–2 chords
  | 'fullProgression'    // progression is at max capacity
  | 'isPlaying';         // audio playback is active

// ── Step definitions ──────────────────────────────────────────────────────

export type TutorialUIType = 'tooltip' | 'modal';

export interface TutorialStep {
  /** Unique identifier across all features. */
  id: string;
  /** Feature this step belongs to (e.g. "progression-sidebar"). */
  feature: string;
  /** Short headline shown in the UI. */
  title: string;
  /** Detailed guidance copy shown below the title. */
  description: string;
  /** Determines when this step becomes eligible. */
  trigger: TutorialTrigger;
  /**
   * Higher value = shown before lower-priority steps when multiple are
   * simultaneously eligible.  Range: 1–100 (higher = more urgent).
   */
  priority: number;
  /** Presentation style: anchored tooltip or centred modal overlay. */
  uiType: TutorialUIType;
  /**
   * CSS selector for the element the tooltip should point at.
   * Ignored when `uiType` is `"modal"`.
   */
  targetSelector?: string;
}

export interface TutorialDefinition {
  /** Semver string; if it changes, persisted progress is reset. */
  version: string;
  feature: string;
  steps: TutorialStep[];
}

// ── App context passed from feature hooks to the tutorial engine ──────────

/**
 * Snapshot of app state relevant to tutorial trigger evaluation.
 * Passed by the host app via `updateAppContext()`.
 */
export interface TutorialAppContext {
  progressionLength: number;
  isPlaying: boolean;
}

// ── Experience modes ──────────────────────────────────────────────────────

/**
 * Controls how interruptive and frequent tutorial prompts are:
 *
 * - `"guided"`   — All steps may auto-trigger including state-based and idle
 *                  prompts.  Highest interruption frequency.  Recommended for
 *                  first-time users.
 * - `"standard"` — Action-triggered steps and modal onboarding steps still
 *                  fire.  Pure idle and state-based tooltip steps are
 *                  suppressed.  Balanced interruption for returning users.
 * - `"minimal"`  — Only modal steps (essential onboarding) are shown.  All
 *                  tooltip steps are suppressed regardless of trigger type.
 *                  Lowest interruption for power users.
 */
export type TutorialExperienceMode = 'guided' | 'standard' | 'minimal';

// ── Persisted state ───────────────────────────────────────────────────────

export interface TutorialPersistedState {
  completedSteps: string[];
  skippedSteps: string[];
  /** Stored tutorial data version; mismatch triggers a full reset. */
  tutorialVersion: string;
  /** `true` when the user has permanently dismissed all tutorials. */
  dismissed: boolean;
  /**
   * Controls which steps auto-trigger.  Defaults to `"guided"` for new
   * users.  Persisted so the user's preference survives page reloads.
   */
  experienceMode: TutorialExperienceMode;
}

// ── Telemetry event model ─────────────────────────────────────────────────

/**
 * Named events emitted by the tutorial engine.
 *
 * Payload shape is documented in {@link TutorialEventPayload}.
 * No user-entered content is ever included — only structural metadata.
 *
 * | Event                  | When fired                                           |
 * |------------------------|------------------------------------------------------|
 * | `step_eligible`        | A step passes trigger evaluation for the first time  |
 * | `step_shown`           | The step is actually rendered to the user            |
 * | `step_completed`       | User clicked "Got it" (positive completion)          |
 * | `step_skipped`         | User clicked "Skip" (deferred, not completed)        |
 * | `tutorial_dismissed_all` | User disabled all tutorials permanently            |
 * | `tutorial_reset`       | Tutorial progress was reset programmatically         |
 */
export type TutorialEventName =
  | 'step_eligible'
  | 'step_shown'
  | 'step_completed'
  | 'step_skipped'
  | 'tutorial_dismissed_all'
  | 'tutorial_reset';

/**
 * Metadata attached to every tutorial telemetry event.
 *
 * **Privacy guardrails** (enforced by design):
 * - `stepId` and `feature` are structural identifiers defined by authors, not
 *   user-entered content.
 * - `sessionOffsetMs` is relative to session start so it never reveals the
 *   user's wall-clock time or timezone.
 * - No free-form text, UI copy, CSS selectors, or PII is ever included.
 * - The payload shape is bounded to this interface; additional keys must be
 *   added here explicitly so privacy review remains possible.
 */
export interface TutorialEventPayload {
  /** The name of the event. */
  event: TutorialEventName;
  /**
   * Step ID that the event relates to.
   * `null` for tutorial-level events (`tutorial_dismissed_all`, `tutorial_reset`).
   */
  stepId: string | null;
  /**
   * Feature the step belongs to (e.g. `"progression-sidebar"`).
   * `null` for tutorial-level events.
   */
  feature: string | null;
  /**
   * The trigger variant that made this step eligible.
   * `null` for tutorial-level events.
   */
  triggerType: TutorialTrigger['type'] | null;
  /** Tutorial content version at the time of the event (semver string). */
  contentVersion: string;
  /**
   * Milliseconds elapsed since the page session started.
   * Session-relative — does not reveal wall-clock time or timezone.
   */
  sessionOffsetMs: number;
  /**
   * Accessibility diagnostics attached to `step_shown`, `step_completed`, and
   * `step_skipped` events when the information is available.
   */
  a11y?: TutorialA11yDiagnostic;
}

/**
 * Accessibility diagnostic snapshot reported by tutorial UI components.
 * Attached to `step_shown` events and close events when available.
 */
export interface TutorialA11yDiagnostic {
  /**
   * `true` when the browser successfully moved focus to the tutorial UI element
   * on mount (verified by checking `document.activeElement` after the attempt).
   */
  focusSuccess: boolean;
  /**
   * Input method inferred at the time the step was closed, where detectable.
   * `"keyboard"` when the close button was activated without a pointer click
   * (`MouseEvent.detail === 0`).  `"pointer"` otherwise.
   */
  inputMethod?: 'keyboard' | 'pointer';
  /**
   * `true` when the step was dismissed in under one second — a signal of
   * friction or an abnormal / automated close pattern.
   */
  immediateClose?: boolean;
}

// ── React context value ───────────────────────────────────────────────────

export interface TutorialContextValue {
  /** The tutorial step currently being shown, or `null` if none. */
  activeStep: TutorialStep | null;
  completedSteps: ReadonlyArray<string>;
  skippedSteps: ReadonlyArray<string>;
  /** `true` when the user has permanently dismissed all tutorials. */
  dismissed: boolean;
  /**
   * The current experience mode controlling which steps auto-trigger.
   * `"guided"` → all steps; `"standard"` → action + modal only;
   * `"minimal"` → modal only.
   */
  experienceMode: TutorialExperienceMode;
  /**
   * `true` while a snooze is active (tutorials are temporarily paused).
   * Automatically becomes `false` when the snooze duration expires.
   */
  paused: boolean;
  /**
   * 1-based index of the active step within all remaining (not yet completed
   * or skipped) steps, sorted by priority.  `0` when no step is active.
   */
  stepIndex: number;
  /** Total number of steps that have not yet been completed or skipped. */
  totalSteps: number;
  /**
   * Fire a named action event.  Any step whose trigger is
   * `{ type: "onAction", action: eventName }` becomes eligible.
   */
  fireEvent: (eventName: string) => void;
  /**
   * Push updated app-level state into the tutorial engine so that
   * state-based and composite triggers can be evaluated.
   */
  updateAppContext: (ctx: Partial<TutorialAppContext>) => void;
  /** Mark the active step as completed and hide it. */
  dismiss: (a11y?: TutorialA11yDiagnostic) => void;
  /** Mark the active step as skipped (not completed) and hide it. */
  skip: (a11y?: TutorialA11yDiagnostic) => void;
  /** Permanently disable all tutorials for this user. */
  skipAll: () => void;
  /** Reset all tutorial progress (completed + skipped + dismissed flag). */
  reset: () => void;
  /** Change the interruption level for this user session. */
  setExperienceMode: (mode: TutorialExperienceMode) => void;
  /**
   * Temporarily pause all tutorial prompts for `durationMs` milliseconds
   * (default: 30 minutes).  Tutorials resume automatically when the duration
   * expires.
   */
  snooze: (durationMs?: number) => void;
}
