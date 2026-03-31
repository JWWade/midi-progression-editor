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
  TutorialPersistedState,
  TutorialStep,
} from '../types';
import {
  ALL_TUTORIAL_STEPS,
  TUTORIAL_CONTENT_VERSION,
} from '../data/tutorials';
import { resolveActiveStep } from '../utils/triggerManager';
import { TutorialTooltip } from '../components/TutorialTooltip';
import { TutorialModal } from '../components/TutorialModal';
import { createLogger } from '@/shared/utils/logger';

const log = createLogger('tutorial');

// ── LocalStorage key ──────────────────────────────────────────────────────

const STORAGE_KEY = 'tutorial_state_v1';

// ── Default idle threshold (seconds) ─────────────────────────────────────

const IDLE_POLL_MS = 1000;

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
        return parsed as TutorialPersistedState;
      }
    }
  } catch {
    // Corrupt or unavailable storage — start fresh
  }
  return freshState();
}

function freshState(): TutorialPersistedState {
  return {
    completedSteps: [],
    skippedSteps: [],
    tutorialVersion: TUTORIAL_CONTENT_VERSION,
    dismissed: false,
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
  | { type: 'RESET_IDLE' };

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
    };
    // Shallow comparison to avoid unnecessary writes
    const prev = prevPersistedRef.current;
    if (
      prev &&
      prev.dismissed === persisted.dismissed &&
      prev.tutorialVersion === persisted.tutorialVersion &&
      prev.completedSteps === persisted.completedSteps &&
      prev.skippedSteps === persisted.skippedSteps
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
  ]);

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

  const activeStep: TutorialStep | null = useMemo(() => {
    if (state.dismissed) return null;
    return resolveActiveStep(ALL_TUTORIAL_STEPS, {
      completedSteps: completedSet,
      skippedSteps: skippedSet,
      pendingAction: state.pendingAction,
      appContext: state.appContext,
      isIdle: state.isIdle,
      idleSeconds: state.idleSeconds,
    });
  }, [
    state.dismissed,
    state.pendingAction,
    state.appContext,
    state.isIdle,
    state.idleSeconds,
    completedSet,
    skippedSet,
  ]);

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

  // ── Public API ────────────────────────────────────────────────────────

  const fireEvent = useCallback((eventName: string) => {
    log.debug('fireEvent', eventName);
    dispatch({ type: 'FIRE_EVENT', eventName });
  }, []);

  const updateAppContext = useCallback((ctx: Partial<TutorialAppContext>) => {
    dispatch({ type: 'UPDATE_APP_CONTEXT', ctx });
  }, []);

  const dismiss = useCallback(() => {
    if (activeStep) {
      log.debug('dismiss step', activeStep.id);
      dispatch({ type: 'COMPLETE_STEP', stepId: activeStep.id });
    }
  }, [activeStep]);

  const skip = useCallback(() => {
    if (activeStep) {
      log.debug('skip step', activeStep.id);
      dispatch({ type: 'SKIP_STEP', stepId: activeStep.id });
    }
  }, [activeStep]);

  const skipAll = useCallback(() => {
    log.debug('skipAll');
    dispatch({ type: 'SKIP_ALL' });
  }, []);

  const reset = useCallback(() => {
    log.debug('reset');
    dispatch({ type: 'RESET' });
  }, []);

  const value = useMemo(
    () => ({
      activeStep,
      completedSteps: state.completedSteps,
      skippedSteps: state.skippedSteps,
      dismissed: state.dismissed,
      fireEvent,
      updateAppContext,
      dismiss,
      skip,
      skipAll,
      reset,
    }),
    [
      activeStep,
      state.completedSteps,
      state.skippedSteps,
      state.dismissed,
      fireEvent,
      updateAppContext,
      dismiss,
      skip,
      skipAll,
      reset,
    ],
  );

  return (
    <TutorialContext.Provider value={value}>
      {children}
      {activeStep?.uiType === 'tooltip' && (
        <TutorialTooltip
          step={activeStep}
          onDismiss={dismiss}
          onSkip={skip}
          onSkipAll={skipAll}
        />
      )}
      {activeStep?.uiType === 'modal' && (
        <TutorialModal
          step={activeStep}
          onDismiss={dismiss}
          onSkip={skip}
          onSkipAll={skipAll}
        />
      )}
    </TutorialContext.Provider>
  );
}
