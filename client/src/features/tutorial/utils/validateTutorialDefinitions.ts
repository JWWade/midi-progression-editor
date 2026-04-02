/**
 * Tutorial Definition Validator
 *
 * Provides a lint-like validation pass over tutorial step definitions.
 * Call this at module load time in development to catch authoring mistakes
 * before they cause confusing runtime behaviour.
 *
 * ## Validation Rules
 *
 * ### Errors (block merge / fail fast in dev)
 * - DUPLICATE_ID            — two or more steps share the same `id`.
 * - PRIORITY_OUT_OF_RANGE   — `priority` is outside the documented 1–100 range.
 * - TOOLTIP_MISSING_SELECTOR — a `tooltip` step omits `targetSelector`.
 *                              WCAG 1.3.1 (Info & Relationships): the selector
 *                              establishes the spatial/descriptive relationship
 *                              between the coach-mark and the UI element it
 *                              explains.  Without it the tooltip falls back to a
 *                              generic banner with no clear anchor.
 *
 * ### Warnings (surfaced in dev, enforced in tests)
 * - MODAL_UNEXPECTED_SELECTOR — a `modal` step sets `targetSelector`.
 *                               The field is ignored by TutorialModal; its
 *                               presence is likely an authoring mistake.
 * - AUTO_TRIGGER_UNGUARDED   — a step's top-level trigger is `onIdle` or
 *                               `onState` without being wrapped in a composite.
 *                               These fire automatically and may appear at
 *                               unexpected moments.  Prefer composite triggers
 *                               that combine the condition with a state guard.
 *                               If intentional, suppress by moving the trigger
 *                               into a composite with mode "any".
 * - CONTRADICTORY_COMPOSITE  — a composite `all` trigger contains mutually
 *                               exclusive state conditions (e.g.
 *                               `emptyProgression` AND `fullProgression`).
 *                               The step can never become eligible.
 *
 * ## Accessibility References
 * - WCAG 2.1 § 1.3.1  Info and Relationships: targetSelector (tooltip anchor)
 * - WCAG 2.1 § 2.1.2  No Keyboard Trap: modal focus trap (enforced by TutorialModal)
 * - Trusted Tester 5 Test 4.A: focus management for dialog / modal patterns
 */

import type { TutorialStep, TutorialTrigger, TutorialCondition } from '../types';

// ── Result types ──────────────────────────────────────────────────────────────

export interface ValidationError {
  /** Machine-readable error code. */
  code:
    | 'DUPLICATE_ID'
    | 'PRIORITY_OUT_OF_RANGE'
    | 'TOOLTIP_MISSING_SELECTOR';
  /** The step `id` this error relates to, if applicable. */
  stepId?: string;
  /** Human-readable description including remediation guidance. */
  message: string;
}

export interface ValidationWarning {
  /** Machine-readable warning code. */
  code:
    | 'MODAL_UNEXPECTED_SELECTOR'
    | 'AUTO_TRIGGER_UNGUARDED'
    | 'CONTRADICTORY_COMPOSITE';
  /** The step `id` this warning relates to, if applicable. */
  stepId?: string;
  /** Human-readable description including remediation guidance. */
  message: string;
}

export interface ValidationResult {
  errors: ValidationError[];
  warnings: ValidationWarning[];
  /** `true` only when there are zero errors (warnings do not affect this). */
  isValid: boolean;
}

// ── Contradictory-condition pairs ─────────────────────────────────────────────

/**
 * Pairs of `TutorialCondition` values that cannot both be true at the same
 * time and therefore make a composite `all` trigger permanently unreachable.
 */
const CONTRADICTORY_CONDITION_PAIRS: ReadonlyArray<
  [TutorialCondition, TutorialCondition]
> = [
  ['emptyProgression', 'shortProgression'],
  ['emptyProgression', 'fullProgression'],
  ['shortProgression', 'fullProgression'],
];

// ── Internal helpers ──────────────────────────────────────────────────────────

/**
 * Collect all `onState` condition strings that appear as direct (non-nested)
 * children of a composite trigger.  Only the immediate conditions array is
 * inspected — nested composites are ignored for simplicity.
 */
function collectDirectStateConditions(trigger: TutorialTrigger): TutorialCondition[] {
  if (trigger.type !== 'composite') return [];
  return trigger.conditions
    .filter((t): t is Extract<TutorialTrigger, { type: 'onState' }> => t.type === 'onState')
    .map((t) => t.condition);
}

/**
 * Returns `true` when the provided composite trigger (mode `"all"`) contains
 * two mutually exclusive state conditions.
 */
function hasContradictoryConditions(trigger: TutorialTrigger): boolean {
  if (trigger.type !== 'composite' || trigger.mode !== 'all') return false;
  const conditions = collectDirectStateConditions(trigger);
  return CONTRADICTORY_CONDITION_PAIRS.some(
    ([a, b]) => conditions.includes(a) && conditions.includes(b),
  );
}

/**
 * Returns `true` when a trigger fires automatically without user interaction
 * and is not composed with other conditions.  Top-level `onIdle` and `onState`
 * triggers qualify; `onAction` and `composite` triggers do not.
 */
function isUnguardedAutoTrigger(trigger: TutorialTrigger): boolean {
  return trigger.type === 'onIdle' || trigger.type === 'onState';
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Validate an array of tutorial steps and return a structured result.
 *
 * This function is pure and does not throw.  Call `assertValidTutorialDefinitions`
 * when you want an immediate throw on the first error (suitable for module
 * initialisation in development).
 *
 * @param steps - The flat list of `TutorialStep` objects to validate.
 */
export function validateTutorialDefinitions(
  steps: readonly TutorialStep[],
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // ── Duplicate ID detection ───────────────────────────────────────────────
  const seen = new Map<string, number>(); // id → first occurrence index
  steps.forEach((step, idx) => {
    const prev = seen.get(step.id);
    if (prev !== undefined) {
      errors.push({
        code: 'DUPLICATE_ID',
        stepId: step.id,
        message:
          `Duplicate step ID "${step.id}" at index ${idx} ` +
          `(first seen at index ${prev}). ` +
          `Each step ID must be unique across all tutorial definitions.`,
      });
    } else {
      seen.set(step.id, idx);
    }
  });

  // ── Per-step rules ────────────────────────────────────────────────────────
  for (const step of steps) {
    // Priority range
    // The TypeScript type uses `number`, not `integer`, so a value like 5.5
    // would pass the range test but is not a valid integer priority.
    if (!Number.isInteger(step.priority) || step.priority < 1 || step.priority > 100) {
      errors.push({
        code: 'PRIORITY_OUT_OF_RANGE',
        stepId: step.id,
        message:
          `Step "${step.id}" has priority ${step.priority}. ` +
          `Priority must be an integer in the range 1–100 (higher = shown first).`,
      });
    }

    // Tooltip steps must declare a target selector (WCAG 1.3.1)
    if (step.uiType === 'tooltip') {
      if (!step.targetSelector || step.targetSelector.trim() === '') {
        errors.push({
          code: 'TOOLTIP_MISSING_SELECTOR',
          stepId: step.id,
          message:
            `Tooltip step "${step.id}" is missing a targetSelector. ` +
            `WCAG 1.3.1 (Info & Relationships): the CSS selector establishes ` +
            `a spatial and descriptive relationship between the coach-mark and ` +
            `the UI element it explains. ` +
            `Add a targetSelector (e.g. "#my-element") or change uiType to "modal".`,
        });
      }
    }

    // Modal steps should not declare a targetSelector (it is silently ignored)
    if (step.uiType === 'modal' && step.targetSelector !== undefined) {
      warnings.push({
        code: 'MODAL_UNEXPECTED_SELECTOR',
        stepId: step.id,
        message:
          `Modal step "${step.id}" defines targetSelector "${step.targetSelector}", ` +
          `but TutorialModal ignores this field. ` +
          `Remove targetSelector or change uiType to "tooltip".`,
      });
    }

    // Auto-trigger without guard
    if (isUnguardedAutoTrigger(step.trigger)) {
      warnings.push({
        code: 'AUTO_TRIGGER_UNGUARDED',
        stepId: step.id,
        message:
          `Step "${step.id}" uses a top-level ${step.trigger.type} trigger ` +
          `with no composite guard. ` +
          `Auto-triggered steps may appear at unexpected moments. ` +
          `Consider wrapping in a composite trigger that also checks an onState ` +
          `condition to restrict when the step fires.`,
      });
    }

    // Contradictory composite conditions
    if (hasContradictoryConditions(step.trigger)) {
      warnings.push({
        code: 'CONTRADICTORY_COMPOSITE',
        stepId: step.id,
        message:
          `Step "${step.id}" has a composite "all" trigger containing mutually ` +
          `exclusive state conditions. ` +
          `The step can never become eligible. ` +
          `Review the conditions or change mode to "any".`,
      });
    }
  }

  return { errors, warnings, isValid: errors.length === 0 };
}

/**
 * Validate tutorial steps and throw a descriptive `Error` if any errors are
 * found.  Warnings are logged to `console.warn` but do not cause a throw.
 *
 * Intended for development-time fail-fast initialisation:
 * ```ts
 * if (import.meta.env.DEV) {
 *   assertValidTutorialDefinitions(ALL_TUTORIAL_STEPS);
 * }
 * ```
 *
 * @throws {Error} when one or more validation errors are present.
 */
export function assertValidTutorialDefinitions(steps: readonly TutorialStep[]): void {
  const result = validateTutorialDefinitions(steps);

  if (result.warnings.length > 0) {
    console.warn(
      '[Tutorial] Authoring warnings detected:\n' +
        result.warnings.map((w) => `  [${w.code}] ${w.message}`).join('\n'),
    );
  }

  if (!result.isValid) {
    const messages = result.errors
      .map((e) => `  [${e.code}] ${e.message}`)
      .join('\n');
    throw new Error(
      `[Tutorial] Invalid tutorial definitions — fix the following errors before proceeding:\n${messages}`,
    );
  }
}
