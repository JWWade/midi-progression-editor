import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  validateTutorialDefinitions,
  assertValidTutorialDefinitions,
} from '../utils/validateTutorialDefinitions';
import type { TutorialStep } from '../types';

// ── Helpers ────────────────────────────────────────────────────────────────

function makeStep(overrides: Partial<TutorialStep> = {}): TutorialStep {
  return {
    id: 'test-step',
    feature: 'test',
    title: 'Test Step',
    description: 'A test step description.',
    trigger: { type: 'onAction', action: 'testEvent' },
    priority: 5,
    uiType: 'tooltip',
    targetSelector: '#test-element',
    ...overrides,
  };
}

// ── validateTutorialDefinitions ────────────────────────────────────────────

describe('validateTutorialDefinitions', () => {
  // ── Empty / valid input ─────────────────────────────────────────────────

  it('returns isValid=true and empty arrays for an empty step list', () => {
    const result = validateTutorialDefinitions([]);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.warnings).toHaveLength(0);
  });

  it('returns isValid=true for a single valid tooltip step', () => {
    const result = validateTutorialDefinitions([makeStep()]);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('returns isValid=true for a single valid modal step', () => {
    const step = makeStep({ uiType: 'modal', targetSelector: undefined });
    const result = validateTutorialDefinitions([step]);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('does not mutate the input array', () => {
    const steps = [makeStep({ id: 'a' }), makeStep({ id: 'b' })];
    const originalOrder = steps.map((s) => s.id);
    validateTutorialDefinitions(steps);
    expect(steps.map((s) => s.id)).toEqual(originalOrder);
  });

  // ── DUPLICATE_ID ────────────────────────────────────────────────────────

  describe('DUPLICATE_ID', () => {
    it('reports an error when two steps share the same id', () => {
      const steps = [makeStep({ id: 'dup' }), makeStep({ id: 'dup' })];
      const result = validateTutorialDefinitions(steps);
      expect(result.isValid).toBe(false);
      const err = result.errors.find((e) => e.code === 'DUPLICATE_ID');
      expect(err).toBeDefined();
      expect(err?.stepId).toBe('dup');
    });

    it('reports an error for each additional duplicate (3 copies → 2 errors)', () => {
      const steps = [
        makeStep({ id: 'dup' }),
        makeStep({ id: 'dup' }),
        makeStep({ id: 'dup' }),
      ];
      const result = validateTutorialDefinitions(steps);
      const errs = result.errors.filter((e) => e.code === 'DUPLICATE_ID');
      expect(errs).toHaveLength(2);
    });

    it('does not report an error when all ids are unique', () => {
      const steps = [makeStep({ id: 'a' }), makeStep({ id: 'b' }), makeStep({ id: 'c' })];
      const result = validateTutorialDefinitions(steps);
      expect(result.errors.filter((e) => e.code === 'DUPLICATE_ID')).toHaveLength(0);
    });
  });

  // ── PRIORITY_OUT_OF_RANGE ───────────────────────────────────────────────

  describe('PRIORITY_OUT_OF_RANGE', () => {
    it('reports an error when priority is 0', () => {
      const result = validateTutorialDefinitions([makeStep({ priority: 0 })]);
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.code === 'PRIORITY_OUT_OF_RANGE')).toBe(true);
    });

    it('reports an error when priority is 101', () => {
      const result = validateTutorialDefinitions([makeStep({ priority: 101 })]);
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.code === 'PRIORITY_OUT_OF_RANGE')).toBe(true);
    });

    it('reports an error when priority is negative', () => {
      const result = validateTutorialDefinitions([makeStep({ priority: -1 })]);
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.code === 'PRIORITY_OUT_OF_RANGE')).toBe(true);
    });

    it('reports an error when priority is not an integer', () => {
      const result = validateTutorialDefinitions([makeStep({ priority: 5.5 })]);
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.code === 'PRIORITY_OUT_OF_RANGE')).toBe(true);
    });

    it('does not report an error for priority 1 (minimum)', () => {
      const result = validateTutorialDefinitions([makeStep({ priority: 1 })]);
      expect(result.errors.filter((e) => e.code === 'PRIORITY_OUT_OF_RANGE')).toHaveLength(0);
    });

    it('does not report an error for priority 100 (maximum)', () => {
      const result = validateTutorialDefinitions([makeStep({ priority: 100 })]);
      expect(result.errors.filter((e) => e.code === 'PRIORITY_OUT_OF_RANGE')).toHaveLength(0);
    });

    it('does not report an error for priority 50 (midpoint)', () => {
      const result = validateTutorialDefinitions([makeStep({ priority: 50 })]);
      expect(result.errors.filter((e) => e.code === 'PRIORITY_OUT_OF_RANGE')).toHaveLength(0);
    });
  });

  // ── TOOLTIP_MISSING_SELECTOR ────────────────────────────────────────────

  describe('TOOLTIP_MISSING_SELECTOR', () => {
    it('reports an error when a tooltip step has no targetSelector', () => {
      const step = makeStep({ uiType: 'tooltip', targetSelector: undefined });
      const result = validateTutorialDefinitions([step]);
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.code === 'TOOLTIP_MISSING_SELECTOR')).toBe(true);
    });

    it('reports an error when a tooltip step has an empty targetSelector', () => {
      const step = makeStep({ uiType: 'tooltip', targetSelector: '' });
      const result = validateTutorialDefinitions([step]);
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.code === 'TOOLTIP_MISSING_SELECTOR')).toBe(true);
    });

    it('reports an error when a tooltip step has a whitespace-only targetSelector', () => {
      const step = makeStep({ uiType: 'tooltip', targetSelector: '   ' });
      const result = validateTutorialDefinitions([step]);
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.code === 'TOOLTIP_MISSING_SELECTOR')).toBe(true);
    });

    it('does not report an error when a tooltip step has a valid targetSelector', () => {
      const step = makeStep({ uiType: 'tooltip', targetSelector: '#my-element' });
      const result = validateTutorialDefinitions([step]);
      expect(result.errors.filter((e) => e.code === 'TOOLTIP_MISSING_SELECTOR')).toHaveLength(0);
    });

    it('does not require targetSelector on modal steps', () => {
      const step = makeStep({ uiType: 'modal', targetSelector: undefined });
      const result = validateTutorialDefinitions([step]);
      expect(result.errors.filter((e) => e.code === 'TOOLTIP_MISSING_SELECTOR')).toHaveLength(0);
    });
  });

  // ── MODAL_UNEXPECTED_SELECTOR ───────────────────────────────────────────

  describe('MODAL_UNEXPECTED_SELECTOR (warning)', () => {
    it('emits a warning when a modal step declares targetSelector', () => {
      const step = makeStep({ uiType: 'modal', targetSelector: '#ignored' });
      const result = validateTutorialDefinitions([step]);
      expect(result.isValid).toBe(true); // warning, not error
      expect(result.warnings.some((w) => w.code === 'MODAL_UNEXPECTED_SELECTOR')).toBe(true);
    });

    it('does not warn when a modal step omits targetSelector', () => {
      const step = makeStep({ uiType: 'modal', targetSelector: undefined });
      const result = validateTutorialDefinitions([step]);
      expect(result.warnings.filter((w) => w.code === 'MODAL_UNEXPECTED_SELECTOR')).toHaveLength(0);
    });

    it('does not warn for tooltip steps with targetSelector', () => {
      const step = makeStep({ uiType: 'tooltip', targetSelector: '#el' });
      const result = validateTutorialDefinitions([step]);
      expect(result.warnings.filter((w) => w.code === 'MODAL_UNEXPECTED_SELECTOR')).toHaveLength(0);
    });
  });

  // ── AUTO_TRIGGER_UNGUARDED ──────────────────────────────────────────────

  describe('AUTO_TRIGGER_UNGUARDED (warning)', () => {
    it('warns when a step uses a top-level onIdle trigger', () => {
      const step = makeStep({
        trigger: { type: 'onIdle', idleSeconds: 5 },
      });
      const result = validateTutorialDefinitions([step]);
      expect(result.warnings.some((w) => w.code === 'AUTO_TRIGGER_UNGUARDED')).toBe(true);
    });

    it('warns when a step uses a top-level onState trigger', () => {
      const step = makeStep({
        trigger: { type: 'onState', condition: 'emptyProgression' },
      });
      const result = validateTutorialDefinitions([step]);
      expect(result.warnings.some((w) => w.code === 'AUTO_TRIGGER_UNGUARDED')).toBe(true);
    });

    it('does not warn for top-level onAction triggers', () => {
      const step = makeStep({ trigger: { type: 'onAction', action: 'ev' } });
      const result = validateTutorialDefinitions([step]);
      expect(result.warnings.filter((w) => w.code === 'AUTO_TRIGGER_UNGUARDED')).toHaveLength(0);
    });

    it('does not warn for composite triggers', () => {
      const step = makeStep({
        trigger: {
          type: 'composite',
          mode: 'all',
          conditions: [
            { type: 'onState', condition: 'emptyProgression' },
            { type: 'onIdle', idleSeconds: 5 },
          ],
        },
      });
      const result = validateTutorialDefinitions([step]);
      expect(result.warnings.filter((w) => w.code === 'AUTO_TRIGGER_UNGUARDED')).toHaveLength(0);
    });
  });

  // ── CONTRADICTORY_COMPOSITE ─────────────────────────────────────────────

  describe('CONTRADICTORY_COMPOSITE (warning)', () => {
    it('warns when composite mode=all has emptyProgression + shortProgression', () => {
      const step = makeStep({
        trigger: {
          type: 'composite',
          mode: 'all',
          conditions: [
            { type: 'onState', condition: 'emptyProgression' },
            { type: 'onState', condition: 'shortProgression' },
          ],
        },
      });
      const result = validateTutorialDefinitions([step]);
      expect(result.warnings.some((w) => w.code === 'CONTRADICTORY_COMPOSITE')).toBe(true);
    });

    it('warns when composite mode=all has emptyProgression + fullProgression', () => {
      const step = makeStep({
        trigger: {
          type: 'composite',
          mode: 'all',
          conditions: [
            { type: 'onState', condition: 'emptyProgression' },
            { type: 'onState', condition: 'fullProgression' },
          ],
        },
      });
      const result = validateTutorialDefinitions([step]);
      expect(result.warnings.some((w) => w.code === 'CONTRADICTORY_COMPOSITE')).toBe(true);
    });

    it('warns when composite mode=all has shortProgression + fullProgression', () => {
      const step = makeStep({
        trigger: {
          type: 'composite',
          mode: 'all',
          conditions: [
            { type: 'onState', condition: 'shortProgression' },
            { type: 'onState', condition: 'fullProgression' },
          ],
        },
      });
      const result = validateTutorialDefinitions([step]);
      expect(result.warnings.some((w) => w.code === 'CONTRADICTORY_COMPOSITE')).toBe(true);
    });

    it('does not warn when composite mode=any has contradictory-looking conditions (valid use case)', () => {
      const step = makeStep({
        trigger: {
          type: 'composite',
          mode: 'any',
          conditions: [
            { type: 'onState', condition: 'emptyProgression' },
            { type: 'onState', condition: 'fullProgression' },
          ],
        },
      });
      const result = validateTutorialDefinitions([step]);
      expect(result.warnings.filter((w) => w.code === 'CONTRADICTORY_COMPOSITE')).toHaveLength(0);
    });

    it('does not warn when composite mode=all conditions are compatible', () => {
      const step = makeStep({
        trigger: {
          type: 'composite',
          mode: 'all',
          conditions: [
            { type: 'onState', condition: 'emptyProgression' },
            { type: 'onIdle', idleSeconds: 5 },
          ],
        },
      });
      const result = validateTutorialDefinitions([step]);
      expect(result.warnings.filter((w) => w.code === 'CONTRADICTORY_COMPOSITE')).toHaveLength(0);
    });
  });

  // ── Multiple errors ─────────────────────────────────────────────────────

  it('accumulates multiple errors across different rules', () => {
    const steps = [
      makeStep({ id: 'dup', uiType: 'tooltip', targetSelector: undefined, priority: 0 }),
      makeStep({ id: 'dup', uiType: 'tooltip', targetSelector: '#test-element' }),
    ];
    const result = validateTutorialDefinitions(steps);
    expect(result.isValid).toBe(false);
    // DUPLICATE_ID (step 2) + PRIORITY_OUT_OF_RANGE (step 1) + TOOLTIP_MISSING_SELECTOR (step 1)
    expect(result.errors).toHaveLength(3);
  });

  // ── ALL_TUTORIAL_STEPS smoke test ────────────────────────────────────────

  it('validates the actual ALL_TUTORIAL_STEPS export without any errors', async () => {
    const { ALL_TUTORIAL_STEPS } = await import('../data/tutorials');
    const result = validateTutorialDefinitions(ALL_TUTORIAL_STEPS);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});

// ── assertValidTutorialDefinitions ────────────────────────────────────────────

describe('assertValidTutorialDefinitions', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('does not throw for a valid step list', () => {
    const step = makeStep();
    expect(() => assertValidTutorialDefinitions([step])).not.toThrow();
  });

  it('throws an Error when a DUPLICATE_ID error is present', () => {
    const steps = [makeStep({ id: 'dup' }), makeStep({ id: 'dup' })];
    expect(() => assertValidTutorialDefinitions(steps)).toThrow(/DUPLICATE_ID/);
  });

  it('throws an Error when a TOOLTIP_MISSING_SELECTOR error is present', () => {
    const step = makeStep({ uiType: 'tooltip', targetSelector: undefined });
    expect(() => assertValidTutorialDefinitions([step])).toThrow(/TOOLTIP_MISSING_SELECTOR/);
  });

  it('throws an Error when a PRIORITY_OUT_OF_RANGE error is present', () => {
    const step = makeStep({ priority: 999 });
    expect(() => assertValidTutorialDefinitions([step])).toThrow(/PRIORITY_OUT_OF_RANGE/);
  });

  it('logs warnings to console.warn but does not throw for warning-only results', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const step = makeStep({ uiType: 'modal', targetSelector: '#ignored' });
    expect(() => assertValidTutorialDefinitions([step])).not.toThrow();
    expect(warnSpy).toHaveBeenCalledOnce();
  });

  it('does not call console.warn when there are no warnings', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    expect(() => assertValidTutorialDefinitions([makeStep()])).not.toThrow();
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('error message includes all error codes', () => {
    const steps = [
      makeStep({ id: 'dup', priority: 0, uiType: 'tooltip', targetSelector: undefined }),
      makeStep({ id: 'dup' }),
    ];
    let message = '';
    try {
      assertValidTutorialDefinitions(steps);
    } catch (e) {
      message = (e as Error).message;
    }
    expect(message).toMatch(/DUPLICATE_ID/);
    expect(message).toMatch(/PRIORITY_OUT_OF_RANGE/);
    expect(message).toMatch(/TOOLTIP_MISSING_SELECTOR/);
  });
});
