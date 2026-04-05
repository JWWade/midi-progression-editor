import { useEffect, useState } from 'react';
import type { Chord } from '@/features/current-chord/types';
import type { ScaleType } from '@/features/scale/types';
import { SCALE_LABELS } from '@/features/scale/types';
import type { AudioParams } from '@/features/audio/constants/audioConfig';
import { getChordPitchClasses } from '@/features/chord/utils/getChordPitchClasses';
import { formatChordName } from '@/features/current-chord/utils/chordName';
import { useEnharmonic } from '@/app/providers/useEnharmonic';
import styles from './DevDiagnosticsPanel.module.css';

interface DevDiagnosticsPanelProps {
  currentChord: Chord | null;
  keyRoot: number;
  keyScale: ScaleType;
  progressionLength: number;
  maxProgressionLength: number;
  audioParams: AudioParams;
  isPlaying: boolean;
  playingIndex: number | null;
}

/**
 * Dev-only floating panel that surfaces internal app state for diagnostics.
 * Rendered only when `import.meta.env.DEV` is true; tree-shaken in production.
 */
export function DevDiagnosticsPanel({
  currentChord,
  keyRoot,
  keyScale,
  progressionLength,
  maxProgressionLength,
  audioParams,
  isPlaying,
  playingIndex,
}: DevDiagnosticsPanelProps) {
  const { pitchClasses } = useEnharmonic();
  const [isExpanded, setIsExpanded] = useState(false);

  // Toggle panel with keyboard shortcut `Alt+D`.
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key === 'd') {
        setIsExpanded((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const chordName = currentChord
    ? formatChordName(currentChord, pitchClasses)
    : '—';

  const chordNotes: string =
    currentChord != null
      ? getChordPitchClasses(currentChord)
          .map((i) => pitchClasses[i])
          .join('  ')
      : '—';

  const keyLabel = `${pitchClasses[keyRoot]} ${SCALE_LABELS[keyScale]}`;

  if (!isExpanded) {
    return (
      <div className={styles.collapsed}>
        <button
          type="button"
          className={styles.toggleBtn}
          onClick={() => setIsExpanded(true)}
          title="Open Dev Diagnostics (Alt+D)"
          aria-label="Open dev diagnostics panel"
        >
          ⚙ Dev
        </button>
      </div>
    );
  }

  return (
    <aside className={styles.panel} aria-label="Dev diagnostics panel">
      <div className={styles.header}>
        <span className={styles.title}>⚙ Dev Diagnostics</span>
        <button
          type="button"
          className={styles.closeBtn}
          onClick={() => setIsExpanded(false)}
          title="Close Dev Diagnostics (Alt+D)"
          aria-label="Close dev diagnostics panel"
        >
          ×
        </button>
      </div>

      <dl className={styles.body}>
        <div className={styles.section}>
          <dt className={styles.sectionLabel}>Chord</dt>
          <dd className={styles.row}>
            <span className={styles.key}>Name</span>
            <span className={styles.value}>{chordName}</span>
          </dd>
          <dd className={styles.row}>
            <span className={styles.key}>Notes</span>
            <span className={styles.value}>{chordNotes}</span>
          </dd>
        </div>

        <div className={styles.section}>
          <dt className={styles.sectionLabel}>Key</dt>
          <dd className={styles.row}>
            <span className={styles.key}>Scale</span>
            <span className={styles.value}>{keyLabel}</span>
          </dd>
        </div>

        <div className={styles.section}>
          <dt className={styles.sectionLabel}>Progression</dt>
          <dd className={styles.row}>
            <span className={styles.key}>Length</span>
            <span className={styles.value}>
              {progressionLength} / {maxProgressionLength}
            </span>
          </dd>
          <dd className={styles.row}>
            <span className={styles.key}>Playback</span>
            <span className={styles.value}>
              {isPlaying
                ? `Playing slot ${(playingIndex ?? 0) + 1}`
                : 'Stopped'}
            </span>
          </dd>
        </div>

        <div className={styles.section}>
          <dt className={styles.sectionLabel}>Audio</dt>
          <dd className={styles.row}>
            <span className={styles.key}>Waveform</span>
            <span className={styles.value}>{audioParams.oscillatorType}</span>
          </dd>
          <dd className={styles.row}>
            <span className={styles.key}>Volume</span>
            <span className={styles.value}>{audioParams.masterVolume.toFixed(2)}</span>
          </dd>
          <dd className={styles.row}>
            <span className={styles.key}>Attack peak</span>
            <span className={styles.value}>{audioParams.attackPeak.toFixed(2)}</span>
          </dd>
          <dd className={styles.row}>
            <span className={styles.key}>Attack time</span>
            <span className={styles.value}>{audioParams.attackTime.toFixed(3)} s</span>
          </dd>
          <dd className={styles.row}>
            <span className={styles.key}>Decay time</span>
            <span className={styles.value}>{audioParams.decayTime.toFixed(3)} s</span>
          </dd>
          <dd className={styles.row}>
            <span className={styles.key}>Sustain</span>
            <span className={styles.value}>{audioParams.sustainLevel.toFixed(2)}</span>
          </dd>
          <dd className={styles.row}>
            <span className={styles.key}>Release time</span>
            <span className={styles.value}>{audioParams.releaseTime.toFixed(3)} s</span>
          </dd>
          <dd className={styles.row}>
            <span className={styles.key}>Scale gain</span>
            <span className={styles.value}>{audioParams.scaleGainByNoteCount ? 'yes' : 'no'}</span>
          </dd>
          <dd className={styles.row}>
            <span className={styles.key}>Comp. threshold</span>
            <span className={styles.value}>
              {isFinite(audioParams.compressorThreshold)
                ? `${audioParams.compressorThreshold} dB`
                : 'off'}
            </span>
          </dd>
          <dd className={styles.row}>
            <span className={styles.key}>Comp. ratio</span>
            <span className={styles.value}>{audioParams.compressorRatio}:1</span>
          </dd>
        </div>
      </dl>
    </aside>
  );
}
