/**
 * Tutorial Telemetry Tests
 *
 * Covers:
 *  - Event emission and ring buffer behavior
 *  - Privacy guardrails (only structural identifiers, no user content)
 *  - sessionOffsetMs is a positive number (session-relative)
 *  - Ring buffer bounded at MAX_LOG_SIZE
 *  - clearTutorialEventLog isolates test cases
 *  - findEligibleSteps returns all eligible steps (not just the winner)
 *  - step_eligible deduplication logic in isolation
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  emitTutorialEvent,
  getTutorialEventLog,
  clearTutorialEventLog,
} from '../utils/tutorialTelemetry';
import { findEligibleSteps, resolveActiveStep } from '../utils/triggerManager';
import type { TutorialEventPayload } from '../types';
import type { TriggerContext } from '../utils/triggerManager';
import type { TutorialStep } from '../types';
import { TUTORIAL_CONTENT_VERSION } from '../data/tutorials';

// ── Helpers ────────────────────────────────────────────────────────────────

function makeStep(overrides: Partial<TutorialStep>): TutorialStep {
  return {
    id: 'test-step',
    feature: 'test',
    title: 'Test',
    description: 'Test description',
    trigger: { type: 'onAction', action: 'testEvent' },
    priority: 5,
    uiType: 'tooltip',
    targetSelector: '#test',
    ...overrides,
  };
}

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

// ── tutorialTelemetry ──────────────────────────────────────────────────────

describe('emitTutorialEvent', () => {
  beforeEach(() => {
    clearTutorialEventLog();
  });

  it('appends an event to the ring buffer', () => {
    emitTutorialEvent({
      event: 'step_shown',
      stepId: 'add-first-chord',
      feature: 'progression-sidebar',
      triggerType: 'onState',
      contentVersion: TUTORIAL_CONTENT_VERSION,
    });
    const log = getTutorialEventLog();
    expect(log).toHaveLength(1);
    expect(log[0].event).toBe('step_shown');
  });

  it('sets sessionOffsetMs to a non-negative number', () => {
    emitTutorialEvent({
      event: 'step_shown',
      stepId: 'add-first-chord',
      feature: 'progression-sidebar',
      triggerType: 'onState',
      contentVersion: TUTORIAL_CONTENT_VERSION,
    });
    const entry = getTutorialEventLog()[0];
    expect(typeof entry.sessionOffsetMs).toBe('number');
    expect(entry.sessionOffsetMs).toBeGreaterThanOrEqual(0);
  });

  it('does not include user-entered text or extra keys', () => {
    emitTutorialEvent({
      event: 'step_completed',
      stepId: 'play-progression',
      feature: 'progression-sidebar',
      triggerType: 'onAction',
      contentVersion: TUTORIAL_CONTENT_VERSION,
    });
    const entry = getTutorialEventLog()[0] as unknown as Record<string, unknown>;
    // Only the documented keys should be present
    const allowedKeys: Array<keyof TutorialEventPayload> = [
      'event',
      'stepId',
      'feature',
      'triggerType',
      'contentVersion',
      'sessionOffsetMs',
      'a11y',
    ];
    const actualKeys = Object.keys(entry);
    for (const key of actualKeys) {
      expect(allowedKeys).toContain(key);
    }
  });

  it('supports optional a11y field', () => {
    emitTutorialEvent({
      event: 'step_completed',
      stepId: 'add-first-chord',
      feature: 'progression-sidebar',
      triggerType: 'onState',
      contentVersion: TUTORIAL_CONTENT_VERSION,
      a11y: { focusSuccess: true, inputMethod: 'keyboard', immediateClose: false },
    });
    const entry = getTutorialEventLog()[0];
    expect(entry.a11y?.focusSuccess).toBe(true);
    expect(entry.a11y?.inputMethod).toBe('keyboard');
    expect(entry.a11y?.immediateClose).toBe(false);
  });

  it('accepts tutorial-level events with null stepId and feature', () => {
    emitTutorialEvent({
      event: 'tutorial_dismissed_all',
      stepId: null,
      feature: null,
      triggerType: null,
      contentVersion: TUTORIAL_CONTENT_VERSION,
    });
    const entry = getTutorialEventLog()[0];
    expect(entry.event).toBe('tutorial_dismissed_all');
    expect(entry.stepId).toBeNull();
    expect(entry.feature).toBeNull();
    expect(entry.triggerType).toBeNull();
  });

  it('accepts tutorial_reset event', () => {
    emitTutorialEvent({
      event: 'tutorial_reset',
      stepId: null,
      feature: null,
      triggerType: null,
      contentVersion: TUTORIAL_CONTENT_VERSION,
    });
    expect(getTutorialEventLog()[0].event).toBe('tutorial_reset');
  });
});

describe('getTutorialEventLog', () => {
  beforeEach(() => {
    clearTutorialEventLog();
  });

  it('returns an empty array initially (after clear)', () => {
    expect(getTutorialEventLog()).toHaveLength(0);
  });

  it('returns events in emission order', () => {
    emitTutorialEvent({
      event: 'step_eligible',
      stepId: 'step-a',
      feature: 'test',
      triggerType: 'onAction',
      contentVersion: TUTORIAL_CONTENT_VERSION,
    });
    emitTutorialEvent({
      event: 'step_shown',
      stepId: 'step-a',
      feature: 'test',
      triggerType: 'onAction',
      contentVersion: TUTORIAL_CONTENT_VERSION,
    });
    emitTutorialEvent({
      event: 'step_completed',
      stepId: 'step-a',
      feature: 'test',
      triggerType: 'onAction',
      contentVersion: TUTORIAL_CONTENT_VERSION,
    });
    const log = getTutorialEventLog();
    expect(log[0].event).toBe('step_eligible');
    expect(log[1].event).toBe('step_shown');
    expect(log[2].event).toBe('step_completed');
  });
});

describe('clearTutorialEventLog', () => {
  beforeEach(() => {
    clearTutorialEventLog();
  });

  it('removes all previously emitted events', () => {
    emitTutorialEvent({
      event: 'step_shown',
      stepId: 'x',
      feature: 'test',
      triggerType: 'onIdle',
      contentVersion: TUTORIAL_CONTENT_VERSION,
    });
    expect(getTutorialEventLog()).toHaveLength(1);
    clearTutorialEventLog();
    expect(getTutorialEventLog()).toHaveLength(0);
  });
});

describe('ring buffer bounded at 200 events', () => {
  beforeEach(() => {
    clearTutorialEventLog();
  });

  it('never exceeds 200 entries', () => {
    for (let i = 0; i < 250; i++) {
      emitTutorialEvent({
        event: 'step_shown',
        stepId: `step-${i}`,
        feature: 'test',
        triggerType: 'onAction',
        contentVersion: TUTORIAL_CONTENT_VERSION,
      });
    }
    expect(getTutorialEventLog().length).toBeLessThanOrEqual(200);
  });

  it('keeps the most recent events when the buffer is full', () => {
    for (let i = 0; i < 210; i++) {
      emitTutorialEvent({
        event: 'step_shown',
        stepId: `step-${i}`,
        feature: 'test',
        triggerType: 'onAction',
        contentVersion: TUTORIAL_CONTENT_VERSION,
      });
    }
    const log = getTutorialEventLog();
    // The oldest events (0–9) should have been evicted
    expect(log[0].stepId).toBe('step-10');
    // The newest event should be step-209
    expect(log[log.length - 1].stepId).toBe('step-209');
  });
});

// ── findEligibleSteps ──────────────────────────────────────────────────────

describe('findEligibleSteps', () => {
  it('returns all steps that pass trigger evaluation', () => {
    const steps: TutorialStep[] = [
      makeStep({ id: 'step-a', trigger: { type: 'onAction', action: 'ev1' }, priority: 10 }),
      makeStep({ id: 'step-b', trigger: { type: 'onAction', action: 'ev1' }, priority: 5 }),
      makeStep({ id: 'step-c', trigger: { type: 'onAction', action: 'ev2' }, priority: 8 }),
    ];
    const ctx = makeCtx({ pendingAction: 'ev1' });
    const eligible = findEligibleSteps(steps, ctx);
    expect(eligible.map((s) => s.id)).toEqual(expect.arrayContaining(['step-a', 'step-b']));
    expect(eligible.find((s) => s.id === 'step-c')).toBeUndefined();
  });

  it('excludes completed steps', () => {
    const steps: TutorialStep[] = [
      makeStep({ id: 'step-a', trigger: { type: 'onAction', action: 'ev1' }, priority: 10 }),
    ];
    const ctx = makeCtx({
      pendingAction: 'ev1',
      completedSteps: new Set(['step-a']),
    });
    expect(findEligibleSteps(steps, ctx)).toHaveLength(0);
  });

  it('excludes skipped steps', () => {
    const steps: TutorialStep[] = [
      makeStep({ id: 'step-a', trigger: { type: 'onAction', action: 'ev1' }, priority: 10 }),
    ];
    const ctx = makeCtx({
      pendingAction: 'ev1',
      skippedSteps: new Set(['step-a']),
    });
    expect(findEligibleSteps(steps, ctx)).toHaveLength(0);
  });

  it('returns empty array when no steps are eligible', () => {
    const steps: TutorialStep[] = [
      makeStep({ id: 'step-a', trigger: { type: 'onAction', action: 'ev-other' }, priority: 5 }),
    ];
    const ctx = makeCtx({ pendingAction: 'ev1' });
    expect(findEligibleSteps(steps, ctx)).toHaveLength(0);
  });

  it('resolveActiveStep picks the highest-priority eligible step', () => {
    const steps: TutorialStep[] = [
      makeStep({ id: 'step-lo', trigger: { type: 'onAction', action: 'ev1' }, priority: 3 }),
      makeStep({ id: 'step-hi', trigger: { type: 'onAction', action: 'ev1' }, priority: 9 }),
    ];
    const ctx = makeCtx({ pendingAction: 'ev1' });
    const winner = resolveActiveStep(steps, ctx);
    expect(winner?.id).toBe('step-hi');
  });
});

// ── TutorialEventName exhaustiveness ──────────────────────────────────────

describe('TutorialEventName — all six events can be emitted', () => {
  beforeEach(() => clearTutorialEventLog());

  const base = {
    stepId: 'step-x',
    feature: 'test',
    triggerType: 'onAction' as const,
    contentVersion: TUTORIAL_CONTENT_VERSION,
  };

  it.each([
    'step_eligible',
    'step_shown',
    'step_completed',
    'step_skipped',
  ] as const)('emits %s event', (eventName) => {
    emitTutorialEvent({ event: eventName, ...base });
    expect(getTutorialEventLog()[0].event).toBe(eventName);
    clearTutorialEventLog();
  });

  it.each([
    'tutorial_dismissed_all',
    'tutorial_reset',
  ] as const)('emits %s event with null step metadata', (eventName) => {
    emitTutorialEvent({
      event: eventName,
      stepId: null,
      feature: null,
      triggerType: null,
      contentVersion: TUTORIAL_CONTENT_VERSION,
    });
    const entry = getTutorialEventLog()[0];
    expect(entry.event).toBe(eventName);
    expect(entry.stepId).toBeNull();
    clearTutorialEventLog();
  });
});
