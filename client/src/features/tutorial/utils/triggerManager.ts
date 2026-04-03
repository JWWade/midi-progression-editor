/**
 * Tutorial Trigger Manager
 *
 * Evaluates which tutorial step, if any, should be shown given:
 *  - the current set of completed and skipped step IDs
 *  - the most recently fired action event (or `null`)
 *  - the current app context (used for state-based conditions)
 *  - whether the user is currently idle and for how long
 *
 * The manager returns the single highest-priority eligible step, or `null`
 * if none are eligible.  Steps are resolved via a simple priority queue:
 * the step with the greatest `priority` value wins.
 */

import type { TutorialStep, TutorialTrigger, TutorialAppContext } from '../types';
import { evaluateCondition } from '../data/tutorials';

export interface TriggerContext {
  /** Steps that have been completed by the user. */
  completedSteps: ReadonlySet<string>;
  /** Steps that the user has explicitly skipped. */
  skippedSteps: ReadonlySet<string>;
  /** The most recently fired action event name, or `null`. */
  pendingAction: string | null;
  /** Current app state for evaluating state-based conditions. */
  appContext: TutorialAppContext;
  /** `true` when the idle timer has exceeded the threshold. */
  isIdle: boolean;
  /** How many seconds the user has been idle (used for idle triggers). */
  idleSeconds: number;
}

/**
 * Evaluate a single trigger against the provided context.
 *
 * @returns `true` if the trigger condition is satisfied.
 */
export function evaluateTrigger(
  trigger: TutorialTrigger,
  ctx: TriggerContext,
): boolean {
  switch (trigger.type) {
    case 'onAction':
      return trigger.action === ctx.pendingAction;

    case 'onState':
      return evaluateCondition(trigger.condition, ctx.appContext);

    case 'onIdle':
      return ctx.isIdle && ctx.idleSeconds >= trigger.idleSeconds;

    case 'composite': {
      const results = trigger.conditions.map((t) => evaluateTrigger(t, ctx));
      return trigger.mode === 'all'
        ? results.every(Boolean)
        : results.some(Boolean);
    }
  }
}

/**
 * Return all steps that are currently eligible: not completed, not skipped,
 * and with a trigger condition that evaluates to `true`.
 *
 * This is the lower-level primitive used by both {@link resolveActiveStep}
 * (which picks the single winner) and the telemetry layer (which needs the
 * full eligible set to emit `step_eligible` events for funnel analysis).
 */
export function findEligibleSteps(
  steps: readonly TutorialStep[],
  ctx: TriggerContext,
): TutorialStep[] {
  return steps.filter((step) => {
    if (ctx.completedSteps.has(step.id)) return false;
    if (ctx.skippedSteps.has(step.id)) return false;
    return evaluateTrigger(step.trigger, ctx);
  });
}

/**
 * Given a list of tutorial steps, return the single highest-priority step
 * that is:
 *  1. Not already completed or skipped.
 *  2. Has a trigger condition that evaluates to `true`.
 *
 * @returns The winning step, or `null` if nothing should be shown.
 */
export function resolveActiveStep(
  steps: readonly TutorialStep[],
  ctx: TriggerContext,
): TutorialStep | null {
  const eligible = findEligibleSteps(steps, ctx);

  if (eligible.length === 0) return null;

  // Sort a copy of `eligible` descending by priority so the original array
  // (which is already a `filter()` copy) is also not mutated further.
  // Stable sort preserves definition order on priority ties.
  eligible.sort((a, b) => b.priority - a.priority);
  return eligible[0];
}
