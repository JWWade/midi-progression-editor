import {
  useReducer,
  useCallback,
  useEffect,
  useRef,
  useMemo,
  type ReactNode,
} from 'react';
import { TutorialContext } from './TutorialContext';
import type {
  TutorialAppContext,
  TutorialA11yDiagnostic,
  TutorialExperienceMode,
  TutorialPersistedState,
  TutorialStep,
} from '../types';
import {
  ALL_TUTORIAL_STEPS,
  TUTORIAL_CONTENT_VERSION,
} from '../data/tutorials';
import { findEligibleSteps } from '../utils/triggerManager';
import { isStepAllowedInMode } from '../utils/modeFiltering';
import { assertValidTutorialDefinitions } from '../utils/validateTutorialDefinitions';
import { emitTutorialEvent } from '../utils/tutorialTelemetry';
import { TutorialTooltip } from '../components/TutorialTooltip';
import { TutorialModal } from '../components/TutorialModal';
import { createLogger } from '@/shared/utils/logger';

const log = createLogger('tutorial');

// ── Development-time validation ───────────────────────────────────────────
// Runs once at module load in dev mode.  Throws on authoring errors so
// problems are caught before they reach users.
if (import.meta.env.DEV) {
  assertValidTutorialDefinitions(ALL_TUTORIAL_STEPS);
}

// ── LocalStorage key ──────────────────────────────────────────────────────

const STORAGE_KEY = 'tutorial_state_v1';

// ── Default idle threshold (seconds) ─────────────────────────────────────

const IDLE_POLL_MS = 1000;

// ── Default snooze duration (30 minutes in ms) ────────────────────────────

export const DEFAULT_SNOOZE_DURATION_MS = 30 * 60 * 1000;

// ── Persisted-state helpers ───────────────────────────────────────────────

function loadPersistedState(): TutorialPersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<TutorialPersistedState>;
      if (
        Array.isArray(parsed.completedSteps) &&
        Array.isArray(parsed.skippedSteps) &&
        typeof parsed.tutorialVersion === 'string' &&
        typeof parsed.dismissed === 'boolean'
      ) {
        // Version mismatch → reset persisted progress
        if (parsed.tutorialVersion !== TUTORIAL_CONTENT_VERSION) {
          log.info('Tutorial content version changed; resetting progress.');
          return freshState();
        }
        // Merge in new fields with defaults for backward compatibility
        return {
          ...freshState(),
          ...parsed,
          experienceMode: isValidMode(parsed.experienceMode)
            ? parsed.experienceMode
            : 'guided',
        };
      }
    }
  } catch {
    // Corrupt or unavailable storage — start fresh
  }
  return freshState();
}

function isValidMode(
  value: unknown,
): value is TutorialExperienceMode {
  return value === 'guided' || value === 'standard' || value === 'minimal';
}

function freshState(): TutorialPersistedState {
  return {
    completedSteps: [],
    skippedSteps: [],
    tutorialVersion: TUTORIAL_CONTENT_VERSION,
    dismissed: false,
    experienceMode: 'guided',
  };
}

function savePersistedState(state: TutorialPersistedState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore write errors (e.g., private browsing quota)
  }
}

// ── Reducer ───────────────────────────────────────────────────────────────

interface ProviderState extends TutorialPersistedState {
  // Non-persisted runtime state
  appContext: TutorialAppContext;
  pendingAction: string | null;
  idleSeconds: number;
  isIdle: boolean;
  /**
   * `true` while a snooze is active.  Session-only — not persisted across
   * page reloads — so that a 30-minute snooze doesn't survive a refresh.
   */
  paused: boolean;
  /**
   * Unix timestamp (ms) after which the current snooze expires.
   * `null` when not snoozed.  Session-only.
   */
  snoozedUntil: number | null;
}

type Action =
  | { type: 'COMPLETE_STEP'; stepId: string }
  | { type: 'SKIP_STEP'; stepId: string }
  | { type: 'SKIP_ALL' }
  | { type: 'RESET' }
  | { type: 'FIRE_EVENT'; eventName: string }
  | { type: 'CLEAR_ACTION' }
  | { type: 'UPDATE_APP_CONTEXT'; ctx: Partial<TutorialAppContext> }
  | { type: 'TICK_IDLE' }
  | { type: 'RESET_IDLE' }
  | { type: 'SET_MODE'; mode: TutorialExperienceMode }
  | { type: 'SNOOZE'; until: number }
  | { type: 'CLEAR_SNOOZE' };

function reducer(state: ProviderState, action: Action): ProviderState {
  switch (action.type) {
    case 'COMPLETE_STEP': {
      const completed = state.completedSteps.includes(action.stepId)
        ? state.completedSteps
        : [...state.completedSteps, action.stepId];
      return { ...state, completedSteps: completed, pendingAction: null };
    }

    case 'SKIP_STEP': {
      const skipped = state.skippedSteps.includes(action.stepId)
        ? state.skippedSteps
        : [...state.skippedSteps, action.stepId];
      return { ...state, skippedSteps: skipped, pendingAction: null };
    }

    case 'SKIP_ALL':
      return { ...state, dismissed: true, pendingAction: null };

    case 'RESET': {
      const fresh = freshState();
      return {
        ...state,
        ...fresh,
        pendingAction: null,
        idleSeconds: 0,
        isIdle: false,
        paused: false,
        snoozedUntil: null,
      };
    }

    case 'FIRE_EVENT':
      return { ...state, pendingAction: action.eventName };

    case 'CLEAR_ACTION':
      return { ...state, pendingAction: null };

    case 'UPDATE_APP_CONTEXT':
      return {
        ...state,
        appContext: { ...state.appContext, ...action.ctx },
      };

    case 'TICK_IDLE': {
      const next = state.idleSeconds + 1;
      return { ...state, idleSeconds: next, isIdle: next >= 1 };
    }

    case 'RESET_IDLE':
      return { ...state, idleSeconds: 0, isIdle: false };

    case 'SET_MODE':
      return { ...state, experienceMode: action.mode };

    case 'SNOOZE':
      return { ...state, snoozedUntil: action.until, paused: true };

    case 'CLEAR_SNOOZE':
      return { ...state, snoozedUntil: null, paused: false };

    default:
      return state;
  }
}

// ── Provider ──────────────────────────────────────────────────────────────

export function TutorialProvider({ children }: { children: ReactNode }) {
  const initial = useMemo<ProviderState>(() => {
    const persisted = loadPersistedState();
    return {
      ...persisted,
      appContext: { progressionLength: 0, isPlaying: false },
      pendingAction: null,
      idleSeconds: 0,
      isIdle: false,
      paused: false,
      snoozedUntil: null,
    };
  }, []);

  const [state, dispatch] = useReducer(reducer, initial);

  // ── Persist to localStorage whenever persisted fields change ─────────
  const prevPersistedRef = useRef<TutorialPersistedState | null>(null);
  useEffect(() => {
    const persisted: TutorialPersistedState = {
      completedSteps: state.completedSteps,
      skippedSteps: state.skippedSteps,
      tutorialVersion: state.tutorialVersion,
      dismissed: state.dismissed,
      experienceMode: state.experienceMode,
    };
    // Shallow comparison to avoid unnecessary writes
    const prev = prevPersistedRef.current;
    if (
      prev &&
      prev.dismissed === persisted.dismissed &&
      prev.tutorialVersion === persisted.tutorialVersion &&
      prev.completedSteps === persisted.completedSteps &&
      prev.skippedSteps === persisted.skippedSteps &&
      prev.experienceMode === persisted.experienceMode
    ) {
      return;
    }
    prevPersistedRef.current = persisted;
    savePersistedState(persisted);
  }, [
    state.completedSteps,
    state.skippedSteps,
    state.tutorialVersion,
    state.dismissed,
    state.experienceMode,
  ]);

  // ── Auto-clear snooze when it expires ────────────────────────────────
  useEffect(() => {
    if (state.snoozedUntil === null) return;
    const remaining = state.snoozedUntil - Date.now();
    if (remaining <= 0) {
      dispatch({ type: 'CLEAR_SNOOZE' });
      return;
    }
    const id = setTimeout(() => dispatch({ type: 'CLEAR_SNOOZE' }), remaining);
    return () => clearTimeout(id);
  }, [state.snoozedUntil]);

  // ── Idle detection ────────────────────────────────────────────────────
  useEffect(() => {
    const resetIdle = () => dispatch({ type: 'RESET_IDLE' });
    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];
    events.forEach((e) => window.addEventListener(e, resetIdle, { passive: true }));

    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        dispatch({ type: 'TICK_IDLE' });
      }
    }, IDLE_POLL_MS);

    return () => {
      events.forEach((e) => window.removeEventListener(e, resetIdle));
      clearInterval(interval);
    };
  }, []);

  // ── Resolve active step ───────────────────────────────────────────────
  const completedSet = useMemo(
    () => new Set(state.completedSteps),
    [state.completedSteps],
  );
  const skippedSet = useMemo(
    () => new Set(state.skippedSteps),
    [state.skippedSteps],
  );

  // Filter steps based on the current experience mode before resolution.
  const allowedSteps = useMemo(
    () => ALL_TUTORIAL_STEPS.filter((s) => isStepAllowedInMode(s, state.experienceMode)),
    [state.experienceMode],
  );

  // Compute all currently eligible steps (passes trigger evaluation).
  // Used to emit `step_eligible` events for funnel analysis.
  const eligibleSteps = useMemo(() => {
    if (state.dismissed) return [];
    if (state.paused) return [];
    return findEligibleSteps(allowedSteps, {
      completedSteps: completedSet,
      skippedSteps: skippedSet,
      pendingAction: state.pendingAction,
      appContext: state.appContext,
      isIdle: state.isIdle,
      idleSeconds: state.idleSeconds,
    });
  }, [
    state.dismissed,
    state.paused,
    state.pendingAction,
    state.appContext,
    state.isIdle,
    state.idleSeconds,
    allowedSteps,
    completedSet,
    skippedSet,
  ]);

  const activeStep: TutorialStep | null = useMemo(() => {
    if (eligibleSteps.length === 0) return null;
    const sorted = [...eligibleSteps].sort((a, b) => b.priority - a.priority);
    return sorted[0];
  }, [eligibleSteps]);

  // ── Step progress ─────────────────────────────────────────────────────
  // `totalSteps` is the number of steps not yet completed or skipped (across
  // all modes so the count is stable as the user changes modes).
  // `stepIndex` is the 1-based rank of the active step within the remaining
  // steps sorted by priority.
  const { stepIndex, totalSteps } = useMemo(() => {
    const remaining = ALL_TUTORIAL_STEPS.filter(
      (s) => !completedSet.has(s.id) && !skippedSet.has(s.id),
    );
    const sorted = [...remaining].sort((a, b) => b.priority - a.priority);
    const idx = activeStep
      ? sorted.findIndex((s) => s.id === activeStep.id) + 1
      : 0;
    return { stepIndex: idx, totalSteps: sorted.length };
  }, [activeStep, completedSet, skippedSet]);

  // Clear action-based pending event after it has been consumed (i.e., a step
  // became active or no step matched).  This prevents the same event from
  // re-triggering on subsequent renders.
  const prevActionRef = useRef<string | null>(null);
  useEffect(() => {
    if (state.pendingAction !== null && prevActionRef.current !== state.pendingAction) {
      prevActionRef.current = state.pendingAction;
      // Schedule clear on next tick so the resolved step has time to render.
      const id = setTimeout(() => dispatch({ type: 'CLEAR_ACTION' }), 0);
      return () => clearTimeout(id);
    }
  }, [state.pendingAction]);

  // ── Telemetry: step_eligible ──────────────────────────────────────────
  // Emit a `step_eligible` event the first time each step passes trigger
  // evaluation.  We deduplicate via a ref so repeated renders don't spam.
  // The reported-eligible set is cleared whenever completed/skipped sets
  // change (a step becoming completed removes it from future eligibility).
  const reportedEligibleRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    for (const step of eligibleSteps) {
      if (reportedEligibleRef.current.has(step.id)) continue;
      reportedEligibleRef.current.add(step.id);
      emitTutorialEvent({
        event: 'step_eligible',
        stepId: step.id,
        feature: step.feature,
        triggerType: step.trigger.type,
        contentVersion: TUTORIAL_CONTENT_VERSION,
      });
    }
  }, [eligibleSteps]);

  // Clear reported-eligible tracking whenever the completed/skipped sets
  // change so that a reset can re-report eligibility correctly.
  useEffect(() => {
    reportedEligibleRef.current = new Set();
  }, [completedSet, skippedSet]);

  // ── Telemetry: step_shown ─────────────────────────────────────────────
  // Emit `step_shown` whenever a new step becomes the active step.
  // Also record the timestamp so immediate-close can be detected later.
  const prevActiveStepIdRef = useRef<string | null>(null);
  const stepShownAtRef = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    const id = activeStep?.id ?? null;
    if (id !== null && id !== prevActiveStepIdRef.current) {
      prevActiveStepIdRef.current = id;
      stepShownAtRef.current.set(id, Date.now());
      emitTutorialEvent({
        event: 'step_shown',
        stepId: id,
        feature: activeStep!.feature,
        triggerType: activeStep!.trigger.type,
        contentVersion: TUTORIAL_CONTENT_VERSION,
      });
    } else if (id === null) {
      prevActiveStepIdRef.current = null;
    }
  }, [activeStep]);

  // ── Public API ────────────────────────────────────────────────────────

  const fireEvent = useCallback((eventName: string) => {
    log.debug('fireEvent', eventName);
    dispatch({ type: 'FIRE_EVENT', eventName });
  }, []);

  const updateAppContext = useCallback((ctx: Partial<TutorialAppContext>) => {
    dispatch({ type: 'UPDATE_APP_CONTEXT', ctx });
  }, []);

  const dismiss = useCallback(
    (a11y?: TutorialA11yDiagnostic) => {
      if (activeStep) {
        log.debug('dismiss step', activeStep.id);
        const shownAt = stepShownAtRef.current.get(activeStep.id);
        const immediateClose =
          shownAt !== undefined && Date.now() - shownAt < 1000;
        if (immediateClose) {
          log.warn('Immediate close detected for step', activeStep.id, {
            elapsedMs: shownAt !== undefined ? Date.now() - shownAt : null,
          });
        }
        // Use the recorded focus result from mount; fall back to the caller-
        // supplied value; assume success only as a last resort (e.g. programmatic
        // dismissals where no diagnostic has been reported yet).
        const focusSuccess =
          focusResultRef.current.get(activeStep.id) ??
          a11y?.focusSuccess ??
          true;
        emitTutorialEvent({
          event: 'step_completed',
          stepId: activeStep.id,
          feature: activeStep.feature,
          triggerType: activeStep.trigger.type,
          contentVersion: TUTORIAL_CONTENT_VERSION,
          a11y: { ...a11y, focusSuccess, immediateClose },
        });
        stepShownAtRef.current.delete(activeStep.id);
        focusResultRef.current.delete(activeStep.id);
        dispatch({ type: 'COMPLETE_STEP', stepId: activeStep.id });
      }
    },
    [activeStep],
  );

  const skip = useCallback(
    (a11y?: TutorialA11yDiagnostic) => {
      if (activeStep) {
        log.debug('skip step', activeStep.id);
        const shownAt = stepShownAtRef.current.get(activeStep.id);
        const immediateClose =
          shownAt !== undefined && Date.now() - shownAt < 1000;
        if (immediateClose) {
          log.warn('Immediate close (skip) detected for step', activeStep.id, {
            elapsedMs: shownAt !== undefined ? Date.now() - shownAt : null,
          });
        }
        const focusSuccess =
          focusResultRef.current.get(activeStep.id) ??
          a11y?.focusSuccess ??
          true;
        emitTutorialEvent({
          event: 'step_skipped',
          stepId: activeStep.id,
          feature: activeStep.feature,
          triggerType: activeStep.trigger.type,
          contentVersion: TUTORIAL_CONTENT_VERSION,
          a11y: { ...a11y, focusSuccess, immediateClose },
        });
        stepShownAtRef.current.delete(activeStep.id);
        focusResultRef.current.delete(activeStep.id);
        dispatch({ type: 'SKIP_STEP', stepId: activeStep.id });
      }
    },
    [activeStep],
  );

  const skipAll = useCallback(() => {
    log.debug('skipAll');
    emitTutorialEvent({
      event: 'tutorial_dismissed_all',
      stepId: null,
      feature: null,
      triggerType: null,
      contentVersion: TUTORIAL_CONTENT_VERSION,
    });
    dispatch({ type: 'SKIP_ALL' });
  }, []);

  const reset = useCallback(() => {
    log.debug('reset');
    emitTutorialEvent({
      event: 'tutorial_reset',
      stepId: null,
      feature: null,
      triggerType: null,
      contentVersion: TUTORIAL_CONTENT_VERSION,
    });
    dispatch({ type: 'RESET' });
  }, []);

  const setExperienceMode = useCallback((mode: TutorialExperienceMode) => {
    log.debug('setExperienceMode', mode);
    dispatch({ type: 'SET_MODE', mode });
  }, []);

  const snooze = useCallback((durationMs?: number) => {
    const duration = durationMs ?? DEFAULT_SNOOZE_DURATION_MS;
    log.debug('snooze', duration);
    dispatch({ type: 'SNOOZE', until: Date.now() + duration });
  }, []);

  // ── Accessibility diagnostics callback ────────────────────────────────
  // Passed to tutorial UI components so they can report focus success/failure
  // and input method back to the provider for telemetry and warnings.
  // Focus results are stored per-step so that close events can report the
  // actual focus state from mount rather than assuming success.
  const focusResultRef = useRef<Map<string, boolean>>(new Map());

  const handleFocusDiagnostic = useCallback(
    (stepId: string, diagnostic: TutorialA11yDiagnostic) => {
      focusResultRef.current.set(stepId, diagnostic.focusSuccess);
      if (!diagnostic.focusSuccess) {
        log.warn('Focus failed to move to tutorial UI element', {
          stepId,
          ...diagnostic,
        });
      }
    },
    [],
  );

  const value = useMemo(
    () => ({
      activeStep,
      completedSteps: state.completedSteps,
      skippedSteps: state.skippedSteps,
      dismissed: state.dismissed,
      experienceMode: state.experienceMode,
      paused: state.paused,
      stepIndex,
      totalSteps,
      fireEvent,
      updateAppContext,
      dismiss,
      skip,
      skipAll,
      reset,
      setExperienceMode,
      snooze,
    }),
    [
      activeStep,
      state.completedSteps,
      state.skippedSteps,
      state.dismissed,
      state.experienceMode,
      state.paused,
      stepIndex,
      totalSteps,
      fireEvent,
      updateAppContext,
      dismiss,
      skip,
      skipAll,
      reset,
      setExperienceMode,
      snooze,
    ],
  );

  return (
    <TutorialContext.Provider value={value}>
      {children}
      {activeStep?.uiType === 'tooltip' && (
        <TutorialTooltip
          step={activeStep}
          stepIndex={stepIndex}
          totalSteps={totalSteps}
          onDismiss={dismiss}
          onSkip={skip}
          onSkipAll={skipAll}
          onSnooze={snooze}
          onFocusDiagnostic={handleFocusDiagnostic}
        />
      )}
      {activeStep?.uiType === 'modal' && (
        <TutorialModal
          step={activeStep}
          stepIndex={stepIndex}
          totalSteps={totalSteps}
          onDismiss={dismiss}
          onSkip={skip}
          onSkipAll={skipAll}
          onSnooze={snooze}
          onFocusDiagnostic={handleFocusDiagnostic}
        />
      )}
    </TutorialContext.Provider>
  );
}
