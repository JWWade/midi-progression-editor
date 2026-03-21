/**
 * Centralized logging utility.
 *
 * In development (`import.meta.env.DEV`), all log levels are active.
 * In production, only `warn` and `error` are emitted so diagnostic noise
 * stays out of the production bundle's console output.
 *
 * Usage:
 *   import { createLogger } from '@/shared/utils/logger';
 *   const log = createLogger('MyFeature');
 *   log.debug('initialising', { data });
 *   log.info('chord changed', chord);
 *   log.warn('unexpected state');
 *   log.error('playback failed', err);
 *
 * Or use the pre-built `logger` for app-level messages:
 *   import { logger } from '@/shared/utils/logger';
 */

const isDev: boolean = import.meta.env.DEV;

export interface Logger {
  debug: (...args: unknown[]) => void;
  info: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
}

/**
 * Creates a named logger for a specific module or feature.
 *
 * @param namespace A short identifier shown as a prefix in every log line,
 *   e.g. `"audio"`, `"chord"`, `"progression"`.
 */
export function createLogger(namespace: string): Logger {
  const prefix = `[${namespace}]`;
  return {
    debug: (...args: unknown[]): void => {
      if (isDev) {
        console.debug(prefix, ...args);
      }
    },
    info: (...args: unknown[]): void => {
      if (isDev) {
        console.info(prefix, ...args);
      }
    },
    warn: (...args: unknown[]): void => {
      console.warn(prefix, ...args);
    },
    error: (...args: unknown[]): void => {
      console.error(prefix, ...args);
    },
  };
}

/** App-level logger for general diagnostic messages. */
export const logger: Logger = createLogger('app');
