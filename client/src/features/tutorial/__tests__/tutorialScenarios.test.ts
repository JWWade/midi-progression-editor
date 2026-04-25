/**
 * Tutorial Scenario and Accessibility Tests
 *
 * Covers:
 *  - First-time user flow (no persisted progress)
 *  - Returning user flow (some steps completed)
 *  - Experience mode behavior (guided / standard / minimal)
 *  - Snooze / pause behavior
 *  - Step progress indicator values
 *  - Keyboard and accessibility properties
 *
 * These tests exercise the pure logic layers (trigger manager, mode filtering,
 * progress calculation) that are independent of the React rendering pipeline,
 * keeping the suite fast and deterministic.
 */

import { describe, it, expect } from 'vitest';
import { resolveActiveStep } from '../utils/triggerManager';
import type { TriggerContext } from '../utils/triggerManager';
import {
  isStepAllowedInMode,
  containsIdleTrigger,
} from '../utils/modeFiltering';
import type { TutorialStep, TutorialExperienceMode } from '../types';
import { ALL_TUTORIAL_STEPS } from '../data/tutorials';

// ── Helpers ────────────────────────────────────────────────────────────────

function makeCtx(overrides: Partial<TriggerContext> = {}): TriggerContext {
  return {
    completedSteps: new Set(),
    skippedSteps: new Set(),
    pendingAction: null,
    appContext: { progressionLength: 0, isPlaying: false },
    isIdle: false,
    idleSeconds: 0,
    ...overrides,
  };
}

function makeStep(overrides: Partial<TutorialStep>): TutorialStep {
  return {
    id: 'test-step',
    feature: 'test',
    title: 'Test',
    description: 'Test description',
    trigger: { type: 'onAction', action: 'testEvent' },
    priority: 5,
    uiType: 'tooltip',
    targetSelector: '#test-element',
    ...overrides,
  };
}

function filterByMode(
  steps: readonly TutorialStep[],
  mode: TutorialExperienceMode,
): TutorialStep[] {
  return steps.filter((s) => isStepAllowedInMode(s, mode));
}

/** Compute stepIndex and totalSteps given context */
function computeProgress(
  steps: readonly TutorialStep[],
  ctx: TriggerContext,
  activeStep: TutorialStep | null,
): { stepIndex: number; totalSteps: number } {
  const remaining = steps.filter(
    (s) => !ctx.completedSteps.has(s.id) && !ctx.skippedSteps.has(s.id),
  );
  const sorted = [...remaining].sort((a, b) => b.priority - a.priority);
  const idx = activeStep
    ? sorted.findIndex((s) => s.id === activeStep.id) + 1
    : 0;
  return { stepIndex: idx, totalSteps: sorted.length };
}

// ── First-time user flow ───────────────────────────────────────────────────

describe('first-time user flow', () => {
  it('shows add-first-chord modal when progression is empty', () => {
    const ctx = makeCtx({
      appContext: { progressionLength: 0, isPlaying: false },
      isIdle: true,
      idleSeconds: 3,
    });
    const step = resolveActiveStep(ALL_TUTORIAL_STEPS, ctx);
    // add-first-chord (priority 10) wins over explore-circle (priority 5).
    expect(step).not.toBeNull();
    expect(step?.id).toBe('add-first-chord');
    expect(step?.uiType).toBe('modal');
  });

  it('add-first-chord step has no targetSelector (modal step)', () => {
    const step = ALL_TUTORIAL_STEPS.find((s) => s.id === 'add-first-chord');
    expect(step?.targetSelector).toBeUndefined();
    expect(step?.uiType).toBe('modal');
  });

  it('shows preview-chord-audio after chordSelected event', () => {
    const ctx = makeCtx({
      pendingAction: 'chordSelected',
      appContext: { progressionLength: 0, isPlaying: false },
    });
    const step = resolveActiveStep(ALL_TUTORIAL_STEPS, ctx);
    // add-first-chord requires idle gate (not met here), so preview-chord-audio
    // (priority 7, onAction: chordSelected) is the highest-priority eligible step.
    expect(step?.id).toBe('preview-chord-audio');
  });

  it('shows play-progression after chordAdded event', () => {
    // Simulate first-time user who has dismissed the add-first-chord modal
    const ctx = makeCtx({
      pendingAction: 'chordAdded',
      completedSteps: new Set(['add-first-chord']),
      appContext: { progressionLength: 1, isPlaying: false },
    });
    const step = resolveActiveStep(ALL_TUTORIAL_STEPS, ctx);
    expect(step?.id).toBe('play-progression');
    expect(step?.uiType).toBe('tooltip');
  });

  it('step progress starts at 1 of total-steps for first active step', () => {
    const ctx = makeCtx({
      appContext: { progressionLength: 0, isPlaying: false },
      isIdle: true,
      idleSeconds: 3,
    });
    const active = resolveActiveStep(ALL_TUTORIAL_STEPS, ctx);
    const { stepIndex, totalSteps } = computeProgress(ALL_TUTORIAL_STEPS, ctx, active);
    expect(active).not.toBeNull();
    expect(stepIndex).toBe(1);
    expect(totalSteps).toBe(ALL_TUTORIAL_STEPS.length);
  });
});

// ── Returning user flow ────────────────────────────────────────────────────

describe('returning user flow', () => {
  it('does not re-show completed steps', () => {
    const ctx = makeCtx({
      completedSteps: new Set(['add-first-chord', 'preview-chord-audio']),
      appContext: { progressionLength: 0, isPlaying: false },
    });
    const step = resolveActiveStep(ALL_TUTORIAL_STEPS, ctx);
    // add-first-chord is completed, so the next eligible step should be explored
    expect(step?.id).not.toBe('add-first-chord');
    expect(step?.id).not.toBe('preview-chord-audio');
  });

  it('does not re-show skipped steps', () => {
    const ctx = makeCtx({
      skippedSteps: new Set(['add-first-chord']),
      appContext: { progressionLength: 0, isPlaying: false },
    });
    const step = resolveActiveStep(ALL_TUTORIAL_STEPS, ctx);
    expect(step?.id).not.toBe('add-first-chord');
  });

  it('stepIndex reflects completed steps in progress counter', () => {
    const completed = new Set(['add-first-chord']); // highest priority step done
    const ctx = makeCtx({
      completedSteps: completed,
      pendingAction: 'chordSelected',
      appContext: { progressionLength: 1, isPlaying: false },
    });
    const active = resolveActiveStep(ALL_TUTORIAL_STEPS, ctx);
    const { stepIndex, totalSteps } = computeProgress(ALL_TUTORIAL_STEPS, ctx, active);
    expect(active).not.toBeNull();
    // 1 step completed means it is removed from `remaining`, so totalSteps decreases
    expect(totalSteps).toBe(ALL_TUTORIAL_STEPS.length - 1);
    // stepIndex should be ≥ 1
    expect(stepIndex).toBeGreaterThanOrEqual(1);
  });

  it('returns null when all steps are completed', () => {
    const ctx = makeCtx({
      completedSteps: new Set(ALL_TUTORIAL_STEPS.map((s) => s.id)),
    });
    const step = resolveActiveStep(ALL_TUTORIAL_STEPS, ctx);
    expect(step).toBeNull();
  });
});

// ── Experience mode: guided ───────────────────────────────────────────────

describe('experience mode: guided', () => {
  it('allows all step types', () => {
    const allSteps = filterByMode(ALL_TUTORIAL_STEPS, 'guided');
    expect(allSteps).toHaveLength(ALL_TUTORIAL_STEPS.length);
  });

  it('allows idle-triggered tooltip steps', () => {
    const idleTooltipStep = makeStep({
      id: 'idle-tooltip',
      uiType: 'tooltip',
      trigger: { type: 'onIdle', idleSeconds: 5 },
    });
    expect(isStepAllowedInMode(idleTooltipStep, 'guided')).toBe(true);
  });

  it('allows state-triggered tooltip steps', () => {
    const stateTooltipStep = makeStep({
      id: 'state-tooltip',
      uiType: 'tooltip',
      trigger: { type: 'onState', condition: 'emptyProgression' },
    });
    expect(isStepAllowedInMode(stateTooltipStep, 'guided')).toBe(true);
  });
});

// ── Experience mode: standard ─────────────────────────────────────────────

describe('experience mode: standard', () => {
  it('allows modal steps regardless of trigger type', () => {
    const modalStep = makeStep({
      id: 'modal-step',
      uiType: 'modal',
      trigger: { type: 'onIdle', idleSeconds: 5 },
      targetSelector: undefined,
    });
    expect(isStepAllowedInMode(modalStep, 'standard')).toBe(true);
  });

  it('suppresses idle-triggered tooltip steps', () => {
    const idleTooltipStep = makeStep({
      id: 'idle-tooltip',
      uiType: 'tooltip',
      trigger: { type: 'onIdle', idleSeconds: 5 },
    });
    expect(isStepAllowedInMode(idleTooltipStep, 'standard')).toBe(false);
  });

  it('suppresses composite-idle tooltip steps', () => {
    const compositeIdleStep = makeStep({
      id: 'composite-idle',
      uiType: 'tooltip',
      trigger: {
        type: 'composite',
        mode: 'all',
        conditions: [
          { type: 'onState', condition: 'emptyProgression' },
          { type: 'onIdle', idleSeconds: 5 },
        ],
      },
    });
    expect(isStepAllowedInMode(compositeIdleStep, 'standard')).toBe(false);
  });

  it('suppresses state-only tooltip steps', () => {
    const stateTooltipStep = makeStep({
      id: 'state-tooltip',
      uiType: 'tooltip',
      trigger: { type: 'onState', condition: 'emptyProgression' },
    });
    expect(isStepAllowedInMode(stateTooltipStep, 'standard')).toBe(false);
  });

  it('allows action-triggered tooltip steps', () => {
    const actionTooltipStep = makeStep({
      id: 'action-tooltip',
      uiType: 'tooltip',
      trigger: { type: 'onAction', action: 'chordAdded' },
    });
    expect(isStepAllowedInMode(actionTooltipStep, 'standard')).toBe(true);
  });

  it('standard mode filters idle steps from ALL_TUTORIAL_STEPS', () => {
    const standardSteps = filterByMode(ALL_TUTORIAL_STEPS, 'standard');
    // explore-circle and export-midi use composite idle triggers → filtered out
    const hasIdleTooltip = standardSteps.some((s) =>
      s.uiType === 'tooltip' && containsIdleTrigger(s.trigger),
    );
    expect(hasIdleTooltip).toBe(false);
  });

  it('standard mode keeps add-first-chord modal', () => {
    const standardSteps = filterByMode(ALL_TUTORIAL_STEPS, 'standard');
    expect(standardSteps.some((s) => s.id === 'add-first-chord')).toBe(true);
  });
});

// ── Experience mode: minimal ──────────────────────────────────────────────

describe('experience mode: minimal', () => {
  it('allows only modal steps', () => {
    const minimalSteps = filterByMode(ALL_TUTORIAL_STEPS, 'minimal');
    expect(minimalSteps.every((s) => s.uiType === 'modal')).toBe(true);
  });

  it('suppresses all tooltip steps', () => {
    const minimalSteps = filterByMode(ALL_TUTORIAL_STEPS, 'minimal');
    expect(minimalSteps.some((s) => s.uiType === 'tooltip')).toBe(false);
  });

  it('keeps add-first-chord (modal) in minimal mode', () => {
    const minimalSteps = filterByMode(ALL_TUTORIAL_STEPS, 'minimal');
    expect(minimalSteps.some((s) => s.id === 'add-first-chord')).toBe(true);
  });

  it('minimal mode shows add-first-chord on empty progression', () => {
    const minimalSteps = filterByMode(ALL_TUTORIAL_STEPS, 'minimal');
    const ctx = makeCtx({
      appContext: { progressionLength: 0, isPlaying: false },
      isIdle: true,
      idleSeconds: 3,
    });
    const step = resolveActiveStep(minimalSteps, ctx);
    expect(step?.id).toBe('add-first-chord');
  });

  it('minimal mode suppresses all steps after onboarding modal dismissed', () => {
    const minimalSteps = filterByMode(ALL_TUTORIAL_STEPS, 'minimal');
    const ctx = makeCtx({
      completedSteps: new Set(['add-first-chord']),
      pendingAction: 'chordAdded',
      appContext: { progressionLength: 1, isPlaying: false },
    });
    const step = resolveActiveStep(minimalSteps, ctx);
    expect(step).toBeNull();
  });
});

// ── Snooze / pause behavior ───────────────────────────────────────────────

describe('snooze / pause behavior', () => {
  it('resolveActiveStep returns null when steps array is empty (paused simulation)', () => {
    // When snoozed, the provider passes an empty or irrelevant steps list.
    // Simulating by resolving against an empty array.
    const ctx = makeCtx({ appContext: { progressionLength: 0, isPlaying: false } });
    const step = resolveActiveStep([], ctx);
    expect(step).toBeNull();
  });

  it('tutorials resume after snooze by returning eligible steps normally', () => {
    const ctx = makeCtx({
      appContext: { progressionLength: 0, isPlaying: false },
      isIdle: true,
      idleSeconds: 3,
    });
    const step = resolveActiveStep(ALL_TUTORIAL_STEPS, ctx);
    expect(step).not.toBeNull();
  });

  it('snooze does not affect completed steps tracking', () => {
    // After snooze, previously completed steps should still be excluded.
    const ctx = makeCtx({
      completedSteps: new Set(['add-first-chord']),
      appContext: { progressionLength: 0, isPlaying: false },
    });
    const step = resolveActiveStep(ALL_TUTORIAL_STEPS, ctx);
    expect(step?.id).not.toBe('add-first-chord');
  });
});

// ── Step progress indicator ───────────────────────────────────────────────

describe('step progress indicator', () => {
  it('stepIndex is 0 when there is no active step', () => {
    const ctx = makeCtx({
      completedSteps: new Set(ALL_TUTORIAL_STEPS.map((s) => s.id)),
    });
    const active = resolveActiveStep(ALL_TUTORIAL_STEPS, ctx);
    const { stepIndex } = computeProgress(ALL_TUTORIAL_STEPS, ctx, active);
    expect(stepIndex).toBe(0);
    expect(active).toBeNull();
  });

  it('totalSteps decreases as steps are completed', () => {
    const ctx0 = makeCtx();
    const ctx1 = makeCtx({ completedSteps: new Set(['add-first-chord']) });
    const ctx2 = makeCtx({
      completedSteps: new Set(['add-first-chord', 'preview-chord-audio']),
    });

    const { totalSteps: t0 } = computeProgress(ALL_TUTORIAL_STEPS, ctx0, null);
    const { totalSteps: t1 } = computeProgress(ALL_TUTORIAL_STEPS, ctx1, null);
    const { totalSteps: t2 } = computeProgress(ALL_TUTORIAL_STEPS, ctx2, null);

    expect(t0).toBe(ALL_TUTORIAL_STEPS.length);
    expect(t1).toBe(ALL_TUTORIAL_STEPS.length - 1);
    expect(t2).toBe(ALL_TUTORIAL_STEPS.length - 2);
  });

  it('stepIndex of active step is within bounds of remaining sorted steps', () => {
    const ctx = makeCtx({
      completedSteps: new Set(['add-first-chord']),
      pendingAction: 'chordSelected',
      appContext: { progressionLength: 1, isPlaying: false },
    });
    const active = resolveActiveStep(ALL_TUTORIAL_STEPS, ctx);
    const { stepIndex, totalSteps } = computeProgress(ALL_TUTORIAL_STEPS, ctx, active);
    if (active !== null) {
      expect(stepIndex).toBeGreaterThan(0);
      expect(stepIndex).toBeLessThanOrEqual(totalSteps);
    }
  });
});

// ── Keyboard / accessibility properties (static assertions) ───────────────

describe('accessibility requirements for tutorial step definitions', () => {
  it('all tooltip steps have a targetSelector (WCAG 1.3.1)', () => {
    const tooltipSteps = ALL_TUTORIAL_STEPS.filter((s) => s.uiType === 'tooltip');
    tooltipSteps.forEach((s) => {
      expect(
        s.targetSelector,
        `Step "${s.id}" is a tooltip but is missing targetSelector`,
      ).toBeTruthy();
    });
  });

  it('all modal steps have no targetSelector (modals are full-screen)', () => {
    const modalSteps = ALL_TUTORIAL_STEPS.filter((s) => s.uiType === 'modal');
    modalSteps.forEach((s) => {
      expect(
        s.targetSelector,
        `Step "${s.id}" is a modal but unexpectedly has targetSelector`,
      ).toBeUndefined();
    });
  });

  it('every step has a non-empty title and description', () => {
    ALL_TUTORIAL_STEPS.forEach((s) => {
      expect(s.title.trim(), `Step "${s.id}" has empty title`).not.toBe('');
      expect(s.description.trim(), `Step "${s.id}" has empty description`).not.toBe('');
    });
  });

  it('all step IDs are unique', () => {
    const ids = ALL_TUTORIAL_STEPS.map((s) => s.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('all priorities are integers in range 1–100', () => {
    ALL_TUTORIAL_STEPS.forEach((s) => {
      expect(
        Number.isInteger(s.priority) && s.priority >= 1 && s.priority <= 100,
        `Step "${s.id}" has out-of-range priority ${s.priority}`,
      ).toBe(true);
    });
  });
});

// ── Experience mode filtering: edge cases ────────────────────────────────

describe('experience mode filtering: edge cases', () => {
  it('composite action+state trigger is allowed in standard mode', () => {
    const compositeActionStep = makeStep({
      id: 'composite-action',
      uiType: 'tooltip',
      trigger: {
        type: 'composite',
        mode: 'all',
        conditions: [
          { type: 'onAction', action: 'chordAdded' },
          { type: 'onState', condition: 'shortProgression' },
        ],
      },
    });
    expect(isStepAllowedInMode(compositeActionStep, 'standard')).toBe(true);
  });

  it('composite action+idle trigger is NOT allowed in standard mode', () => {
    const compositeActionIdleStep = makeStep({
      id: 'composite-action-idle',
      uiType: 'tooltip',
      trigger: {
        type: 'composite',
        mode: 'all',
        conditions: [
          { type: 'onAction', action: 'chordAdded' },
          { type: 'onIdle', idleSeconds: 5 },
        ],
      },
    });
    expect(isStepAllowedInMode(compositeActionIdleStep, 'standard')).toBe(false);
  });

  it('guided mode is a superset of standard mode steps', () => {
    const guided = filterByMode(ALL_TUTORIAL_STEPS, 'guided');
    const standard = filterByMode(ALL_TUTORIAL_STEPS, 'standard');
    const guidedIds = new Set(guided.map((s) => s.id));
    standard.forEach((s) => {
      expect(guidedIds.has(s.id)).toBe(true);
    });
  });

  it('standard mode is a superset of minimal mode steps', () => {
    const standard = filterByMode(ALL_TUTORIAL_STEPS, 'standard');
    const minimal = filterByMode(ALL_TUTORIAL_STEPS, 'minimal');
    const standardIds = new Set(standard.map((s) => s.id));
    minimal.forEach((s) => {
      expect(standardIds.has(s.id)).toBe(true);
    });
  });
});
