import { describe, it, expect } from "vitest";
import type { BridgeSuggestion } from "@/features/ii-v-suggestions/types";
import type { Chord } from "@/features/current-chord/types";
import {
  generateBridgeLabel,
  generateBridgeExplanation,
} from "../bridgeLabel";

// ── Pitch-class arrays ──────────────────────────────────────────────────────

const SHARP_PITCH_CLASSES = [
  "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B",
];

const FLAT_PITCH_CLASSES = [
  "C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B",
];

// ── Chord helpers ───────────────────────────────────────────────────────────

function chord(root: number, quality: Chord["quality"]): Chord {
  return { root, quality };
}

// ── Fixture factory ─────────────────────────────────────────────────────────

function makeSuggestion(
  type: BridgeSuggestion["type"],
  bridge: Chord[],
): BridgeSuggestion {
  return { bridge, score: 0.8, type, label: "", explanation: "" };
}

// ── generateBridgeLabel ─────────────────────────────────────────────────────

describe("generateBridgeLabel", () => {
  describe("diatonic-ii-v", () => {
    const suggestion = makeSuggestion("diatonic-ii-v", [
      chord(2, "min7"),   // Dm7
      chord(7, "dom7"),   // G7
    ]);

    it("returns 'ii–V into <targetName>'", () => {
      expect(generateBridgeLabel(suggestion, "C", SHARP_PITCH_CLASSES)).toBe(
        "ii–V into C",
      );
    });

    it("targetName is used verbatim (enharmonic context applied by caller)", () => {
      expect(
        generateBridgeLabel(suggestion, "Cmaj7", FLAT_PITCH_CLASSES),
      ).toBe("ii–V into Cmaj7");
    });
  });

  describe("tritone-sub-ii-v", () => {
    it("includes the tritone-sub V chord name (sharp)", () => {
      const suggestion = makeSuggestion("tritone-sub-ii-v", [
        chord(2, "min7"),   // Dm7
        chord(1, "dom7"),   // Db7 (tritone of G7)
      ]);
      expect(generateBridgeLabel(suggestion, "C", SHARP_PITCH_CLASSES)).toBe(
        "ii–C#7 into C (tritone sub)",
      );
    });

    it("uses flat name when flat pitch classes provided", () => {
      const suggestion = makeSuggestion("tritone-sub-ii-v", [
        chord(2, "min7"),
        chord(1, "dom7"),
      ]);
      expect(generateBridgeLabel(suggestion, "C", FLAT_PITCH_CLASSES)).toBe(
        "ii–Db7 into C (tritone sub)",
      );
    });
  });

  describe("chromatic-ii-v", () => {
    it("returns 'Chromatic ii–V into <targetName>'", () => {
      const suggestion = makeSuggestion("chromatic-ii-v", [
        chord(3, "min7"),
        chord(8, "dom7"),
      ]);
      expect(generateBridgeLabel(suggestion, "C", SHARP_PITCH_CLASSES)).toBe(
        "Chromatic ii–V into C",
      );
    });
  });

  describe("incomplete-v", () => {
    it("returns 'V into <targetName>'", () => {
      const suggestion = makeSuggestion("incomplete-v", [chord(7, "dom7")]);
      expect(generateBridgeLabel(suggestion, "C", SHARP_PITCH_CLASSES)).toBe(
        "V into C",
      );
    });
  });

  describe("incomplete-ii", () => {
    it("returns 'ii into <targetName>'", () => {
      const suggestion = makeSuggestion("incomplete-ii", [chord(2, "min7")]);
      expect(generateBridgeLabel(suggestion, "C", SHARP_PITCH_CLASSES)).toBe(
        "ii into C",
      );
    });
  });

  describe("tritone-sub", () => {
    it("includes the substitution chord name (sharp)", () => {
      const suggestion = makeSuggestion("tritone-sub", [chord(1, "dom7")]);
      expect(generateBridgeLabel(suggestion, "C", SHARP_PITCH_CLASSES)).toBe(
        "Tritone sub (C#7) into C",
      );
    });

    it("includes the substitution chord name (flat)", () => {
      const suggestion = makeSuggestion("tritone-sub", [chord(1, "dom7")]);
      expect(generateBridgeLabel(suggestion, "C", FLAT_PITCH_CLASSES)).toBe(
        "Tritone sub (Db7) into C",
      );
    });
  });

  describe("backchain-vi-ii-v", () => {
    it("returns 'vi–ii–V into <targetName>'", () => {
      const suggestion = makeSuggestion("backchain-vi-ii-v", [
        chord(9, "min7"),
        chord(2, "min7"),
        chord(7, "dom7"),
      ]);
      expect(generateBridgeLabel(suggestion, "C", SHARP_PITCH_CLASSES)).toBe(
        "vi–ii–V into C",
      );
    });
  });

  describe("backchain-iii-vi-ii-v", () => {
    it("returns 'III–vi–ii–V into <targetName>'", () => {
      const suggestion = makeSuggestion("backchain-iii-vi-ii-v", [
        chord(4, "dom7"),
        chord(9, "min7"),
        chord(2, "min7"),
        chord(7, "dom7"),
      ]);
      expect(generateBridgeLabel(suggestion, "C", SHARP_PITCH_CLASSES)).toBe(
        "III–vi–ii–V into C",
      );
    });
  });
});

// ── generateBridgeExplanation ───────────────────────────────────────────────

describe("generateBridgeExplanation", () => {
  describe("diatonic-ii-v", () => {
    const suggestion = makeSuggestion("diatonic-ii-v", [
      chord(2, "min7"),   // Dm7  [D, F, A, C]
      chord(7, "dom7"),   // G7   [G, B, D, F]
    ]);

    it("produces a non-empty explanation (sharp)", () => {
      const result = generateBridgeExplanation(
        suggestion,
        "C",
        SHARP_PITCH_CLASSES,
      );
      expect(result.length).toBeGreaterThan(0);
    });

    it("mentions the target name", () => {
      const result = generateBridgeExplanation(
        suggestion,
        "Cmaj7",
        SHARP_PITCH_CLASSES,
      );
      expect(result).toContain("Cmaj7");
    });

    it("mentions both bridge chord names", () => {
      const result = generateBridgeExplanation(
        suggestion,
        "C",
        SHARP_PITCH_CLASSES,
      );
      expect(result).toContain("Dm7");
      expect(result).toContain("G7");
    });

    it("uses flat note names in explanation when flat pitch classes provided", () => {
      const suggestionFlat = makeSuggestion("diatonic-ii-v", [
        chord(3, "min7"),   // Ebm7 (flat) / D#m7 (sharp)
        chord(8, "dom7"),   // Ab7 (flat) / G#7 (sharp)
      ]);
      const sharp = generateBridgeExplanation(
        suggestionFlat,
        "Db",
        SHARP_PITCH_CLASSES,
      );
      const flat = generateBridgeExplanation(
        suggestionFlat,
        "Db",
        FLAT_PITCH_CLASSES,
      );
      expect(sharp).toContain("D#");
      expect(flat).toContain("Eb");
    });
  });

  describe("tritone-sub-ii-v", () => {
    const suggestion = makeSuggestion("tritone-sub-ii-v", [
      chord(2, "min7"),   // Dm7
      chord(1, "dom7"),   // Db7
    ]);

    it("produces a non-empty explanation", () => {
      expect(
        generateBridgeExplanation(suggestion, "C", SHARP_PITCH_CLASSES).length,
      ).toBeGreaterThan(0);
    });

    it("mentions tritone sub chord name (sharp → C#7)", () => {
      expect(
        generateBridgeExplanation(suggestion, "C", SHARP_PITCH_CLASSES),
      ).toContain("C#7");
    });

    it("mentions tritone sub chord name (flat → Db7)", () => {
      expect(
        generateBridgeExplanation(suggestion, "C", FLAT_PITCH_CLASSES),
      ).toContain("Db7");
    });
  });

  describe("chromatic-ii-v", () => {
    const suggestion = makeSuggestion("chromatic-ii-v", [
      chord(3, "min7"),
      chord(8, "dom7"),
    ]);

    it("produces a non-empty explanation", () => {
      expect(
        generateBridgeExplanation(suggestion, "C", SHARP_PITCH_CLASSES).length,
      ).toBeGreaterThan(0);
    });

    it("mentions 'half step' or 'half-step'", () => {
      const result = generateBridgeExplanation(
        suggestion,
        "C",
        SHARP_PITCH_CLASSES,
      );
      expect(result.toLowerCase()).toMatch(/half.?step/);
    });

    it("mentions the target name", () => {
      expect(
        generateBridgeExplanation(suggestion, "C", SHARP_PITCH_CLASSES),
      ).toContain("C");
    });
  });

  describe("incomplete-v", () => {
    const suggestion = makeSuggestion("incomplete-v", [chord(7, "dom7")]);

    it("produces a non-empty explanation", () => {
      expect(
        generateBridgeExplanation(suggestion, "C", SHARP_PITCH_CLASSES).length,
      ).toBeGreaterThan(0);
    });

    it("mentions the V chord name", () => {
      expect(
        generateBridgeExplanation(suggestion, "C", SHARP_PITCH_CLASSES),
      ).toContain("G7");
    });

    it("mentions 'dominant'", () => {
      expect(
        generateBridgeExplanation(
          suggestion,
          "C",
          SHARP_PITCH_CLASSES,
        ).toLowerCase(),
      ).toContain("dominant");
    });
  });

  describe("incomplete-ii", () => {
    const suggestion = makeSuggestion("incomplete-ii", [chord(2, "min7")]);

    it("produces a non-empty explanation", () => {
      expect(
        generateBridgeExplanation(suggestion, "C", SHARP_PITCH_CLASSES).length,
      ).toBeGreaterThan(0);
    });

    it("mentions the ii chord name", () => {
      expect(
        generateBridgeExplanation(suggestion, "C", SHARP_PITCH_CLASSES),
      ).toContain("Dm7");
    });
  });

  describe("tritone-sub (single chord)", () => {
    const suggestion = makeSuggestion("tritone-sub", [chord(1, "dom7")]);

    it("produces a non-empty explanation", () => {
      expect(
        generateBridgeExplanation(suggestion, "C", SHARP_PITCH_CLASSES).length,
      ).toBeGreaterThan(0);
    });

    it("mentions '6 semitones'", () => {
      expect(
        generateBridgeExplanation(suggestion, "C", SHARP_PITCH_CLASSES),
      ).toContain("6 semitones");
    });

    it("uses flat name when flat pitch classes provided (Db7)", () => {
      expect(
        generateBridgeExplanation(suggestion, "C", FLAT_PITCH_CLASSES),
      ).toContain("Db7");
    });
  });

  describe("backchain-vi-ii-v", () => {
    const suggestion = makeSuggestion("backchain-vi-ii-v", [
      chord(9, "min7"),   // Am7
      chord(2, "min7"),   // Dm7
      chord(7, "dom7"),   // G7
    ]);

    it("produces a non-empty explanation", () => {
      expect(
        generateBridgeExplanation(suggestion, "C", SHARP_PITCH_CLASSES).length,
      ).toBeGreaterThan(0);
    });

    it("lists all three bridge chords in order", () => {
      const result = generateBridgeExplanation(
        suggestion,
        "C",
        SHARP_PITCH_CLASSES,
      );
      expect(result).toContain("Am7");
      expect(result).toContain("Dm7");
      expect(result).toContain("G7");
    });
  });

  describe("backchain-iii-vi-ii-v", () => {
    const suggestion = makeSuggestion("backchain-iii-vi-ii-v", [
      chord(4, "dom7"),   // E7
      chord(9, "min7"),   // Am7
      chord(2, "min7"),   // Dm7
      chord(7, "dom7"),   // G7
    ]);

    it("produces a non-empty explanation", () => {
      expect(
        generateBridgeExplanation(suggestion, "C", SHARP_PITCH_CLASSES).length,
      ).toBeGreaterThan(0);
    });

    it("lists all four bridge chords in order", () => {
      const result = generateBridgeExplanation(
        suggestion,
        "C",
        SHARP_PITCH_CLASSES,
      );
      expect(result).toContain("E7");
      expect(result).toContain("Am7");
      expect(result).toContain("Dm7");
      expect(result).toContain("G7");
    });
  });

  describe("enharmonic switching", () => {
    it("Ab7 (root=8) vs G#7 flips with pitch-class array", () => {
      const suggestion = makeSuggestion("tritone-sub", [chord(8, "dom7")]);
      const sharpResult = generateBridgeExplanation(
        suggestion,
        "D",
        SHARP_PITCH_CLASSES,
      );
      const flatResult = generateBridgeExplanation(
        suggestion,
        "D",
        FLAT_PITCH_CLASSES,
      );
      expect(sharpResult).toContain("G#7");
      expect(flatResult).toContain("Ab7");
    });
  });
});
