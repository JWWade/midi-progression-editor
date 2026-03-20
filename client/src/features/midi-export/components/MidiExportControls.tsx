import type { Chord } from "@/features/current-chord/types";
import { useMidiExport } from "../hooks/useMidiExport";
import { getBpmTempoLabel } from "../utils/bpmTempoLabel";
import styles from "./MidiExportControls.module.css";

interface MidiExportControlsProps {
  chords: Chord[];
  disabled: boolean;
}

export function MidiExportControls({ chords, disabled }: MidiExportControlsProps) {
  const { bpm, setBpm, beatsPerChord, setBeatsPerChord, exportMidi } =
    useMidiExport(chords);

  const bpmFillPct = `${((bpm - 40) / (240 - 40)) * 100}%`;

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
        <label className={styles.label} htmlFor="midi-beats">
          Beats / chord
        </label>
        <select
          id="midi-beats"
          className={styles.select}
          value={beatsPerChord}
          onChange={(e) => setBeatsPerChord(Number(e.target.value))}
        >
          <option value={1}>1</option>
          <option value={2}>2</option>
          <option value={4}>4</option>
        </select>
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
    </div>
  );
}
