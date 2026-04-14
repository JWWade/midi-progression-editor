import { memo, useCallback } from "react";
import type { ScaleType } from "@/features/scale/types";
import { SCALE_LABELS } from "@/features/scale/types";
import { useEnharmonic } from "@/app/providers/useEnharmonic";
import { ModePersonalityPanel } from "./ModePersonalityPanel";
import styles from "./KeyContextPanel.module.css";

/** All 12 chromatic pitch classes as sharp names (index = pitch class). */
const SHARP_ROOTS = ["C", "C♯", "D", "D♯", "E", "F", "F♯", "G", "G♯", "A", "A♯", "B"] as const;
const FLAT_ROOTS  = ["C", "D♭", "D", "E♭", "E", "F", "G♭", "G", "A♭", "A", "B♭", "B"] as const;

/** Mode labels with common-name aliases for Ionian and Aeolian. */
const MODE_DISPLAY_LABELS: Record<ScaleType, string> = {
  major:         "Major (Ionian)",
  naturalMinor:  "Minor (Aeolian)",
  harmonicMinor: SCALE_LABELS.harmonicMinor,
  melodicMinor:  SCALE_LABELS.melodicMinor,
  dorian:        SCALE_LABELS.dorian,
  phrygian:      SCALE_LABELS.phrygian,
  lydian:        SCALE_LABELS.lydian,
  mixolydian:    SCALE_LABELS.mixolydian,
};

const SCALE_TYPES: ScaleType[] = Object.keys(MODE_DISPLAY_LABELS) as ScaleType[];

export interface SetKeyContextAction {
  root: number;
  scale: ScaleType;
  source: "panel" | "tonicSnap" | "snapshot" | "startup";
}

interface KeyContextPanelProps {
  keyRoot: number;
  keyScale: ScaleType;
  /** Current chord root — used by the secondary tonic-snap affordance. */
  currentChordRoot: number | null;
  onSetKeyContext: (action: SetKeyContextAction) => void;
}

export const KeyContextPanel = memo(function KeyContextPanel({
  keyRoot,
  keyScale,
  currentChordRoot,
  onSetKeyContext,
}: KeyContextPanelProps) {
  const { useFlats } = useEnharmonic();
  const rootNames = useFlats ? FLAT_ROOTS : SHARP_ROOTS;

  const handleRootChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      onSetKeyContext({ root: Number(e.target.value), scale: keyScale, source: "panel" });
    },
    [onSetKeyContext, keyScale],
  );

  const handleScaleChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      onSetKeyContext({ root: keyRoot, scale: e.target.value as ScaleType, source: "panel" });
    },
    [onSetKeyContext, keyRoot],
  );

  const handleSetToChord = useCallback(() => {
    if (currentChordRoot === null) return;
    onSetKeyContext({ root: currentChordRoot, scale: keyScale, source: "tonicSnap" });
  }, [onSetKeyContext, currentChordRoot, keyScale]);

  return (
    <section className={styles.panel} aria-label="Key context">
      <span className={styles.label}>Context Settings</span>
      <div className={styles.selectors}>
        <select
          id="key-root-select"
          className={styles.select}
          value={keyRoot}
          onChange={handleRootChange}
          aria-label="Key root note"
          title="Key root note"
        >
          {rootNames.map((name, idx) => (
            <option key={idx} value={idx}>{name}</option>
          ))}
        </select>

        <select
          id="key-mode-select"
          className={styles.select}
          value={keyScale}
          onChange={handleScaleChange}
          aria-label="Key mode"
          title="Key mode"
        >
          {SCALE_TYPES.map((mode) => (
            <option key={mode} value={mode}>{MODE_DISPLAY_LABELS[mode]}</option>
          ))}
        </select>
      </div>

      <button
        type="button"
        className={styles.tonicSnapButton}
        onClick={handleSetToChord}
        disabled={currentChordRoot === null}
        aria-label="Set key root to current chord root"
        title="Set key root to current chord root"
      >
        Set to chord
      </button>

      <ModePersonalityPanel scaleType={keyScale} />
    </section>
  );
});
