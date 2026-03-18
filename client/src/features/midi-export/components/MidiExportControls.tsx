import type { Chord } from "@/features/current-chord/types";
import { useMidiExport } from "../hooks/useMidiExport";
import styles from "./MidiExportControls.module.css";

interface MidiExportControlsProps {
  chords: Chord[];
  disabled: boolean;
}

export function MidiExportControls({ chords, disabled }: MidiExportControlsProps) {
  const { bpm, setBpm, beatsPerChord, setBeatsPerChord, startOctave, setStartOctave, exportMidi } =
    useMidiExport(chords);

  return (
    <div className={styles.exportControls}>
      <div className={styles.row}>
        <label className={styles.label} htmlFor="midi-bpm">
          BPM
        </label>
        <input
          id="midi-bpm"
          className={styles.input}
          type="number"
          min={40}
          max={240}
          step={1}
          value={bpm}
          onChange={(e) => {
            const v = e.target.valueAsNumber;
            if (!isNaN(v) && v >= 40 && v <= 240) setBpm(v);
          }}
        />
      </div>
      <div className={styles.row}>
        <label className={styles.label} htmlFor="midi-octave">
          Octave
        </label>
        <select
          id="midi-octave"
          className={styles.select}
          value={startOctave}
          onChange={(e) => setStartOctave(Number(e.target.value))}
        >
          <option value={2}>2</option>
          <option value={3}>3</option>
          <option value={4}>4</option>
          <option value={5}>5</option>
          <option value={6}>6</option>
        </select>
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
