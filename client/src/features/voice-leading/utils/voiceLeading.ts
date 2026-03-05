import type { ChordNoteInfo } from "@/features/chord/types";
import { calculatePolygonPoints } from "@/features/chromatic-circle/utils/geometry";
import type { Point } from "@/features/chromatic-circle/utils/geometry";

export interface VoiceLead {
  fromNote: ChordNoteInfo;
  toNote: ChordNoteInfo;
  from: Point;
  to: Point;
}

/**
 * Calculates voice lead lines between two chords of the same length.
 * Connects notes at the same position: Root→Root, Third→Third, Fifth→Fifth, etc.
 */
export function calculateVoiceLeads(
  fromChord: ChordNoteInfo[],
  toChord: ChordNoteInfo[],
  cx: number,
  cy: number,
  circleRadius: number,
): VoiceLead[] {
  const count = Math.min(fromChord.length, toChord.length);
  const fromIndices = fromChord.slice(0, count).map((n) => n.index);
  const toIndices = toChord.slice(0, count).map((n) => n.index);
  const fromPoints = calculatePolygonPoints(cx, cy, circleRadius, fromIndices);
  const toPoints = calculatePolygonPoints(cx, cy, circleRadius, toIndices);

  return fromChord.slice(0, count).map((fromNote, i) => ({
    fromNote,
    toNote: toChord[i],
    from: fromPoints[i],
    to: toPoints[i],
  }));
}
