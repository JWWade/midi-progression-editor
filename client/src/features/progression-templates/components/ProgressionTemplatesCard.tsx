import { memo, useMemo } from "react";
import { useEnharmonic } from "@/app/providers/useEnharmonic";
import { formatChordName } from "@/features/current-chord";
import type { Chord } from "@/features/current-chord/types";
import type { ScaleType } from "@/features/scale/types";
import {
  buildMajorOneFiveSixFour,
  buildMajorOneFourFive,
  buildMajorTwoFiveOne,
} from "../utils/buildMajorProgression";
import styles from "./ProgressionTemplatesCard.module.css";

interface ProgressionTemplatesCardProps {
  keyRoot: number;
  keyScale: ScaleType;
  progressionLength: number;
  maxProgressionLength: number;
  onAddTwoFiveOne: () => void;
  onAddOneFourFive: () => void;
  onAddOneFiveSixFour: () => void;
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
  onAddOneFiveSixFour,
}: ProgressionTemplatesCardProps) {
  const { pitchClasses } = useEnharmonic();

  const twoFiveOne = useMemo(() => buildMajorTwoFiveOne(keyRoot, keyScale), [keyRoot, keyScale]);
  const oneFourFive = useMemo(() => buildMajorOneFourFive(keyRoot, keyScale), [keyRoot, keyScale]);
  const oneFiveSixFour = useMemo(() => buildMajorOneFiveSixFour(keyRoot, keyScale), [keyRoot, keyScale]);
  const remainingSlots = maxProgressionLength - progressionLength;
  const twoFiveOneHasCapacity = remainingSlots >= twoFiveOne.chords.length;
  const oneFourFiveHasCapacity = remainingSlots >= oneFourFive.chords.length;
  const oneFiveSixFourHasCapacity = remainingSlots >= oneFiveSixFour.chords.length;

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
  const oneFiveSixFourPreview = toPreview("I-V-vi-IV", oneFiveSixFour.chords, oneFiveSixFour.supported);

  const blockedRequirement = [
    { supported: twoFiveOne.supported, hasCapacity: twoFiveOneHasCapacity, required: twoFiveOne.chords.length },
    { supported: oneFourFive.supported, hasCapacity: oneFourFiveHasCapacity, required: oneFourFive.chords.length },
    { supported: oneFiveSixFour.supported, hasCapacity: oneFiveSixFourHasCapacity, required: oneFiveSixFour.chords.length },
  ]
    .filter((template) => template.supported && !template.hasCapacity)
    .reduce((max, template) => Math.max(max, template.required), 0);

  const helperText = !twoFiveOne.supported || !oneFourFive.supported || !oneFiveSixFour.supported
    ? "Available in major mode only for now."
    : blockedRequirement > 0
      ? `Need ${blockedRequirement} open slots (${remainingSlots} remaining).`
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
      <TemplateRow
        name="I-V-vi-IV"
        preview={oneFiveSixFourPreview}
        disabled={!oneFiveSixFour.supported || !oneFiveSixFourHasCapacity}
        onAdd={onAddOneFiveSixFour}
        ariaLabel="Add I-V-vi-IV progression"
      />

      <p className={styles.helperText} role="status">{helperText}</p>
    </section>
  );
});
