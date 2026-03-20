import { getChordName } from "@/features/chord/data/chordNames";
import { getChordPitchClasses } from "@/features/chord/utils/getChordPitchClasses";
import type { Chord } from "@/features/current-chord/types";
import type { BridgeSuggestion } from "../types";

/**
 * Returns a short human-readable label for the bridge row heading.
 * All note names are resolved through `pitchClasses` for enharmonic correctness.
 *
 * @param suggestion   - The bridge suggestion from the engine.
 * @param targetName   - The already-resolved display name of the target chord.
 * @param pitchClasses - 12-element array from `useEnharmonic` (sharps or flats).
 *
 * Examples:
 *   "ii–V into G7"
 *   "Tritone sub into C"
 *   "Chromatic ii–V into F#m7"
 */
export function generateBridgeLabel(
  suggestion: BridgeSuggestion,
  targetName: string,
  pitchClasses: string[],
): string {
  switch (suggestion.type) {
    case "diatonic-ii-v":
      return `ii–V into ${targetName}`;
    case "tritone-sub-ii-v": {
      const vChord = suggestion.bridge[1];
      const subName = vChord
        ? getChordName(vChord.root, vChord.quality, pitchClasses)
        : "♭II";
      return `ii–${subName} into ${targetName} (tritone sub)`;
    }
    case "chromatic-ii-v":
      return `Chromatic ii–V into ${targetName}`;
    case "incomplete-v":
      return `V into ${targetName}`;
    case "incomplete-ii":
      return `ii into ${targetName}`;
    case "tritone-sub": {
      const subChord = suggestion.bridge[0];
      const subName = subChord
        ? getChordName(subChord.root, subChord.quality, pitchClasses)
        : "♭II7";
      return `Tritone sub (${subName}) into ${targetName}`;
    }
    case "backchain-vi-ii-v":
      return `vi–ii–V into ${targetName}`;
    case "backchain-iii-vi-ii-v":
      return `III–vi–ii–V into ${targetName}`;
  }
}

/**
 * Returns a one-line harmonic explanation for the bridge suggestion.
 * All note names are resolved through `pitchClasses` for enharmonic correctness.
 *
 * @param suggestion   - The bridge suggestion from the engine.
 * @param targetName   - The already-resolved display name of the target chord.
 * @param pitchClasses - 12-element array from `useEnharmonic` (sharps or flats).
 *
 * Examples:
 *   "Dm7 shares E, A with Am7; G7 resolves by half step"
 *   "Db7 is the tritone sub of G7 (6 semitones apart)"
 */
export function generateBridgeExplanation(
  suggestion: BridgeSuggestion,
  targetName: string,
  pitchClasses: string[],
): string {
  const bridge = suggestion.bridge;

  switch (suggestion.type) {
    case "diatonic-ii-v": {
      const iiChord = bridge[0];
      const vChord = bridge[1];
      if (!iiChord || !vChord) {
        return `Diatonic ii–V approaching ${targetName}`;
      }
      const iiName = getChordName(iiChord.root, iiChord.quality, pitchClasses);
      const vName = getChordName(vChord.root, vChord.quality, pitchClasses);
      const sharedNotes = getSharedNoteNames(iiChord, vChord, pitchClasses);
      const sharedStr =
        sharedNotes.length > 0
          ? `${iiName} shares ${sharedNotes.join(", ")} with ${vName}`
          : `${iiName} → ${vName}`;
      return `${sharedStr}; ${vName} resolves into ${targetName}`;
    }

    case "tritone-sub-ii-v": {
      const iiChord = bridge[0];
      const subChord = bridge[1];
      if (!iiChord || !subChord) {
        return `ii–V with tritone substitution into ${targetName}`;
      }
      const iiName = getChordName(iiChord.root, iiChord.quality, pitchClasses);
      const subName = getChordName(
        subChord.root,
        subChord.quality,
        pitchClasses,
      );
      return `${iiName} → ${subName}; tritone sub (6 semitones) resolves into ${targetName}`;
    }

    case "chromatic-ii-v": {
      const iiChord = bridge[0];
      const vChord = bridge[1];
      if (!iiChord || !vChord) {
        return `Chromatic approach a half step above into ${targetName}`;
      }
      const iiName = getChordName(iiChord.root, iiChord.quality, pitchClasses);
      const vName = getChordName(vChord.root, vChord.quality, pitchClasses);
      return `${iiName} → ${vName} descends by half step into ${targetName}`;
    }

    case "incomplete-v": {
      const vChord = bridge[0];
      if (!vChord) {
        return `Single dominant chord approaching ${targetName}`;
      }
      const vName = getChordName(vChord.root, vChord.quality, pitchClasses);
      return `${vName} is the dominant (V) resolving into ${targetName}`;
    }

    case "incomplete-ii": {
      const iiChord = bridge[0];
      if (!iiChord) {
        return `Single pre-dominant chord before ${targetName}`;
      }
      const iiName = getChordName(iiChord.root, iiChord.quality, pitchClasses);
      return `${iiName} is the pre-dominant (ii) leading to ${targetName}`;
    }

    case "tritone-sub": {
      const subChord = bridge[0];
      if (!subChord) {
        return `Tritone substitution resolving into ${targetName}`;
      }
      const subName = getChordName(
        subChord.root,
        subChord.quality,
        pitchClasses,
      );
      return `${subName} is the tritone sub of the V chord (6 semitones apart), resolving into ${targetName}`;
    }

    case "backchain-vi-ii-v": {
      const names = bridge.map((c) =>
        getChordName(c.root, c.quality, pitchClasses),
      );
      return `Backcycled vi–ii–V: ${names.join(" → ")} into ${targetName}`;
    }

    case "backchain-iii-vi-ii-v": {
      const names = bridge.map((c) =>
        getChordName(c.root, c.quality, pitchClasses),
      );
      return `Backcycled III–vi–ii–V: ${names.join(" → ")} into ${targetName}`;
    }
  }
}

/**
 * Returns note names that appear in both `chordA` and `chordB`.
 */
function getSharedNoteNames(
  chordA: Chord,
  chordB: Chord,
  pitchClasses: string[],
): string[] {
  const aSet = new Set(getChordPitchClasses(chordA));
  const bSet = new Set(getChordPitchClasses(chordB));
  const shared: string[] = [];
  for (const pc of aSet) {
    if (bSet.has(pc)) {
      shared.push(pitchClasses[pc]);
    }
  }
  return shared;
}
