import type { Chord } from "@/features/current-chord/types";
import type { ScaleContext } from "@/shared/types/ScaleContext";
import { useMidiExport } from "../hooks/useMidiExport";
import { getBpmTempoLabel } from "../utils/bpmTempoLabel";
import { NoteValueSelector } from "./NoteValueSelector";
import { exportSnapshot } from "@/features/progression-sidebar/utils/snapshotIO";
import styles from "./MidiExportControls.module.css";

interface MidiExportControlsProps {
  chords: Chord[];
  disabled: boolean;
  scaleContext: ScaleContext | null;
}

export function MidiExportControls({ chords, disabled, scaleContext }: MidiExportControlsProps) {
  const { bpm, setBpm, beatsPerChord, setBeatsPerChord, exportMidi } =
    useMidiExport(chords);

  const bpmFillPct = `${((bpm - 40) / (240 - 40)) * 100}%`;

  function handleExportJson() {
    const json = exportSnapshot(chords, scaleContext, { bpm, beatsPerChord });
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "progression.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className={styles.exportControls}>
      <div className={styles.bpmRow}>
        <div className={styles.bpmHeader}>
          <label className={styles.label} htmlFor="midi-bpm">
            BPM
          </label>
          <span className={styles.bpmValue}>
            <span className={styles.bpmNumber}>{bpm}</span>
            <span className={styles.tempoLabel}>{getBpmTempoLabel(bpm)}</span>
          </span>
        </div>
        <input
          id="midi-bpm"
          className={styles.bpmSlider}
          type="range"
          min={40}
          max={240}
          step={1}
          value={bpm}
          style={{
            background: `linear-gradient(to right, var(--color-accent, #6366f1) ${bpmFillPct}, var(--color-border-subtle, #2a2a4a) ${bpmFillPct})`,
          }}
          onChange={(e) => setBpm(e.target.valueAsNumber)}
          aria-valuemin={40}
          aria-valuemax={240}
          aria-valuenow={bpm}
          aria-valuetext={`${bpm} BPM — ${getBpmTempoLabel(bpm)}`}
        />
      </div>
      <div className={styles.row}>
        <span className={styles.label}>Beats / chord</span>
        <NoteValueSelector value={beatsPerChord} onChange={setBeatsPerChord} />
      </div>
      <button
        className={styles.exportButton}
        onClick={exportMidi}
        disabled={disabled}
        aria-disabled={disabled}
        aria-label={disabled ? "Export as MIDI file (add chords first)" : "Export progression as MIDI file"}
        title={disabled ? "Add chords to export" : "Export as MIDI file"}
      >
        Export .mid
      </button>
      <button
        className={styles.exportButton}
        onClick={handleExportJson}
        disabled={disabled}
        aria-disabled={disabled}
        aria-label={disabled ? "Export as JSON (add chords first)" : "Export progression as JSON"}
        title={disabled ? "Add chords to export" : "Export as JSON"}
      >
        Export JSON
      </button>
    </div>
  );
}
