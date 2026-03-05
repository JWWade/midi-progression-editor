import { useState, useEffect } from "react";
import { getScaleCMajor } from "@/features/scale/api";
import type { NoteInfo } from "../types";
import { PITCH_CLASSES } from "../utils";

export function useChromaticCircleData(): {
  scaleNotes: NoteInfo[];
  isLoading: boolean;
  error: Error | null;
} {
  const [scaleNotes, setScaleNotes] = useState<NoteInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    getScaleCMajor()
      .then((notes) => {
        setScaleNotes(
          notes.map((midi) => ({ midi, name: PITCH_CLASSES[midi % 12] ?? "" })),
        );
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err : new Error(String(err)));
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  return { scaleNotes, isLoading, error };
}
