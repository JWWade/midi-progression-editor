// @vitest-environment jsdom
/**
 * Tests for IntentStore — append-only localStorage-backed store.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { IntentStore } from '../services/IntentStore';
import type { IntentCapture } from '../types';

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeIntent(overrides: Partial<IntentCapture> = {}): IntentCapture {
  return {
    id: crypto.randomUUID(),
    timestamp: Date.now(),
    context: { key: 'C', scale: 'Major' },
    rawInput: '',
    resolved: false,
    ...overrides,
  };
}

// ── Setup / teardown ─────────────────────────────────────────────────────────

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  localStorage.clear();
});

// ── Construction ──────────────────────────────────────────────────────────────

describe('IntentStore — construction', () => {
  it('starts with an empty list when localStorage is empty', () => {
    const store = new IntentStore();
    expect(store.getAll()).toHaveLength(0);
  });

  it('rehydrates intents from localStorage on construction', () => {
    const intent = makeIntent({ id: 'abc-123' });
    localStorage.setItem('intent-captures-v1', JSON.stringify([intent]));

    const store = new IntentStore();
    const all = store.getAll();

    expect(all).toHaveLength(1);
    expect(all[0].id).toBe('abc-123');
  });

  it('starts empty when localStorage contains invalid JSON', () => {
    localStorage.setItem('intent-captures-v1', 'not-json{');
    const store = new IntentStore();
    expect(store.getAll()).toHaveLength(0);
  });

  it('starts empty when localStorage contains a non-array value', () => {
    localStorage.setItem('intent-captures-v1', JSON.stringify({ foo: 'bar' }));
    const store = new IntentStore();
    expect(store.getAll()).toHaveLength(0);
  });
});

// ── append ───────────────────────────────────────────────────────────────────

describe('IntentStore — append', () => {
  it('adds a new intent to the list', () => {
    const store = new IntentStore();
    const intent = makeIntent();
    store.append(intent);
    expect(store.getAll()).toHaveLength(1);
    expect(store.getAll()[0]).toEqual(intent);
  });

  it('preserves insertion order (append-only)', () => {
    const store = new IntentStore();
    const a = makeIntent({ rawInput: 'first' });
    const b = makeIntent({ rawInput: 'second' });
    store.append(a);
    store.append(b);
    const all = store.getAll();
    expect(all[0].rawInput).toBe('first');
    expect(all[1].rawInput).toBe('second');
  });

  it('persists the appended intent to localStorage', () => {
    const store = new IntentStore();
    const intent = makeIntent({ id: 'persist-me' });
    store.append(intent);

    const raw = localStorage.getItem('intent-captures-v1');
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw!) as IntentCapture[];
    expect(parsed).toHaveLength(1);
    expect(parsed[0].id).toBe('persist-me');
  });

  it('does not mutate the returned list from getAll', () => {
    const store = new IntentStore();
    const intent = makeIntent();
    store.append(intent);
    const before = store.getAll();
    store.append(makeIntent());
    const after = store.getAll();
    // before should still only reference the first snapshot
    expect(before).toHaveLength(1);
    expect(after).toHaveLength(2);
  });
});

// ── resolve ───────────────────────────────────────────────────────────────────

describe('IntentStore — resolve', () => {
  it('marks the matching intent as resolved', () => {
    const store = new IntentStore();
    const intent = makeIntent({ id: 'to-resolve' });
    store.append(intent);
    store.resolve('to-resolve');
    expect(store.getAll()[0].resolved).toBe(true);
  });

  it('leaves other intents unchanged', () => {
    const store = new IntentStore();
    const a = makeIntent({ id: 'a' });
    const b = makeIntent({ id: 'b' });
    store.append(a);
    store.append(b);
    store.resolve('a');
    expect(store.getAll()[0].resolved).toBe(true);
    expect(store.getAll()[1].resolved).toBe(false);
  });

  it('is a no-op when the id is not found', () => {
    const store = new IntentStore();
    const intent = makeIntent({ id: 'existing' });
    store.append(intent);
    store.resolve('unknown-id');
    // List unchanged
    expect(store.getAll()).toHaveLength(1);
    expect(store.getAll()[0].resolved).toBe(false);
  });

  it('persists the resolved flag to localStorage', () => {
    const store = new IntentStore();
    store.append(makeIntent({ id: 'r1' }));
    store.resolve('r1');

    const raw = localStorage.getItem('intent-captures-v1');
    const parsed = JSON.parse(raw!) as IntentCapture[];
    expect(parsed[0].resolved).toBe(true);
  });
});

// ── clear ─────────────────────────────────────────────────────────────────────

describe('IntentStore — clear', () => {
  it('removes all intents', () => {
    const store = new IntentStore();
    store.append(makeIntent());
    store.append(makeIntent());
    store.clear();
    expect(store.getAll()).toHaveLength(0);
  });

  it('clears localStorage', () => {
    const store = new IntentStore();
    store.append(makeIntent());
    store.clear();
    const raw = localStorage.getItem('intent-captures-v1');
    expect(JSON.parse(raw!)).toHaveLength(0);
  });
});

// ── localStorage failure resilience ──────────────────────────────────────────

describe('IntentStore — localStorage failure resilience', () => {
  it('does not throw when localStorage.setItem throws', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });

    const store = new IntentStore();
    expect(() => store.append(makeIntent())).not.toThrow();

    vi.restoreAllMocks();
  });
});
