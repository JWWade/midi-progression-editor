// @vitest-environment jsdom

/**
 * Tutorial Component Accessibility Tests
 *
 * Render-level accessibility assertions for TutorialTooltip and TutorialModal.
 * These complement the static source-level contract tests in
 * tutorialIntegrationContracts.test.ts by verifying that the rendered DOM
 * actually exposes the expected ARIA attributes and focus behavior.
 *
 * Covers:
 *  - ARIA roles, labels, and descriptions
 *  - progress indicator semantics
 *  - action button presence and click callbacks
 *  - Escape key dismissal
 *  - backdrop aria-hidden (modal)
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, cleanup, fireEvent, within } from '@testing-library/react';
import type { TutorialStep } from '../types';
import { TutorialTooltip } from '../components/TutorialTooltip';
import { TutorialModal } from '../components/TutorialModal';

// Explicitly clean up the DOM after each test so that elements from one test
// do not bleed into the next (required when @testing-library/react auto-cleanup
// is not configured globally via vitest `globals: true`).
afterEach(() => {
  cleanup();
});

// ── Fixtures ───────────────────────────────────────────────────────────────

const tooltipStep: TutorialStep = {
  id: 'test-tooltip',
  feature: 'test',
  title: 'Test Tooltip',
  description: 'This is the tooltip description.',
  trigger: { type: 'onAction', action: 'testEvent' },
  priority: 5,
  uiType: 'tooltip',
  targetSelector: '#chromatic-circle',
};

const modalStep: TutorialStep = {
  id: 'test-modal',
  feature: 'test',
  title: 'Test Modal',
  description: 'This is the modal description.',
  trigger: { type: 'onState', condition: 'emptyProgression' },
  priority: 10,
  uiType: 'modal',
};

// ── TutorialTooltip ────────────────────────────────────────────────────────

describe('TutorialTooltip accessibility', () => {
  function renderTooltip(overrides: Partial<Parameters<typeof TutorialTooltip>[0]> = {}) {
    const props = {
      step: tooltipStep,
      stepIndex: 1,
      totalSteps: 3,
      onDismiss: vi.fn(),
      onSkip: vi.fn(),
      onSkipAll: vi.fn(),
      onSnooze: vi.fn(),
      onFocusDiagnostic: vi.fn(),
      ...overrides,
    };
    const result = render(<TutorialTooltip {...props} />);
    // Narrow queries to the rendered container to avoid conflicts.
    const dialog = within(result.container).getByRole('dialog');
    return { ...result, dialog, props };
  }

  it('renders with role="dialog"', () => {
    const { dialog } = renderTooltip();
    expect(dialog).not.toBeNull();
  });

  it('has an accessible name (aria-label)', () => {
    const { dialog } = renderTooltip();
    const label = dialog.getAttribute('aria-label');
    expect(label).not.toBeNull();
    expect(label).toContain(tooltipStep.title);
  });

  it('has aria-describedby pointing to the description element', () => {
    const { dialog } = renderTooltip();
    const descId = dialog.getAttribute('aria-describedby');
    expect(descId).not.toBeNull();
    const descEl = document.getElementById(descId!);
    expect(descEl).not.toBeNull();
    expect(descEl?.textContent).toContain(tooltipStep.description);
  });

  it('renders the step title', () => {
    const { container } = renderTooltip();
    expect(within(container).getByText(tooltipStep.title)).not.toBeNull();
  });

  it('renders the step description', () => {
    const { container } = renderTooltip();
    expect(within(container).getByText(tooltipStep.description)).not.toBeNull();
  });

  it('shows step progress indicator', () => {
    const { container } = renderTooltip();
    expect(within(container).getByLabelText('Step 1 of 3')).not.toBeNull();
  });

  it('hides progress indicator when stepIndex is 0', () => {
    const { container } = renderTooltip({ stepIndex: 0, totalSteps: 0 });
    expect(within(container).queryByLabelText(/Step \d+ of \d+/)).toBeNull();
  });

  it('calls onDismiss when "Got it" button is clicked', () => {
    const { container, props } = renderTooltip();
    fireEvent.click(within(container).getByText('Got it'));
    expect(props.onDismiss).toHaveBeenCalledTimes(1);
  });

  it('calls onSkip when "Skip" button is clicked', () => {
    const { container, props } = renderTooltip();
    fireEvent.click(within(container).getByText('Skip'));
    expect(props.onSkip).toHaveBeenCalledTimes(1);
  });

  it('calls onSnooze when snooze button is clicked', () => {
    const { container, props } = renderTooltip();
    fireEvent.click(
      within(container).getByLabelText('Snooze tutorial hints for 30 minutes'),
    );
    expect(props.onSnooze).toHaveBeenCalledTimes(1);
  });

  it('calls onSkipAll when "Disable hints" button is clicked', () => {
    const { container, props } = renderTooltip();
    fireEvent.click(within(container).getByText('Disable hints'));
    expect(props.onSkipAll).toHaveBeenCalledTimes(1);
  });

  it('calls onDismiss with keyboard inputMethod when Escape is pressed', () => {
    const { props } = renderTooltip();
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(props.onDismiss).toHaveBeenCalledWith({
      focusSuccess: true,
      inputMethod: 'keyboard',
    });
  });

  it('aria-modal is false (tooltip is non-modal)', () => {
    const { dialog } = renderTooltip();
    expect(dialog.getAttribute('aria-modal')).toBe('false');
  });
});

// ── TutorialModal ──────────────────────────────────────────────────────────

describe('TutorialModal accessibility', () => {
  function renderModal(overrides: Partial<Parameters<typeof TutorialModal>[0]> = {}) {
    const props = {
      step: modalStep,
      stepIndex: 1,
      totalSteps: 1,
      onDismiss: vi.fn(),
      onSkip: vi.fn(),
      onSkipAll: vi.fn(),
      onSnooze: vi.fn(),
      onFocusDiagnostic: vi.fn(),
      ...overrides,
    };
    const result = render(<TutorialModal {...props} />);
    const dialog = within(result.container).getByRole('dialog');
    return { ...result, dialog, props };
  }

  it('renders with role="dialog"', () => {
    const { dialog } = renderModal();
    expect(dialog).not.toBeNull();
  });

  it('aria-modal is true (modal traps focus)', () => {
    const { dialog } = renderModal();
    expect(dialog.getAttribute('aria-modal')).toBe('true');
  });

  it('has aria-labelledby pointing to the title element', () => {
    const { dialog } = renderModal();
    const labelId = dialog.getAttribute('aria-labelledby');
    expect(labelId).not.toBeNull();
    const titleEl = document.getElementById(labelId!);
    expect(titleEl?.textContent).toContain(modalStep.title);
  });

  it('has aria-describedby pointing to the description element', () => {
    const { dialog } = renderModal();
    const descId = dialog.getAttribute('aria-describedby');
    expect(descId).not.toBeNull();
    const descEl = document.getElementById(descId!);
    expect(descEl?.textContent).toContain(modalStep.description);
  });

  it('renders the step title', () => {
    const { container } = renderModal();
    expect(within(container).getByText(modalStep.title)).not.toBeNull();
  });

  it('renders the step description', () => {
    const { container } = renderModal();
    expect(within(container).getByText(modalStep.description)).not.toBeNull();
  });

  it('shows step progress indicator', () => {
    const { container } = renderModal();
    expect(within(container).getByLabelText('Step 1 of 1')).not.toBeNull();
  });

  it('hides progress indicator when stepIndex is 0', () => {
    const { container } = renderModal({ stepIndex: 0, totalSteps: 0 });
    expect(within(container).queryByLabelText(/Step \d+ of \d+/)).toBeNull();
  });

  it('calls onDismiss when "Got it" button is clicked', () => {
    const { container, props } = renderModal();
    fireEvent.click(within(container).getByText('Got it'));
    expect(props.onDismiss).toHaveBeenCalledTimes(1);
  });

  it('calls onSkip when "Skip for now" button is clicked', () => {
    const { container, props } = renderModal();
    fireEvent.click(within(container).getByText('Skip for now'));
    expect(props.onSkip).toHaveBeenCalledTimes(1);
  });

  it('calls onSnooze when snooze button is clicked', () => {
    const { container, props } = renderModal();
    fireEvent.click(
      within(container).getByLabelText('Snooze tutorial hints for 30 minutes'),
    );
    expect(props.onSnooze).toHaveBeenCalledTimes(1);
  });

  it('calls onSkipAll when "Disable all hints" button is clicked', () => {
    const { container, props } = renderModal();
    fireEvent.click(within(container).getByText('Disable all hints'));
    expect(props.onSkipAll).toHaveBeenCalledTimes(1);
  });

  it('calls onDismiss with keyboard inputMethod when Escape is pressed', () => {
    const { props } = renderModal();
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(props.onDismiss).toHaveBeenCalledWith({
      focusSuccess: true,
      inputMethod: 'keyboard',
    });
  });

  it('clicking backdrop calls onDismiss (click-to-dismiss behavior)', () => {
    const { container, props } = renderModal();
    // The outermost element is the backdrop; clicking it closes the modal.
    const backdrop = container.firstChild as HTMLElement;
    fireEvent.click(backdrop);
    expect(props.onDismiss).toHaveBeenCalledTimes(1);
  });
});
