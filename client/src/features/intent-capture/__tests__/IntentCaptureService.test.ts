// @vitest-environment jsdom
/**
 * Tests for captureIntent (IntentCaptureService) and snapshotContext.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { captureIntent } from '../services/IntentCaptureService';
import { snapshotContext } from '../services/ContextSnapshotter';
import { IntentStore } from '../services/IntentStore';
import type { Chord } from '@/features/current-chord/types';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const Cmaj: Chord = { root: 0, quality: 'major' };
const Am: Chord = { root: 9, quality: 'minor' };

const PITCH_CLASSES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];

// ── Setup ─────────────────────────────────────────────────────────────────────

beforeEach(() => localStorage.clear());
afterEach(() => localStorage.clear());

// ── captureIntent ─────────────────────────────────────────────────────────────

describe('captureIntent', () => {
  it('returns a non-empty string id', () => {
    const store = new IntentStore();
    const id = captureIntent({ rawInput: '', context: {} }, store);
    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThan(0);
  });

  it('appends the intent to the store', () => {
    const store = new IntentStore();
    captureIntent({ rawInput: 'test', context: { key: 'G' } }, store);
    expect(store.getAll()).toHaveLength(1);
    expect(store.getAll()[0].rawInput).toBe('test');
  });

  it('stores the provided context on the intent', () => {
    const store = new IntentStore();
    captureIntent(
      { rawInput: '', context: { key: 'D', scale: 'Dorian', cursorPosition: 2 } },
      store,
    );
    const intent = store.getAll()[0];
    expect(intent.context.key).toBe('D');
    expect(intent.context.scale).toBe('Dorian');
    expect(intent.context.cursorPosition).toBe(2);
  });

  it('sets resolved to false', () => {
    const store = new IntentStore();
    captureIntent({ rawInput: '', context: {} }, store);
    expect(store.getAll()[0].resolved).toBe(false);
  });

  it('sets a numeric timestamp', () => {
    const before = Date.now();
    const store = new IntentStore();
    captureIntent({ rawInput: '', context: {} }, store);
    const after = Date.now();
    expect(store.getAll()[0].timestamp).toBeGreaterThanOrEqual(before);
    expect(store.getAll()[0].timestamp).toBeLessThanOrEqual(after);
  });

  it('generates unique ids for successive captures', () => {
    const store = new IntentStore();
    const id1 = captureIntent({ rawInput: '', context: {} }, store);
    const id2 = captureIntent({ rawInput: '', context: {} }, store);
    expect(id1).not.toBe(id2);
  });

  it('multiple captures accumulate in store (append-only)', () => {
    const store = new IntentStore();
    captureIntent({ rawInput: 'a', context: {} }, store);
    captureIntent({ rawInput: 'b', context: {} }, store);
    captureIntent({ rawInput: 'c', context: {} }, store);
    expect(store.getAll()).toHaveLength(3);
  });
});

// ── snapshotContext ────────────────────────────────────────────────────────────

describe('snapshotContext', () => {
  it('includes a defensive copy of the progression', () => {
    const chords = [Cmaj, Am];
    const ctx = snapshotContext({
      chords,
      keyRoot: 0,
      keyScale: 'major',
      pitchClasses: PITCH_CLASSES,
    });
    expect(ctx.progressionSnapshot).toEqual([Cmaj, Am]);
    // Mutation of the original array must not affect the snapshot
    chords.push({ root: 5, quality: 'major' });
    expect(ctx.progressionSnapshot).toHaveLength(2);
  });

  it('resolves the key name from pitchClasses', () => {
    const ctx = snapshotContext({
      chords: [],
      keyRoot: 7,
      keyScale: 'major',
      pitchClasses: PITCH_CLASSES,
    });
    expect(ctx.key).toBe('G');
  });

  it('resolves the scale label for major', () => {
    const ctx = snapshotContext({
      chords: [],
      keyRoot: 0,
      keyScale: 'major',
      pitchClasses: PITCH_CLASSES,
    });
    expect(ctx.scale).toBe('Major');
  });

  it('resolves the scale label for dorian', () => {
    const ctx = snapshotContext({
      chords: [],
      keyRoot: 0,
      keyScale: 'dorian',
      pitchClasses: PITCH_CLASSES,
    });
    expect(ctx.scale).toBe('Dorian');
  });

  it('includes cursorPosition when provided', () => {
    const ctx = snapshotContext({
      chords: [],
      keyRoot: 0,
      keyScale: 'major',
      pitchClasses: PITCH_CLASSES,
      cursorPosition: 4,
    });
    expect(ctx.cursorPosition).toBe(4);
  });

  it('omits cursorPosition when not provided', () => {
    const ctx = snapshotContext({
      chords: [],
      keyRoot: 0,
      keyScale: 'major',
      pitchClasses: PITCH_CLASSES,
    });
    expect('cursorPosition' in ctx).toBe(false);
  });

  it('handles empty progression', () => {
    const ctx = snapshotContext({
      chords: [],
      keyRoot: 0,
      keyScale: 'major',
      pitchClasses: PITCH_CLASSES,
    });
    expect(ctx.progressionSnapshot).toEqual([]);
  });
});
