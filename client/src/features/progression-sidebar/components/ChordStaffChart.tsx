import { useMemo } from "react";
import { buildStaffNoteLayout, pickStaffClef } from "../utils/staffMapping";
import styles from "./ChordStaffChart.module.css";

interface ChordStaffChartProps {
  chordName: string;
  voicedMidiNotes: number[] | null;
  pitchClasses: readonly string[];
  noteNameOverridesByPitchClass?: Partial<Record<number, string>>;
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

function getAccidentalPosition(
  note: ReturnType<typeof buildStaffNoteLayout>[number],
  index: number,
  layout: ReturnType<typeof buildStaffNoteLayout>,
  density: "compact" | "comfortable",
): { x: number; y: number } {
  const previous = layout[index - 1];
  const next = layout[index + 1];
  const nearPrevious = previous
    ? Math.abs(note.x - previous.x) <= 16 && Math.abs(note.y - previous.y) <= 7
    : false;
  const nearNext = next
    ? Math.abs(note.x - next.x) <= 16 && Math.abs(note.y - next.y) <= 7
    : false;

  const inDenseCluster = nearPrevious || nearNext;
  const horizontalOffset = inDenseCluster ? 21 : 16;
  const verticalOffset = 0;

  const compactHorizontalTweak = density === "compact" ? 1.5 : 0;
  const noteheadCenterY = getNoteheadRenderY(note.y, density);

  return {
    x: note.x - horizontalOffset - compactHorizontalTweak,
    y: noteheadCenterY + verticalOffset,
  };
}

function buildAccidentalPositionMap(
  layout: ReturnType<typeof buildStaffNoteLayout>,
  density: "compact" | "comfortable",
): Map<number, { x: number; y: number }> {
  const candidates = layout
    .map((note, index) => ({
      index,
      note,
      pos: note.accidental ? getAccidentalPosition(note, index, layout, density) : null,
    }))
    .filter((entry): entry is { index: number; note: ReturnType<typeof buildStaffNoteLayout>[number]; pos: { x: number; y: number } } => entry.pos !== null)
    .sort((a, b) => a.pos.y - b.pos.y);

  const placed: Array<{ x: number; y: number }> = [];
  const positionMap = new Map<number, { x: number; y: number }>();

  for (const candidate of candidates) {
    let x = candidate.pos.x;
    const y = candidate.pos.y;

    for (const prev of placed) {
      const verticallyClose = Math.abs(y - prev.y) < 10;
      const horizontallyClose = Math.abs(x - prev.x) < 8;
      if (!verticallyClose || !horizontallyClose) {
        continue;
      }

      // Stagger leftward when accidentals would overlap in tight vertical clusters.
      x = prev.x - 7;
    }

    const resolved = { x, y };
    placed.push(resolved);
    positionMap.set(candidate.index, resolved);
  }

  return positionMap;
}

function getNoteheadRenderY(noteY: number, density: "compact" | "comfortable"): number {
  return density === "compact" ? noteY - 0.5 : noteY;
}

function getVerticalFitOffset(
  layout: ReturnType<typeof buildStaffNoteLayout>,
  density: "compact" | "comfortable",
): number {
  if (layout.length === 0) return 0;

  const SAFE_TOP = 6;
  const SAFE_BOTTOM = 78;
  const NOTEHEAD_RADIUS_Y = 4.2;
  const ACCIDENTAL_HALF_HEIGHT = 5;
  const accidentalPositionMap = buildAccidentalPositionMap(layout, density);

  const bounds = layout.reduce((acc, note, index) => {
    const noteheadY = getNoteheadRenderY(note.y, density);
    acc.min = Math.min(acc.min, noteheadY - NOTEHEAD_RADIUS_Y);
    acc.max = Math.max(acc.max, noteheadY + NOTEHEAD_RADIUS_Y);

    for (const ledgerY of note.ledgerLineYs) {
      acc.min = Math.min(acc.min, ledgerY);
      acc.max = Math.max(acc.max, ledgerY);
    }

    if (note.accidental) {
      const accidentalPos = accidentalPositionMap.get(index);
      if (!accidentalPos) return acc;
      acc.min = Math.min(acc.min, accidentalPos.y - ACCIDENTAL_HALF_HEIGHT);
      acc.max = Math.max(acc.max, accidentalPos.y + ACCIDENTAL_HALF_HEIGHT);
    }

    return acc;
  }, { min: Number.POSITIVE_INFINITY, max: Number.NEGATIVE_INFINITY });

  const currentRange = bounds.max - bounds.min;
  const safeRange = SAFE_BOTTOM - SAFE_TOP;

  if (currentRange >= safeRange) {
    const currentCenter = (bounds.min + bounds.max) / 2;
    const safeCenter = (SAFE_TOP + SAFE_BOTTOM) / 2;
    return safeCenter - currentCenter;
  }

  let offset = 0;
  if (bounds.min < SAFE_TOP) {
    offset = SAFE_TOP - bounds.min;
  }
  if (bounds.max + offset > SAFE_BOTTOM) {
    offset -= (bounds.max + offset) - SAFE_BOTTOM;
  }

  return offset;
}

export function ChordStaffChart({ chordName, voicedMidiNotes, pitchClasses, noteNameOverridesByPitchClass, density = "compact", descriptionId }: ChordStaffChartProps) {
  const model = useMemo(() => {
    if (!voicedMidiNotes || voicedMidiNotes.length === 0) return null;
    const clef = pickStaffClef(voicedMidiNotes);
    const accidentalPreference = inferAccidentalPreference(chordName, pitchClasses);
    const layout = buildStaffNoteLayout(
      voicedMidiNotes,
      pitchClasses,
      clef,
      accidentalPreference,
      noteNameOverridesByPitchClass,
    );
    if (layout.length === 0) return null;
    return { clef, layout };
  }, [voicedMidiNotes, pitchClasses, chordName, noteNameOverridesByPitchClass]);

  if (!model) {
    return (
      <div className={styles.errorBadge} role="status" aria-live="polite">
        Chart unavailable
      </div>
    );
  }

  const clefLabel = model.clef === "treble" ? "G clef" : "F clef";
  const clefSymbol = model.clef === "treble" ? "\uD834\uDD1E" : "\uD834\uDD22";
  const clefSymbolClassName = model.clef === "treble" ? styles.clefSymbolTreble : styles.clefSymbolBass;
  const descriptionText = `${chordName}, ${clefLabel}, ${describeVoicing(model.layout)}`;
  const ariaLabel = `${chordName} staff chart: ${describeVoicing(model.layout)}`;
  const verticalOffset = getVerticalFitOffset(model.layout, density);
  const renderedLayout = verticalOffset === 0
    ? model.layout
    : model.layout.map((note) => ({
      ...note,
      y: note.y + verticalOffset,
      ledgerLineYs: note.ledgerLineYs.map((ledgerY) => ledgerY + verticalOffset),
    }));
  const accidentalPositionMap = buildAccidentalPositionMap(renderedLayout, density);
  const staffLines = [14, 26, 38, 50, 62];

  return (
    <div className={`${styles.chartWrap} ${density === "comfortable" ? styles.chartComfortable : styles.chartCompact}`}>
      <svg
        className={styles.chart}
        viewBox="0 0 156 84"
        role="img"
        aria-label={ariaLabel}
        aria-describedby={descriptionId}
      >
        {staffLines.map((y) => (
          <line key={`line-${y}`} x1={24} y1={y} x2={150} y2={y} className={styles.staffLine} />
        ))}
        <text
          x={11.5}
          y={model.clef === "treble" ? 43 : 40}
          textAnchor="middle"
          className={`${styles.clefSymbol} ${clefSymbolClassName}`}
          aria-hidden="true"
        >
          {clefSymbol}
        </text>
        {renderedLayout.map((note, index) => {
          const accidentalPos = note.accidental ? accidentalPositionMap.get(index) ?? null : null;
          const noteheadY = getNoteheadRenderY(note.y, density);
          return (
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
              {note.accidental && accidentalPos && (
                <text
                  x={accidentalPos.x}
                  y={accidentalPos.y}
                  className={styles.accidental}
                  textAnchor="middle"
                  dominantBaseline="middle"
                >
                  {note.accidental}
                </text>
              )}
              <ellipse cx={note.x} cy={noteheadY} rx={5.6} ry={4.2} className={styles.notehead} />
            </g>
          );
        })}
      </svg>
      {descriptionId && (
        <p id={descriptionId} className={styles.srOnly}>{descriptionText}</p>
      )}
    </div>
  );
}
