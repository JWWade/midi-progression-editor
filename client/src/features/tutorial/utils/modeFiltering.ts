/**
 * Tutorial Experience Mode Filtering
 *
 * Defines which tutorial steps are eligible to be shown in each experience
 * mode.  Extracted into a separate module so both the provider and tests can
 * import the same logic without duplication.
 *
 * | Mode      | Modal steps | Action-only tooltip | State/idle tooltip |
 * |-----------|-------------|---------------------|--------------------|
 * | guided    | ✓           | ✓                   | ✓                  |
 * | standard  | ✓           | ✓                   | ✗                  |
 * | minimal   | ✓           | ✗                   | ✗                  |
 */

import type { TutorialStep, TutorialTrigger, TutorialExperienceMode } from '../types';

// ── Trigger introspection helpers ─────────────────────────────────────────

/**
 * Returns `true` when the trigger (or any sub-trigger of a composite) is an
 * `onIdle` type.  Used to detect idle-driven steps that should be suppressed
 * in non-guided modes.
 */
export function containsIdleTrigger(trigger: TutorialTrigger): boolean {
  if (trigger.type === 'onIdle') return true;
  if (trigger.type === 'composite') {
    return trigger.conditions.some(containsIdleTrigger);
  }
  return false;
}

/**
 * Returns `true` when the trigger (or any sub-trigger of a composite) is an
 * `onAction` type.  Action-triggered steps are always allowed in standard mode
 * because they are initiated by user interaction, not automatic observation.
 */
export function containsActionTrigger(trigger: TutorialTrigger): boolean {
  if (trigger.type === 'onAction') return true;
  if (trigger.type === 'composite') {
    return trigger.conditions.some(containsActionTrigger);
  }
  return false;
}

// ── Mode guard ────────────────────────────────────────────────────────────

/**
 * Returns `true` when the given step is eligible to be shown in the provided
 * experience mode.
 *
 * - **guided** — all step types are allowed (current / highest-interruption).
 * - **standard** — modal steps are always shown; tooltip steps are only shown
 *   when they contain an `onAction` sub-trigger AND do NOT contain an `onIdle`
 *   sub-trigger.  This suppresses passive idle/state prompts while preserving
 *   contextual tips that fire on explicit user actions.
 * - **minimal** — only modal steps are shown (essential onboarding only).
 */
export function isStepAllowedInMode(
  step: TutorialStep,
  mode: TutorialExperienceMode,
): boolean {
  if (mode === 'guided') return true;
  if (step.uiType === 'modal') return true;        // modals always allowed
  if (mode === 'minimal') return false;            // no tooltips in minimal

  // standard: allow tooltips that are user-action-triggered and NOT idle-gated.
  // A composite trigger may contain BOTH onAction and onIdle sub-triggers (e.g.
  // "fire after chordAdded AND 5s idle").  Such steps are treated as
  // interrupting and suppressed in standard mode.
  return containsActionTrigger(step.trigger) && !containsIdleTrigger(step.trigger);
}
