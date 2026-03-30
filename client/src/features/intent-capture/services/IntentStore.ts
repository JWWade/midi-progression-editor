import { createLogger } from '@/shared/utils/logger';
import type { IntentCapture } from '../types';

const log = createLogger('IntentStore');

/** localStorage key used to persist the intent list. */
const STORAGE_KEY = 'intent-captures-v1';

/**
 * Append-only intent store backed by localStorage.
 *
 * All mutations are synchronous. Data is persisted after every write.
 * Read failures fall back to an empty list; write failures are logged
 * and silently ignored to preserve the non-blocking contract.
 */
export class IntentStore {
  private intents: IntentCapture[] = [];

  constructor() {
    this.load();
  }

  /** Appends a new intent and persists the updated list. */
  append(intent: IntentCapture): void {
    this.intents = [...this.intents, intent];
    this.persist();
    log.debug('appended intent', intent.id);
  }

  /** Returns an immutable snapshot of all stored intents. */
  getAll(): readonly IntentCapture[] {
    return this.intents;
  }

  /**
   * Marks the intent with the given `id` as resolved.
   * No-ops if the id is not found.
   */
  resolve(id: string): void {
    const idx = this.intents.findIndex((i) => i.id === id);
    if (idx === -1) {
      log.warn('resolve: intent not found', id);
      return;
    }
    this.intents = this.intents.map((intent, i) =>
      i === idx ? { ...intent, resolved: true } : intent,
    );
    this.persist();
    log.debug('resolved intent', id);
  }

  /** Removes all intents from the store and clears localStorage. */
  clear(): void {
    this.intents = [];
    this.persist();
    log.debug('store cleared');
  }

  // ── Private helpers ────────────────────────────────────────────────────

  private load(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed: unknown = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        this.intents = parsed as IntentCapture[];
      }
    } catch {
      log.warn('failed to load intents from localStorage');
    }
  }

  private persist(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.intents));
    } catch {
      log.warn('failed to persist intents to localStorage');
    }
  }
}
