import type {
  ArpeggioDirection,
  ArpeggioPattern,
  ArpeggioSubdivision,
} from "../types/arpeggioPattern";

/**
 * Reorder `notes` according to the requested arpeggio direction.
 *
 * Notes are sorted by pitch-class index (0–11) before direction is applied,
 * so the result is deterministic regardless of the input order.
 */
export function applyArpeggioDirection<T extends { index: number }>(
  notes: ReadonlyArray<T>,
  direction: ArpeggioDirection,
): T[] {
  const sorted = [...notes].sort((a, b) => a.index - b.index);

  switch (direction) {
    case "up":
      return sorted;

    case "down":
      return [...sorted].reverse();

    case "up-down": {
      if (sorted.length <= 1) return sorted;
      // Ascending then descending; avoid repeating first and last notes.
      const descending = [...sorted].reverse().slice(1, sorted.length - 1);
      return [...sorted, ...descending];
    }

    case "random": {
      const shuffled = [...sorted];
      // Fisher-Yates shuffle — deterministic per call, seeded by Math.random.
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j]!, shuffled[i]!];
      }
      return shuffled;
    }
  }
}

/**
 * Repeat `notes` exactly `repeats` times (minimum 1).
 */
export function applyRepeats<T>(notes: T[], repeats: number): T[] {
  const count = Math.max(1, Math.round(repeats));
  const result: T[] = [];
  for (let i = 0; i < count; i++) {
    result.push(...notes);
  }
  return result;
}

/**
 * Convert a subdivision to its beat fraction (beats per note).
 *
 * - quarter  → 1.0
 * - eighth   → 0.5
 * - sixteenth → 0.25
 * - triplet  → 1/3
 */
export function getSubdivisionBeats(subdivision: ArpeggioSubdivision): number {
  switch (subdivision) {
    case "quarter":   return 1;
    case "eighth":    return 0.5;
    case "sixteenth": return 0.25;
    case "triplet":   return 1 / 3;
  }
}

/**
 * Compute the start time offset (in seconds) for each note in an arpeggio
 * sequence, applying optional swing.
 *
 * @param count           Number of notes in the sequence.
 * @param secondsPerBeat  Duration of one beat in seconds (= 60 / BPM).
 * @param subdivision     Rhythmic subdivision (see `getSubdivisionBeats`).
 * @param swingPercent    Swing amount 0–100.
 *                        At 0 notes are evenly spaced; at 100 the first note of
 *                        each pair is 1.5× the base duration (dotted-eighth feel).
 * @returns Array of start offsets in seconds, one per note.
 */
export function computeArpeggioStartOffsets(
  count: number,
  secondsPerBeat: number,
  subdivision: ArpeggioSubdivision,
  swingPercent: number,
): number[] {
  const baseSec = getSubdivisionBeats(subdivision) * secondsPerBeat;
  // swingFactor: 1.0 = straight (0 %), 1.5 = max swing (100 %)
  const swingFactor = 1 + (Math.max(0, Math.min(100, swingPercent)) / 100) * 0.5;

  const offsets: number[] = [];

  for (let i = 0; i < count; i++) {
    const pairIndex = Math.floor(i / 2);
    const isOdd = i % 2 === 1;
    const pairStart = pairIndex * 2 * baseSec;

    if (isOdd) {
      // Odd note: pushed forward by swing factor applied to the even note
      offsets.push(pairStart + swingFactor * baseSec);
    } else {
      // Even note: always lands on the grid beat
      offsets.push(pairStart);
    }
  }

  return offsets;
}

/**
 * Generate the full arpeggiated note sequence for a chord, applying
 * direction and repeats from the given pattern.
 *
 * The result is suitable for passing directly to `playArpeggio`.
 * Timing (subdivision, swing) is expressed separately via
 * `computeArpeggioStartOffsets`.
 */
export function generateArpeggioSequence<T extends { index: number }>(
  notes: ReadonlyArray<T>,
  pattern: ArpeggioPattern,
): T[] {
  const ordered = applyArpeggioDirection(notes, pattern.direction);
  return applyRepeats(ordered, pattern.repeats);
}
