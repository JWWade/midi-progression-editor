import { Fragment } from "react";
import type { ChordType } from "@/features/chord/types";
import { ChordQualityColors } from "@/features/chord/constants/chordQualityColors";
import {
  getChordColor,
  type ChordComplexity,
} from "@/features/color-language/utils/chordColorUtils";
import { createRadialGradientDef } from "@/features/color-language/utils/svgGradient";
import { CHORD_TONE_FILLS, chordToneGradientId, chordPolygonGradientId } from "../utils/noteStyles";

const COMPLEXITIES: ChordComplexity[] = ["triad", "seventh", "extended"];

/**
 * SVG `<defs>` block containing all radial gradient definitions used by the
 * chromatic circle — one set for chord-tone note nodes and one for chord
 * polygon fills, each per quality × complexity combination.
 */
export function CircleDefs() {
  return (
    <defs>
      {(Object.keys(CHORD_TONE_FILLS) as ChordType[]).flatMap((quality) =>
        COMPLEXITIES.map((complexity) => (
          <radialGradient
            key={`${quality}-${complexity}`}
            id={chordToneGradientId(quality, complexity)}
            cx="35%"
            cy="35%"
            r="65%"
          >
            <stop offset="0%" stopColor="#fff" stopOpacity={0.55} />
            <stop
              offset="100%"
              stopColor={getChordColor(quality, complexity)}
              stopOpacity={1}
            />
          </radialGradient>
        )),
      )}
      {(Object.keys(ChordQualityColors) as ChordType[]).flatMap((quality) =>
        COMPLEXITIES.map((complexity) => (
          <Fragment key={`polygon-${quality}-${complexity}`}>
            {createRadialGradientDef(chordPolygonGradientId(quality, complexity), {
              ...ChordQualityColors[quality],
              base: getChordColor(quality, complexity),
            })}
          </Fragment>
        )),
      )}
    </defs>
  );
}
