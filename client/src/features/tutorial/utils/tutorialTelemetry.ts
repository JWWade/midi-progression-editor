/**
 * Tutorial Telemetry
 *
 * Emits structured events for tutorial funnel analysis and debugging.
 *
 * ## Privacy Guardrails
 * - Only structural identifiers (stepId, feature) are recorded — never
 *   user-entered text, UI copy, CSS selectors, or PII.
 * - Timing is expressed as a session-relative offset so no wall-clock time
 *   or timezone information is leaked.
 * - The payload shape is strictly typed via `TutorialEventPayload`.
 * - All payloads are bounded to that interface; no extra keys are appended.
 *
 * ## Dev Diagnostics
 * All events are logged to the console at `debug` level (dev-only) via the
 * shared logger, and are appended to a bounded in-memory ring buffer that
 * can be retrieved with {@link getTutorialEventLog}.
 *
 * In production no external transport is attached — this module is a
 * pure internal diagnostics sink ready for future analytics integration.
 */

import type { TutorialEventPayload } from '../types';
import { createLogger } from '@/shared/utils/logger';

const log = createLogger('tutorial:telemetry');

/** Session start time used to compute privacy-safe relative offsets. */
const SESSION_START_MS = Date.now();

/** Maximum number of events retained in the in-memory diagnostic ring buffer. */
const MAX_LOG_SIZE = 200;

/** In-memory ring buffer of emitted events for dev diagnostics. */
const eventLog: TutorialEventPayload[] = [];

/**
 * Emit a tutorial analytics event.
 *
 * The caller provides every field except `sessionOffsetMs`, which is computed
 * automatically as the number of milliseconds since the page session started.
 *
 * In development the event is also logged to the browser console (debug level)
 * and appended to an in-memory ring buffer accessible via
 * {@link getTutorialEventLog}.
 */
export function emitTutorialEvent(
  partial: Omit<TutorialEventPayload, 'sessionOffsetMs'>,
): void {
  const payload: TutorialEventPayload = {
    ...partial,
    sessionOffsetMs: Date.now() - SESSION_START_MS,
  };

  // Maintain bounded ring buffer
  if (eventLog.length >= MAX_LOG_SIZE) {
    eventLog.shift();
  }
  eventLog.push(payload);

  log.debug(payload.event, payload);
}

/**
 * Returns a read-only snapshot of the in-memory telemetry event log.
 *
 * Intended for developer diagnostics panels and test assertions.
 * The returned array is a live reference — copy it if you need a stable
 * snapshot.
 */
export function getTutorialEventLog(): readonly TutorialEventPayload[] {
  return eventLog;
}

/**
 * Clears the in-memory telemetry event log.
 *
 * Useful for isolating test cases so that events from previous tests do not
 * pollute later assertions.
 */
export function clearTutorialEventLog(): void {
  eventLog.length = 0;
}
