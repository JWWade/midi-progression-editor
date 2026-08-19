import { memo, useMemo } from "react";
import { useEnharmonic } from "@/app/providers/useEnharmonic";
import { formatChordName } from "@/features/current-chord";
import type { Chord } from "@/features/current-chord/types";
import type { ScaleType } from "@/features/scale/types";
import { buildMajorOneFourFive, buildMajorTwoFiveOne } from "../utils/buildMajorProgression";
import styles from "./ProgressionTemplatesCard.module.css";

interface ProgressionTemplatesCardProps {
  keyRoot: number;
  keyScale: ScaleType;
  progressionLength: number;
  maxProgressionLength: number;
  onAddTwoFiveOne: () => void;
  onAddOneFourFive: () => void;
}

interface TemplateRowProps {
  name: string;
  preview: string;
  disabled: boolean;
  onAdd: () => void;
  ariaLabel: string;
}

function TemplateRow({ name, preview, disabled, onAdd, ariaLabel }: TemplateRowProps) {
  return (
    <div className={styles.templateRow}>
      <div className={styles.templateInfo}>
        <span className={styles.templateName}>{name}</span>
        <span className={styles.templatePreview} aria-live="polite">{preview}</span>
      </div>
      <button
        type="button"
        className={styles.addButton}
        onClick={onAdd}
        disabled={disabled}
        aria-label={ariaLabel}
      >
        Add {name}
      </button>
    </div>
  );
}

export const ProgressionTemplatesCard = memo(function ProgressionTemplatesCard({
  keyRoot,
  keyScale,
  progressionLength,
  maxProgressionLength,
  onAddTwoFiveOne,
  onAddOneFourFive,
}: ProgressionTemplatesCardProps) {
  const { pitchClasses } = useEnharmonic();

  const twoFiveOne = useMemo(() => buildMajorTwoFiveOne(keyRoot, keyScale), [keyRoot, keyScale]);
  const oneFourFive = useMemo(() => buildMajorOneFourFive(keyRoot, keyScale), [keyRoot, keyScale]);
  const remainingSlots = maxProgressionLength - progressionLength;
  const twoFiveOneHasCapacity = remainingSlots >= twoFiveOne.chords.length;
  const oneFourFiveHasCapacity = remainingSlots >= oneFourFive.chords.length;

  const toPreview = (name: string, chords: Chord[], supported: boolean): string => {
    if (!supported || chords.length === 0) {
      return `${name} unavailable in this mode`;
    }

    return chords
      .map((chord) => formatChordName(chord, pitchClasses))
      .join(" -> ");
  };

  const twoFiveOnePreview = toPreview("ii-V-I", twoFiveOne.chords, twoFiveOne.supported);
  const oneFourFivePreview = toPreview("I-IV-V", oneFourFive.chords, oneFourFive.supported);

  const helperText = !twoFiveOne.supported || !oneFourFive.supported
    ? "Available in major mode only for now."
    : !twoFiveOneHasCapacity || !oneFourFiveHasCapacity
      ? `Need 3 open slots (${remainingSlots} remaining).`
      : "Adds triads only (no 7th extensions).";

  return (
    <section className={styles.panel} aria-label="Progression templates">
      <div className={styles.headerRow}>
        <h3 className={styles.title}>Progression Templates</h3>
      </div>

      <TemplateRow
        name="ii-V-I"
        preview={twoFiveOnePreview}
        disabled={!twoFiveOne.supported || !twoFiveOneHasCapacity}
        onAdd={onAddTwoFiveOne}
        ariaLabel="Add ii-V-I progression"
      />
      <TemplateRow
        name="I-IV-V"
        preview={oneFourFivePreview}
        disabled={!oneFourFive.supported || !oneFourFiveHasCapacity}
        onAdd={onAddOneFourFive}
        ariaLabel="Add I-IV-V progression"
      />

      <p className={styles.helperText} role="status">{helperText}</p>
    </section>
  );
});
