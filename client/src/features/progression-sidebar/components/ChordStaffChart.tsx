import { useMemo } from "react";
import { buildStaffNoteLayout, pickStaffClef } from "../utils/staffMapping";
import styles from "./ChordStaffChart.module.css";

interface ChordStaffChartProps {
  chordName: string;
  voicedMidiNotes: number[] | null;
  pitchClasses: readonly string[];
  density?: "compact" | "comfortable";
  descriptionId?: string;
}

function describeVoicing(layout: ReturnType<typeof buildStaffNoteLayout>): string {
  return layout.map((note) => note.noteLabel).join(" ");
}

function inferAccidentalPreference(chordName: string, pitchClasses: readonly string[]): "auto" | "sharp" | "flat" {
  if (/[b♭]/.test(chordName)) {
    return "flat";
  }
  if (/[#♯]/.test(chordName)) {
    return "sharp";
  }

  const likelyFlatSet = pitchClasses[1]?.includes("b") || pitchClasses[3]?.includes("b");
  if (likelyFlatSet) {
    return "flat";
  }

  const likelySharpSet = pitchClasses[1]?.includes("#") || pitchClasses[3]?.includes("#");
  if (likelySharpSet) {
    return "sharp";
  }

  return "auto";
}

export function ChordStaffChart({ chordName, voicedMidiNotes, pitchClasses, density = "compact", descriptionId }: ChordStaffChartProps) {
  const model = useMemo(() => {
    if (!voicedMidiNotes || voicedMidiNotes.length === 0) return null;
    const clef = pickStaffClef(voicedMidiNotes);
    const accidentalPreference = inferAccidentalPreference(chordName, pitchClasses);
    const layout = buildStaffNoteLayout(voicedMidiNotes, pitchClasses, clef, accidentalPreference);
    if (layout.length === 0) return null;
    return { clef, layout };
  }, [voicedMidiNotes, pitchClasses, chordName]);

  if (!model) {
    return (
      <div className={styles.errorBadge} role="status" aria-live="polite">
        Chart unavailable
      </div>
    );
  }

  const clefLabel = model.clef === "treble" ? "G clef" : "F clef";
  const clefShortLabel = model.clef === "treble" ? "Treble" : "Bass";
  const descriptionText = `${chordName}, ${clefLabel}, ${describeVoicing(model.layout)}`;
  const ariaLabel = `${chordName} staff chart: ${describeVoicing(model.layout)}`;
  const staffLines = [14, 24, 34, 44, 54];

  return (
    <div className={`${styles.chartWrap} ${density === "comfortable" ? styles.chartComfortable : styles.chartCompact}`}>
      <svg
        className={styles.chart}
        viewBox="0 0 176 66"
        role="img"
        aria-label={ariaLabel}
        aria-describedby={descriptionId}
      >
        {staffLines.map((y) => (
          <line key={`line-${y}`} x1={26} y1={y} x2={170} y2={y} className={styles.staffLine} />
        ))}
        <text x={4} y={31} className={styles.clefLabel}>{clefShortLabel}</text>
        {model.layout.map((note) => (
          <g key={`${note.midi}-${note.x}`}>
            {note.ledgerLineYs.map((ledgerY) => (
              <line
                key={`${note.midi}-${ledgerY}`}
                x1={note.x - 8}
                y1={ledgerY}
                x2={note.x + 8}
                y2={ledgerY}
                className={styles.ledgerLine}
              />
            ))}
            {note.accidental && (
              <text x={note.x - 12} y={note.y + 3} className={styles.accidental}>{note.accidental}</text>
            )}
            <ellipse cx={note.x} cy={note.y} rx={5.6} ry={4.2} className={styles.notehead} />
          </g>
        ))}
      </svg>
      {descriptionId && (
        <p id={descriptionId} className={styles.srOnly}>{descriptionText}</p>
      )}
    </div>
  );
}
