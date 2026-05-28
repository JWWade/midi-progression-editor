import { useEffect, useRef, useState } from "react";
import type { Chord } from "@/features/current-chord/types";
import type { ScaleContext } from "@/shared/types/ScaleContext";
import type { ArpeggioPattern } from "@/features/audio/types/arpeggioPattern";
import type { VoiceLeadingConfig } from "@/features/voice-leading";
import { buildVoicingTargets, hasExtensionRegisterTargets } from "@/features/voice-leading";
import { useMidiExport } from "../hooks/useMidiExport";
import { getBpmTempoLabel } from "../utils/bpmTempoLabel";
import { NoteValueSelector } from "./NoteValueSelector";
import { VoiceLeadingPanel } from "@/features/voice-leading/components/VoiceLeadingPanel";
import { exportSnapshot } from "@/features/progression-sidebar/utils/snapshotIO";
import styles from "./MidiExportControls.module.css";

interface MidiExportControlsProps {
  chords: Chord[];
  disabled: boolean;
  scaleContext: ScaleContext | null;
  /** When provided, MIDI export uses arpeggiated note sequences. */
  arpeggioPattern?: ArpeggioPattern;
  bpm: number;
  setBpm: (v: number) => void;
  beatsPerChord: number;
  setBeatsPerChord: (v: number) => void;
  onVoiceLeadingConfigChange?: (config: VoiceLeadingConfig) => void;
}

export function MidiExportControls({ chords, disabled, scaleContext, arpeggioPattern, bpm, setBpm, beatsPerChord, setBeatsPerChord, onVoiceLeadingConfigChange }: MidiExportControlsProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const {
    exportMidi,
    startOctave,
    setStartOctave,
    voiceLeadingStyle,
    setVoiceLeadingStyle,
    strictness,
    motionBias,
    setMotionBias,
    extensionRegisterPolicy,
    setExtensionRegisterPolicy,
  } = useMidiExport(chords, arpeggioPattern, scaleContext, bpm, beatsPerChord);

  const extensionGuardActive = chords.some((chord) => hasExtensionRegisterTargets(buildVoicingTargets(chord)));

  useEffect(() => {
    if (!onVoiceLeadingConfigChange) return;
    onVoiceLeadingConfigChange({
      style: voiceLeadingStyle,
      strictness,
      motionBias,
      startOctave,
      extensionRegisterPolicy,
    });
  }, [onVoiceLeadingConfigChange, voiceLeadingStyle, strictness, motionBias, startOctave, extensionRegisterPolicy]);

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

  function handleJsonOption() {
    setDropdownOpen(false);
    handleExportJson();
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
      <VoiceLeadingPanel
        style={voiceLeadingStyle}
        onStyleChange={setVoiceLeadingStyle}
        motionBias={motionBias}
        onMotionBiasChange={setMotionBias}
        extensionRegisterPolicy={extensionRegisterPolicy}
        onExtensionRegisterPolicyChange={setExtensionRegisterPolicy}
        extensionGuardActive={extensionGuardActive}
        startOctave={startOctave}
        onStartOctaveChange={setStartOctave}
      />
      <div
        className={styles.splitButton}
        ref={dropdownRef}
        onBlur={(e) => {
          if (!dropdownRef.current?.contains(e.relatedTarget as Node)) {
            setDropdownOpen(false);
          }
        }}
      >
        <button
          className={styles.exportButtonMain}
          onClick={exportMidi}
          disabled={disabled}
          aria-disabled={disabled}
          aria-label={disabled ? "Export as MIDI file (add chords first)" : "Export progression as MIDI file"}
          title={disabled ? "Add chords to export" : "Export as MIDI file"}
        >
          Export .mid
        </button>
        <button
          className={styles.exportButtonChevron}
          onClick={() => setDropdownOpen((v) => !v)}
          disabled={disabled}
          aria-disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={dropdownOpen}
          aria-label="More export options"
          title="More export options"
        >
          ▾
        </button>
        {dropdownOpen && (
          <ul className={styles.dropdownMenu} role="listbox" aria-label="Export format">
            <li
              className={styles.dropdownItem}
              role="option"
              aria-selected={false}
              tabIndex={0}
              onClick={handleJsonOption}
              onKeyDown={(e) => e.key === 'Enter' && handleJsonOption()}
            >
              Export JSON
            </li>
          </ul>
        )}
      </div>
    </div>
  );
}
