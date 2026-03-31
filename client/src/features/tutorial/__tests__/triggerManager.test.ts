import { describe, it, expect } from 'vitest';
import {
  evaluateTrigger,
  resolveActiveStep,
} from '../utils/triggerManager';
import type { TriggerContext } from '../utils/triggerManager';
import type { TutorialStep } from '../types';

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
    ...overrides,
  };
}

// ── evaluateTrigger ────────────────────────────────────────────────────────

describe('evaluateTrigger', () => {
  describe('onAction', () => {
    it('returns true when pending action matches', () => {
      const ctx = makeCtx({ pendingAction: 'chordAdded' });
      expect(
        evaluateTrigger({ type: 'onAction', action: 'chordAdded' }, ctx),
      ).toBe(true);
    });

    it('returns false when pending action does not match', () => {
      const ctx = makeCtx({ pendingAction: 'otherEvent' });
      expect(
        evaluateTrigger({ type: 'onAction', action: 'chordAdded' }, ctx),
      ).toBe(false);
    });

    it('returns false when no pending action', () => {
      const ctx = makeCtx({ pendingAction: null });
      expect(
        evaluateTrigger({ type: 'onAction', action: 'chordAdded' }, ctx),
      ).toBe(false);
    });
  });

  describe('onState', () => {
    it('emptyProgression → true when progression is empty', () => {
      const ctx = makeCtx({ appContext: { progressionLength: 0, isPlaying: false } });
      expect(
        evaluateTrigger({ type: 'onState', condition: 'emptyProgression' }, ctx),
      ).toBe(true);
    });

    it('emptyProgression → false when progression has chords', () => {
      const ctx = makeCtx({ appContext: { progressionLength: 2, isPlaying: false } });
      expect(
        evaluateTrigger({ type: 'onState', condition: 'emptyProgression' }, ctx),
      ).toBe(false);
    });

    it('shortProgression → true for 1–2 chords', () => {
      const ctx1 = makeCtx({ appContext: { progressionLength: 1, isPlaying: false } });
      const ctx2 = makeCtx({ appContext: { progressionLength: 2, isPlaying: false } });
      expect(
        evaluateTrigger({ type: 'onState', condition: 'shortProgression' }, ctx1),
      ).toBe(true);
      expect(
        evaluateTrigger({ type: 'onState', condition: 'shortProgression' }, ctx2),
      ).toBe(true);
    });

    it('shortProgression → false for 0 or 3+ chords', () => {
      const ctx0 = makeCtx({ appContext: { progressionLength: 0, isPlaying: false } });
      const ctx3 = makeCtx({ appContext: { progressionLength: 3, isPlaying: false } });
      expect(
        evaluateTrigger({ type: 'onState', condition: 'shortProgression' }, ctx0),
      ).toBe(false);
      expect(
        evaluateTrigger({ type: 'onState', condition: 'shortProgression' }, ctx3),
      ).toBe(false);
    });

    it('fullProgression → true when 8+ chords', () => {
      const ctx = makeCtx({ appContext: { progressionLength: 8, isPlaying: false } });
      expect(
        evaluateTrigger({ type: 'onState', condition: 'fullProgression' }, ctx),
      ).toBe(true);
    });

    it('fullProgression → false when < 8 chords', () => {
      const ctx = makeCtx({ appContext: { progressionLength: 7, isPlaying: false } });
      expect(
        evaluateTrigger({ type: 'onState', condition: 'fullProgression' }, ctx),
      ).toBe(false);
    });

    it('isPlaying → true when playback active', () => {
      const ctx = makeCtx({ appContext: { progressionLength: 0, isPlaying: true } });
      expect(
        evaluateTrigger({ type: 'onState', condition: 'isPlaying' }, ctx),
      ).toBe(true);
    });
  });

  describe('onIdle', () => {
    it('returns true when idle and idleSeconds meets threshold', () => {
      const ctx = makeCtx({ isIdle: true, idleSeconds: 10 });
      expect(
        evaluateTrigger({ type: 'onIdle', idleSeconds: 5 }, ctx),
      ).toBe(true);
    });

    it('returns true when idle and idleSeconds exactly meets threshold', () => {
      const ctx = makeCtx({ isIdle: true, idleSeconds: 5 });
      expect(
        evaluateTrigger({ type: 'onIdle', idleSeconds: 5 }, ctx),
      ).toBe(true);
    });

    it('returns false when not idle', () => {
      const ctx = makeCtx({ isIdle: false, idleSeconds: 10 });
      expect(
        evaluateTrigger({ type: 'onIdle', idleSeconds: 5 }, ctx),
      ).toBe(false);
    });

    it('returns false when idle but threshold not met', () => {
      const ctx = makeCtx({ isIdle: true, idleSeconds: 3 });
      expect(
        evaluateTrigger({ type: 'onIdle', idleSeconds: 5 }, ctx),
      ).toBe(false);
    });
  });

  describe('composite', () => {
    it('mode=all: returns true only when all conditions pass', () => {
      const ctx = makeCtx({
        pendingAction: 'chordAdded',
        appContext: { progressionLength: 0, isPlaying: false },
      });
      const trigger = {
        type: 'composite' as const,
        mode: 'all' as const,
        conditions: [
          { type: 'onAction' as const, action: 'chordAdded' },
          { type: 'onState' as const, condition: 'emptyProgression' as const },
        ],
      };
      expect(evaluateTrigger(trigger, ctx)).toBe(true);
    });

    it('mode=all: returns false when one condition fails', () => {
      const ctx = makeCtx({
        pendingAction: 'chordAdded',
        appContext: { progressionLength: 2, isPlaying: false }, // not empty
      });
      const trigger = {
        type: 'composite' as const,
        mode: 'all' as const,
        conditions: [
          { type: 'onAction' as const, action: 'chordAdded' },
          { type: 'onState' as const, condition: 'emptyProgression' as const },
        ],
      };
      expect(evaluateTrigger(trigger, ctx)).toBe(false);
    });

    it('mode=any: returns true when at least one condition passes', () => {
      const ctx = makeCtx({
        pendingAction: null,
        appContext: { progressionLength: 0, isPlaying: false },
      });
      const trigger = {
        type: 'composite' as const,
        mode: 'any' as const,
        conditions: [
          { type: 'onAction' as const, action: 'chordAdded' }, // false
          { type: 'onState' as const, condition: 'emptyProgression' as const }, // true
        ],
      };
      expect(evaluateTrigger(trigger, ctx)).toBe(true);
    });

    it('mode=any: returns false when all conditions fail', () => {
      const ctx = makeCtx({
        pendingAction: null,
        appContext: { progressionLength: 3, isPlaying: false },
      });
      const trigger = {
        type: 'composite' as const,
        mode: 'any' as const,
        conditions: [
          { type: 'onAction' as const, action: 'chordAdded' },
          { type: 'onState' as const, condition: 'emptyProgression' as const },
        ],
      };
      expect(evaluateTrigger(trigger, ctx)).toBe(false);
    });
  });
});

// ── resolveActiveStep ──────────────────────────────────────────────────────

describe('resolveActiveStep', () => {
  it('returns null when no steps are provided', () => {
    expect(resolveActiveStep([], makeCtx())).toBeNull();
  });

  it('returns null when all steps are completed', () => {
    const step = makeStep({ id: 'step-1', trigger: { type: 'onAction', action: 'ev' } });
    const ctx = makeCtx({
      completedSteps: new Set(['step-1']),
      pendingAction: 'ev',
    });
    expect(resolveActiveStep([step], ctx)).toBeNull();
  });

  it('returns null when all steps are skipped', () => {
    const step = makeStep({ id: 'step-1', trigger: { type: 'onAction', action: 'ev' } });
    const ctx = makeCtx({
      skippedSteps: new Set(['step-1']),
      pendingAction: 'ev',
    });
    expect(resolveActiveStep([step], ctx)).toBeNull();
  });

  it('returns the eligible step when trigger is satisfied', () => {
    const step = makeStep({
      id: 'step-1',
      trigger: { type: 'onState', condition: 'emptyProgression' },
    });
    const ctx = makeCtx({ appContext: { progressionLength: 0, isPlaying: false } });
    expect(resolveActiveStep([step], ctx)).toBe(step);
  });

  it('returns null when trigger is not satisfied', () => {
    const step = makeStep({
      id: 'step-1',
      trigger: { type: 'onState', condition: 'emptyProgression' },
    });
    const ctx = makeCtx({ appContext: { progressionLength: 2, isPlaying: false } });
    expect(resolveActiveStep([step], ctx)).toBeNull();
  });

  it('priority queue: returns highest-priority eligible step', () => {
    const low = makeStep({
      id: 'low',
      priority: 2,
      trigger: { type: 'onState', condition: 'emptyProgression' },
    });
    const high = makeStep({
      id: 'high',
      priority: 9,
      trigger: { type: 'onState', condition: 'emptyProgression' },
    });
    const ctx = makeCtx({ appContext: { progressionLength: 0, isPlaying: false } });
    const result = resolveActiveStep([low, high], ctx);
    expect(result?.id).toBe('high');
  });

  it('priority queue: skips completed high-priority step', () => {
    const low = makeStep({
      id: 'low',
      priority: 2,
      trigger: { type: 'onState', condition: 'emptyProgression' },
    });
    const high = makeStep({
      id: 'high',
      priority: 9,
      trigger: { type: 'onState', condition: 'emptyProgression' },
    });
    const ctx = makeCtx({
      completedSteps: new Set(['high']),
      appContext: { progressionLength: 0, isPlaying: false },
    });
    const result = resolveActiveStep([low, high], ctx);
    expect(result?.id).toBe('low');
  });

  it('does not mutate the input steps array', () => {
    const steps: TutorialStep[] = [
      makeStep({ id: 'a', priority: 1, trigger: { type: 'onAction', action: 'ev' } }),
      makeStep({ id: 'b', priority: 2, trigger: { type: 'onAction', action: 'ev' } }),
    ];
    const originalOrder = steps.map((s) => s.id);
    resolveActiveStep(steps, makeCtx({ pendingAction: 'ev' }));
    expect(steps.map((s) => s.id)).toEqual(originalOrder);
  });
});
