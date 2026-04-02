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
  dismiss: () => void;
  /** Mark the active step as skipped (not completed) and hide it. */
  skip: () => void;
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
