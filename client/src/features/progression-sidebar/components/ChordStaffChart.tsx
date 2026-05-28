import { useMemo } from "react";
import { buildStaffNoteLayout, pickStaffClef } from "../utils/staffMapping";
import styles from "./ChordStaffChart.module.css";

interface ChordStaffChartProps {
  chordName: string;
  voicedMidiNotes: number[] | null;
  pitchClasses: readonly string[];
  descriptionId?: string;
}

function describeVoicing(layout: ReturnType<typeof buildStaffNoteLayout>): string {
  return layout.map((note) => note.noteLabel).join(" ");
}

export function ChordStaffChart({ chordName, voicedMidiNotes, pitchClasses, descriptionId }: ChordStaffChartProps) {
  const model = useMemo(() => {
    if (!voicedMidiNotes || voicedMidiNotes.length === 0) return null;
    const clef = pickStaffClef(voicedMidiNotes);
    const layout = buildStaffNoteLayout(voicedMidiNotes, pitchClasses, clef);
    if (layout.length === 0) return null;
    return { clef, layout };
  }, [voicedMidiNotes, pitchClasses]);

  if (!model) {
    return (
      <div className={styles.errorBadge} role="status" aria-live="polite">
        Chart unavailable
      </div>
    );
  }

  const clefLabel = model.clef === "treble" ? "G clef" : "F clef";
  const descriptionText = `${chordName}, ${clefLabel}, ${describeVoicing(model.layout)}`;
  const ariaLabel = `${chordName} staff chart: ${describeVoicing(model.layout)}`;
  const staffLines = [12, 22, 32, 42, 52];

  return (
    <div className={styles.chartWrap}>
      <svg
        className={styles.chart}
        viewBox="0 0 150 64"
        role="img"
        aria-label={ariaLabel}
        aria-describedby={descriptionId}
      >
        {staffLines.map((y) => (
          <line key={`line-${y}`} x1={18} y1={y} x2={146} y2={y} className={styles.staffLine} />
        ))}
        <text x={2} y={26} className={styles.clefLabel}>{clefLabel}</text>
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
