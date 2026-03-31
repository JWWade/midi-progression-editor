import { useMemo } from "react";
import type { BridgeSuggestion } from "@/features/ii-v-suggestions";
import { suggestBridges } from "@/features/ii-v-suggestions";
import type { Chord } from "@/features/current-chord/types";
import type { ScaleContext } from "@/shared/types/ScaleContext";

export type { ScaleContext };

export function useBridgeSuggestions(
  chords: Chord[],
  insertAfterIndex: number,
  scale: ScaleContext | null,
  maxBridgeLength = 2,
  topN = 8,
): BridgeSuggestion[] {
  return useMemo(() => {
    if (
      chords.length < 2 ||
      insertAfterIndex < 0 ||
      insertAfterIndex >= chords.length - 1
    ) {
      return [];
    }
    return suggestBridges(
      chords[insertAfterIndex],
      chords[insertAfterIndex + 1],
      scale,
      maxBridgeLength,
      topN,
    );
  }, [chords, insertAfterIndex, scale, maxBridgeLength, topN]);
}
