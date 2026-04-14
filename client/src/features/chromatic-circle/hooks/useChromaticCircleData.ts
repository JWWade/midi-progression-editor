import { useState, useEffect } from "react";
import { isApiRequestError } from "@/api/client";
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
    const controller = new AbortController();
    let isActive = true;

    getScaleCMajor({ signal: controller.signal })
      .then((notes) => {
        if (!isActive) {
          return;
        }
        setScaleNotes(
          notes.map((midi) => ({ midi, name: PITCH_CLASSES[midi % 12] ?? "" })),
        );
      })
      .catch((err: unknown) => {
        if (!isActive) {
          return;
        }
        if (isApiRequestError(err) && err.code === "aborted") {
          return;
        }
        setError(err instanceof Error ? err : new Error(String(err)));
      })
      .finally(() => {
        if (isActive) {
          setIsLoading(false);
        }
      });

    return () => {
      isActive = false;
      controller.abort();
    };
  }, []);

  return { scaleNotes, isLoading, error };
}
