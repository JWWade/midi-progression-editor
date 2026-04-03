// @vitest-environment jsdom

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, fireEvent, screen, cleanup } from '@testing-library/react';
import { TutorialProvider } from '../context/TutorialProvider';
import { useTutorial } from '../hooks/useTutorial';
import { TUTORIAL_CONTENT_VERSION } from '../data/tutorials';

function Harness() {
  const { activeStep, fireEvent: triggerEvent } = useTutorial();

  return (
    <div>
      <button type="button" onClick={() => triggerEvent('chordAdded')}>
        trigger
      </button>
      <div data-testid="active-step-id">{activeStep?.id ?? 'none'}</div>
    </div>
  );
}

describe('TutorialProvider', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
    // Remove the onboarding modal so action-triggered tooltip behavior can be
    // tested in isolation.
    localStorage.setItem(
      'tutorial_state_v1',
      JSON.stringify({
        completedSteps: ['add-first-chord'],
        skippedSteps: [],
        tutorialVersion: TUTORIAL_CONTENT_VERSION,
        dismissed: false,
        experienceMode: 'guided',
      }),
    );
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('keeps an action-triggered step visible after pending action is cleared', () => {
    render(
      <TutorialProvider>
        <Harness />
      </TutorialProvider>,
    );

    expect(screen.getByTestId('active-step-id').textContent).toBe('none');

    fireEvent.click(screen.getByText('trigger'));
    expect(screen.getByTestId('active-step-id').textContent).toBe('play-progression');

    // Consume the internal 0ms CLEAR_ACTION timeout.
    vi.advanceTimersByTime(0);

    // Regression guard: step should remain visible until user dismisses/skips.
    expect(screen.getByTestId('active-step-id').textContent).toBe('play-progression');
  });
});
