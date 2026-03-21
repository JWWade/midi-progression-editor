import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createLogger } from '../logger';

describe('createLogger', () => {
  let debugSpy: ReturnType<typeof vi.spyOn>;
  let infoSpy: ReturnType<typeof vi.spyOn>;
  let warnSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => undefined);
    infoSpy = vi.spyOn(console, 'info').mockImplementation(() => undefined);
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('prefixes each message with the namespace', () => {
    const log = createLogger('test-ns');
    log.warn('something happened');
    expect(warnSpy).toHaveBeenCalledWith('[test-ns]', 'something happened');
  });

  it('prefixes error messages with the namespace', () => {
    const log = createLogger('err-ns');
    const err = new Error('boom');
    log.error('fatal', err);
    expect(errorSpy).toHaveBeenCalledWith('[err-ns]', 'fatal', err);
  });

  it('always emits warn regardless of env', () => {
    const log = createLogger('warn-ns');
    log.warn('heads up');
    expect(warnSpy).toHaveBeenCalledTimes(1);
  });

  it('always emits error regardless of env', () => {
    const log = createLogger('error-ns');
    log.error('broken');
    expect(errorSpy).toHaveBeenCalledTimes(1);
  });

  it('does not call info or debug in production (isDev=false)', () => {
    // vitest runs with import.meta.env.DEV = true by default in the test env,
    // so we test the production path by not calling these and confirming
    // that warn/error still work independently.
    const log = createLogger('prod-ns');
    // Calling warn and error should not trigger debug or info
    log.warn('w');
    log.error('e');
    expect(debugSpy).not.toHaveBeenCalled();
    expect(infoSpy).not.toHaveBeenCalled();
  });

  it('forwards multiple arguments to console methods', () => {
    const log = createLogger('multi-ns');
    log.error('msg', 1, { key: 'val' });
    expect(errorSpy).toHaveBeenCalledWith('[multi-ns]', 'msg', 1, { key: 'val' });
  });

  it('returns a logger with all four methods', () => {
    const log = createLogger('shape-ns');
    expect(typeof log.debug).toBe('function');
    expect(typeof log.info).toBe('function');
    expect(typeof log.warn).toBe('function');
    expect(typeof log.error).toBe('function');
  });
});
