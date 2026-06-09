import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { findBestChordIdentity, findBestQualityForRoot } from "../chordIdentity";
import type { ChordType } from "../../types";

type CsvRow = {
  chord: string;
  degrees: number[];
};

type ExpectedIdentity = {
  root: number;
  quality: ChordType;
};

const CSV_PATH =
  process.env.CHORD_MAPPING_CSV_PATH ?? "C:\\Users\\josh\\Downloads\\chords_mapping.csv";

const ROOT_TO_PITCH_CLASS: Record<string, number> = {
  C: 0,
  Cs: 1,
  Db: 1,
  D: 2,
  Ds: 3,
  Eb: 3,
  E: 4,
  Fb: 4,
  F: 5,
  Es: 5,
  Fs: 6,
  Gb: 6,
  G: 7,
  Gs: 8,
  Ab: 8,
  A: 9,
  As: 10,
  Bb: 10,
  B: 11,
  Cb: 11,
};

const SUPPORTED_SUFFIX_TO_QUALITY: Record<string, ChordType> = {
  "": "major",
  min: "minor",
  dim: "dim",
  aug: "aug",
  sus2: "sus2",
  "7": "dom7",
  maj7: "maj7",
  min7: "min7",
  minmaj7: "minmaj7",
};

function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];

    if (ch === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (ch === "," && !inQuotes) {
      fields.push(current);
      current = "";
      continue;
    }

    current += ch;
  }

  fields.push(current);
  return fields;
}

function parseCsv(content: string): CsvRow[] {
  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const dataLines = lines.slice(1);
  const rows: CsvRow[] = [];

  for (const line of dataLines) {
    const parts = parseCsvLine(line);
    if (parts.length < 4) {
      continue;
    }

    const chord = parts[1];
    const degrees = JSON.parse(parts[3]) as number[];
    rows.push({ chord, degrees });
  }

  return rows;
}

function getPitchClassesFromDegrees(degrees: readonly number[]): number[] {
  const pitchClasses: number[] = [];

  for (let i = 0; i < degrees.length; i++) {
    if (degrees[i] === 1) {
      pitchClasses.push(i);
    }
  }

  return pitchClasses;
}

function parseExpectedIdentity(chordName: string): ExpectedIdentity | null {
  const match = chordName.match(/^([A-G](?:s|b)?)(.*)$/);
  if (!match) {
    return null;
  }

  const [, rootToken, suffix] = match;
  const root = ROOT_TO_PITCH_CLASS[rootToken];
  const quality = SUPPORTED_SUFFIX_TO_QUALITY[suffix];

  if (root === undefined || quality === undefined) {
    return null;
  }

  return { root, quality };
}

const hasExternalCsv = existsSync(CSV_PATH);
const describeIfCsv = hasExternalCsv ? describe : describe.skip;

describeIfCsv("chord identity - external CSV regression", () => {
  const rows = parseCsv(readFileSync(CSV_PATH, "utf8"));
  const mappedRows = rows
    .map((row) => {
      const expected = parseExpectedIdentity(row.chord);
      if (!expected) {
        return null;
      }

      return {
        chord: row.chord,
        pitchClasses: getPitchClassesFromDegrees(row.degrees),
        expected,
      };
    })
    .filter((value): value is NonNullable<typeof value> => value !== null);

  it("loads a meaningful mapped subset", () => {
    expect(mappedRows.length).toBeGreaterThan(100);
  });

  it("matches quality when root is fixed (root-anchored verification)", () => {
    const mismatches: string[] = [];

    for (const row of mappedRows) {
      const actual = findBestQualityForRoot(row.pitchClasses, row.expected.root);

      if (actual.quality !== row.expected.quality) {
        mismatches.push(
          `${row.chord} [${row.pitchClasses.join(",")}]: expected quality ${row.expected.quality} at root ${row.expected.root}, got ${actual.quality}`,
        );
      }
    }

    expect(mismatches).toEqual([]);
  });

  it("matches root and quality globally for non-ambiguous qualities", () => {
    const nonAmbiguous = mappedRows.filter((row) => {
      const suffix = row.chord.replace(/^([A-G](?:s|b)?)/, "");
      return suffix !== "aug" && suffix !== "dim" && suffix !== "sus2" && suffix !== "min7";
    });

    expect(nonAmbiguous.length).toBeGreaterThan(50);

    const mismatches: string[] = [];

    for (const row of nonAmbiguous) {
      const actual = findBestChordIdentity(row.pitchClasses);

      if (actual.root !== row.expected.root || actual.quality !== row.expected.quality) {
        mismatches.push(
          `${row.chord} [${row.pitchClasses.join(",")}]: expected (${row.expected.root}, ${row.expected.quality}) got (${actual.root}, ${actual.quality})`,
        );
      }
    }

    expect(mismatches).toEqual([]);
  });
});
