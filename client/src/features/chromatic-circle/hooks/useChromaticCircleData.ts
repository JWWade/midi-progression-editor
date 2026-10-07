import { getScaleNotes } from "@/features/scale/utils";
import type { NoteInfo } from "../types";
import { PITCH_CLASSES } from "../utils";

export function useChromaticCircleData(): {
  scaleNotes: NoteInfo[];
  isLoading: boolean;
  error: Error | null;
} {
  const scaleNotes = getScaleNotes(0, "major").map((midi) => ({
    midi,
    name: PITCH_CLASSES[midi] ?? "",
  }));

  return { scaleNotes, isLoading: false, error: null };
}
