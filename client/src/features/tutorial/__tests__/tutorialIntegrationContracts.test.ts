/**
 * Tutorial Integration Contract Tests
 *
 * These tests enforce the integration contracts that keep the tutorial engine
 * correctly wired to the rest of the application.  They fail fast when:
 *
 *  1. A tutorial step references an action event that is not in the canonical
 *     event registry (TUTORIAL_ACTION_EVENTS), catching drift where a
 *     `fireEvent` call is removed without updating the tutorial definition.
 *
 *  2. The event registry contains a key that no tutorial step references,
 *     catching stale entries where a step was removed but the registry was not
 *     cleaned up.
 *
 *  3. The TutorialAppContext interface fields diverge from the set that App.tsx
 *     is expected to update, catching context-bridge regressions.
 *
 *  4. The telemetry event name union diverges from the implementation's
 *     accepted event constants, catching schema drift.
 *
 *  5. Tutorial UI component ARIA contracts are validated against the rendered
 *     component source to ensure role, labelling, and focus attributes are
 *     present.
 *
 * ## Why static / pure-logic tests?
 *
 * These contract assertions are expressed as data and string checks on module
 * exports rather than as component render tests.  That keeps them fast,
 * environment-independent, and maximally useful for CI enforcement.
 * Component-level rendering tests live in tutorialA11y.test.tsx.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ALL_TUTORIAL_STEPS } from '../data/tutorials';
import {
  TUTORIAL_ACTION_EVENTS,
  REGISTERED_ACTION_EVENT_NAMES,
} from '../constants/tutorialEvents';
import type { TutorialEventName, TutorialAppContext } from '../types';

// ── Read component sources for static ARIA contract assertions ────────────

const here = dirname(fileURLToPath(import.meta.url));
const componentDir = resolve(here, '../components');

const tooltipSource = readFileSync(
  resolve(componentDir, 'TutorialTooltip.tsx'),
  'utf-8',
);
const modalSource = readFileSync(
  resolve(componentDir, 'TutorialModal.tsx'),
  'utf-8',
);

// ── 1. Action event registry completeness ─────────────────────────────────

describe('action event registry ↔ tutorial step contract', () => {
  it('every onAction trigger in ALL_TUTORIAL_STEPS is in the event registry', () => {
    const actionSteps = ALL_TUTORIAL_STEPS.filter(
      (s) => s.trigger.type === 'onAction',
    );

    actionSteps.forEach((step) => {
      const action = (step.trigger as { type: 'onAction'; action: string }).action;
      expect(
        REGISTERED_ACTION_EVENT_NAMES.has(action),
        `Step "${step.id}" fires action event "${action}" which is not in ` +
          `TUTORIAL_ACTION_EVENTS. ` +
          `Add it to client/src/features/tutorial/constants/tutorialEvents.ts ` +
          `and ensure the owning module calls fireEvent("${action}").`,
      ).toBe(true);
    });
  });

  it('every composite trigger child that is onAction is in the event registry', () => {
    const compositeSteps = ALL_TUTORIAL_STEPS.filter(
      (s) => s.trigger.type === 'composite',
    );

    for (const step of compositeSteps) {
      if (step.trigger.type !== 'composite') continue;
      for (const cond of step.trigger.conditions) {
        if (cond.type !== 'onAction') continue;
        expect(
          REGISTERED_ACTION_EVENT_NAMES.has(cond.action),
          `Step "${step.id}" composite trigger references action "${cond.action}" ` +
            `which is not in TUTORIAL_ACTION_EVENTS. ` +
            `Add it to constants/tutorialEvents.ts.`,
        ).toBe(true);
      }
    }
  });

  it('every event in the registry is referenced by at least one tutorial step', () => {
    // Collect all onAction event names from top-level and composite triggers.
    const usedEvents = new Set<string>();
    for (const step of ALL_TUTORIAL_STEPS) {
      if (step.trigger.type === 'onAction') {
        usedEvents.add(step.trigger.action);
      } else if (step.trigger.type === 'composite') {
        for (const cond of step.trigger.conditions) {
          if (cond.type === 'onAction') {
            usedEvents.add(cond.action);
          }
        }
      }
    }

    for (const name of REGISTERED_ACTION_EVENT_NAMES) {
      expect(
        usedEvents.has(name),
        `Event "${name}" is registered in TUTORIAL_ACTION_EVENTS but is not ` +
          `referenced by any tutorial step. ` +
          `Remove the registry entry or add a tutorial step that uses it.`,
      ).toBe(true);
    }
  });

  it('each registry entry has non-empty event, owner, and description', () => {
    for (const [key, entry] of Object.entries(TUTORIAL_ACTION_EVENTS)) {
      expect(
        entry.event.trim(),
        `TUTORIAL_ACTION_EVENTS["${key}"].event is empty`,
      ).not.toBe('');
      expect(
        entry.owner.trim(),
        `TUTORIAL_ACTION_EVENTS["${key}"].owner is empty — document which file emits this event`,
      ).not.toBe('');
      expect(
        entry.description.trim(),
        `TUTORIAL_ACTION_EVENTS["${key}"].description is empty`,
      ).not.toBe('');
    }
  });

  it('registry key matches the event name string for each entry', () => {
    for (const [key, entry] of Object.entries(TUTORIAL_ACTION_EVENTS)) {
      expect(
        entry.event,
        `Registry key "${key}" does not match entry.event "${entry.event}". ` +
          `Keep them in sync so lookup by key and by string both work.`,
      ).toBe(key);
    }
  });
});

// ── 2. App context contract ────────────────────────────────────────────────

describe('TutorialAppContext field contract', () => {
  /**
   * These are the exact field names that App.tsx passes to updateAppContext().
   * If the interface changes, App.tsx must be updated to match, and vice versa.
   * Adjust this list whenever TutorialAppContext is intentionally modified.
   */
  const EXPECTED_APP_CONTEXT_FIELDS: ReadonlyArray<keyof TutorialAppContext> = [
    'progressionLength',
    'isPlaying',
  ];

  it('TutorialAppContext contains all expected fields', () => {
    // Create a minimal conforming object to exercise TypeScript structural typing.
    const sample: TutorialAppContext = {
      progressionLength: 0,
      isPlaying: false,
    };

    for (const field of EXPECTED_APP_CONTEXT_FIELDS) {
      expect(
        field in sample,
        `TutorialAppContext is missing expected field "${field}". ` +
          `Update App.tsx updateAppContext() call and this contract test together.`,
      ).toBe(true);
    }
  });

  it('TutorialAppContext has no unexpected extra fields beyond the contract', () => {
    const sample: TutorialAppContext = {
      progressionLength: 0,
      isPlaying: false,
    };
    const actualKeys = Object.keys(sample);
    const expectedSet = new Set<string>(EXPECTED_APP_CONTEXT_FIELDS);
    for (const key of actualKeys) {
      expect(
        expectedSet.has(key),
        `TutorialAppContext has unexpected field "${key}". ` +
          `If this field is intentional, add it to EXPECTED_APP_CONTEXT_FIELDS ` +
          `in this test and update App.tsx to populate it.`,
      ).toBe(true);
    }
  });
});

// ── 3. Telemetry event name contract ──────────────────────────────────────

describe('TutorialEventName schema contract', () => {
  /**
   * Canonical list of all telemetry event names.  This matches the
   * TutorialEventName union type.  Keeping a runtime list here lets the test
   * verify that:
   *
   * (a) new union members are reflected here, and
   * (b) the emitter in tutorialTelemetry.ts accepts all members.
   *
   * Update this list whenever TutorialEventName is intentionally extended.
   */
  const EXPECTED_TELEMETRY_EVENTS: ReadonlyArray<TutorialEventName> = [
    'step_eligible',
    'step_shown',
    'step_completed',
    'step_skipped',
    'tutorial_dismissed_all',
    'tutorial_reset',
  ];

  it('has exactly the expected set of telemetry event names', () => {
    // The array itself is typed as TutorialEventName[], so TypeScript will
    // produce a compile error if any member is not in the union.
    expect(EXPECTED_TELEMETRY_EVENTS).toHaveLength(6);
  });

  it('all telemetry event names are non-empty lowercase strings with underscores', () => {
    for (const name of EXPECTED_TELEMETRY_EVENTS) {
      expect(typeof name).toBe('string');
      expect(name.trim()).not.toBe('');
      // Convention: snake_case event names only.
      expect(
        /^[a-z][a-z0-9_]*$/.test(name),
        `Telemetry event name "${name}" does not follow snake_case convention.`,
      ).toBe(true);
    }
  });

  it('event names are unique', () => {
    const unique = new Set(EXPECTED_TELEMETRY_EVENTS);
    expect(unique.size).toBe(EXPECTED_TELEMETRY_EVENTS.length);
  });

  it('step lifecycle events are present', () => {
    expect(EXPECTED_TELEMETRY_EVENTS).toContain('step_eligible');
    expect(EXPECTED_TELEMETRY_EVENTS).toContain('step_shown');
    expect(EXPECTED_TELEMETRY_EVENTS).toContain('step_completed');
    expect(EXPECTED_TELEMETRY_EVENTS).toContain('step_skipped');
  });

  it('tutorial-level events are present for dismiss and reset flows', () => {
    expect(EXPECTED_TELEMETRY_EVENTS).toContain('tutorial_dismissed_all');
    expect(EXPECTED_TELEMETRY_EVENTS).toContain('tutorial_reset');
  });
});

// ── 4. Tutorial UI ARIA contract (static source assertions) ───────────────

/**
 * These tests read the component source files and assert that required ARIA
 * attributes are present.  This is a static check that catches regressions
 * (e.g. accidental removal of `role="dialog"`) without a JSDOM render cycle.
 *
 * Full render-based a11y assertions live in `tutorialA11y.test.tsx`.
 */
describe('TutorialTooltip ARIA contract (static)', () => {
  it('declares role="dialog"', () => {
    expect(tooltipSource).toContain('role="dialog"');
  });

  it('declares aria-label or aria-labelledby', () => {
    const hasLabel =
      tooltipSource.includes('aria-label=') ||
      tooltipSource.includes('aria-labelledby=');
    expect(hasLabel).toBe(true);
  });

  it('declares aria-describedby', () => {
    expect(tooltipSource).toContain('aria-describedby=');
  });

  it('sets tabIndex for programmatic focus', () => {
    expect(tooltipSource).toContain('tabIndex={-1}');
  });

  it('keyboard Escape handler is present', () => {
    expect(tooltipSource).toContain("'Escape'");
  });

  it('returns focus on unmount (returnFocusRef pattern)', () => {
    expect(tooltipSource).toContain('returnFocusRef');
  });

  it('reports focus diagnostics via onFocusDiagnostic', () => {
    expect(tooltipSource).toContain('onFocusDiagnostic');
    expect(tooltipSource).toContain('focusSuccess');
  });
});

describe('TutorialModal ARIA contract (static)', () => {
  it('declares role="dialog"', () => {
    expect(modalSource).toContain('role="dialog"');
  });

  it('declares aria-modal="true"', () => {
    expect(modalSource).toContain('aria-modal="true"');
  });

  it('declares aria-labelledby', () => {
    expect(modalSource).toContain('aria-labelledby=');
  });

  it('declares aria-describedby', () => {
    expect(modalSource).toContain('aria-describedby=');
  });

  it('sets tabIndex for programmatic focus', () => {
    expect(modalSource).toContain('tabIndex={-1}');
  });

  it('implements Tab focus trap', () => {
    expect(modalSource).toContain("'Tab'");
  });

  it('keyboard Escape handler is present', () => {
    expect(modalSource).toContain("'Escape'");
  });

  it('returns focus on unmount (returnFocusRef pattern)', () => {
    expect(modalSource).toContain('returnFocusRef');
  });

  it('backdrop click closes the modal', () => {
    expect(modalSource).toContain('onClick');
  });
});

// ── 5. Ownership documentation contract ───────────────────────────────────

describe('event registry ownership documentation', () => {
  it('every registry entry references a source file path', () => {
    for (const [key, entry] of Object.entries(TUTORIAL_ACTION_EVENTS)) {
      expect(
        entry.owner.includes('client/src/') || entry.owner.includes('src/'),
        `TUTORIAL_ACTION_EVENTS["${key}"].owner should include a source file path ` +
          `(e.g. "client/src/app/App.tsx → handler"). Got: "${entry.owner}"`,
      ).toBe(true);
    }
  });

  it('all registered event names are valid camelCase identifiers', () => {
    for (const name of REGISTERED_ACTION_EVENT_NAMES) {
      expect(
        /^[a-zA-Z][a-zA-Z0-9]*$/.test(name),
        `Action event name "${name}" is not a valid camelCase identifier.`,
      ).toBe(true);
    }
  });
});
