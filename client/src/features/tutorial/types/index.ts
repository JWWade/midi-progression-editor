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

// ── Persisted state ───────────────────────────────────────────────────────

export interface TutorialPersistedState {
  completedSteps: string[];
  skippedSteps: string[];
  /** Stored tutorial data version; mismatch triggers a full reset. */
  tutorialVersion: string;
  /** `true` when the user has dismissed all tutorials permanently. */
  dismissed: boolean;
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
}
