import { ChordThumbnail } from "@/features/current-chord/components/ChordThumbnail";
import { getChordName } from "@/features/chord/data/chordNames";
import { getChordNoteIndices } from "@/features/chord/utils/transpose";
import { ChordQualityColors } from "@/features/chord/constants/chordQualityColors";
import { getChordComplexity } from "@/features/color-language/utils/chordColorUtils";
import type { Chord } from "@/features/current-chord/types";
import styles from "./ChordTile.module.css";

interface ChordTileProps {
  chord: Chord;
  index: number;
}

export function ChordTile({ chord, index }: ChordTileProps) {
  const noteIndices = getChordNoteIndices(chord.root, chord.quality);
  const complexity = getChordComplexity(chord);
  const accentColor = ChordQualityColors[chord.quality].base;
  const chordName = getChordName(chord.root, chord.quality);

  return (
    <div
      className={styles.tile}
      style={{ "--accent-color": accentColor } as React.CSSProperties}
      aria-label={`Chord ${index + 1}: ${chordName}`}
    >
      <div className={styles.thumbnail}>
        <ChordThumbnail
          noteIndices={noteIndices}
          quality={chord.quality}
          complexity={complexity}
          size={48}
        />
      </div>
      <span className={styles.chordName}>{chordName}</span>
    </div>
  );
}
