import type { IntentCapture, IntentContext } from '../types';
import type { IntentStore } from './IntentStore';

export interface CaptureParams {
  /** Free-form user input (may be empty string for hotkey-triggered captures). */
  rawInput: string;
  /** Pre-built context snapshot. */
  context: IntentContext;
}

/**
 * Synchronously captures a user intent and persists it to the provided store.
 * Returns the generated intent ID for use as a progression placeholder reference.
 *
 * This function is intentionally non-blocking and performs zero validation —
 * the goal is to capture intent within ≤100 ms regardless of system state.
 */
export function captureIntent(params: CaptureParams, store: IntentStore): string {
  const id = crypto.randomUUID();
  const intent: IntentCapture = {
    id,
    timestamp: Date.now(),
    context: params.context,
    rawInput: params.rawInput,
    resolved: false,
  };
  store.append(intent);
  return id;
}
