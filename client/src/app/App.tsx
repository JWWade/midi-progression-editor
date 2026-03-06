import { useState, useCallback } from 'react';
import { ChromaticCircle } from '../features/chromatic-circle';
import { CurrentChordPanel, type Chord } from '../features/current-chord';
import { PITCH_CLASSES } from '../features/chromatic-circle/utils';
import { ChordQualityColors } from '../features/chord/constants/chordQualityColors';
import { CHORD_QUALITY_LABELS } from '../features/current-chord/utils/chordName';
import { getChordNoteIndices } from '../features/chord/utils/transpose';
import { ChordThumbnail } from '../features/current-chord/components/ChordThumbnail';

interface ProgressionEntry {
  id: string;
  chord: Chord;
}

const PROGRESSION_TILE_THUMBNAIL_SIZE = 40;
const PROGRESSION_TILE_MIN_WIDTH = 64;

export default function App() {
  const [currentChord, setCurrentChord] = useState<Chord | null>(null);
  const [progression, setProgression] = useState<ProgressionEntry[]>([]);

  const handleCurrentChordChange = useCallback((chord: Chord) => {
    setCurrentChord(chord);
  }, []);

  const handleAddChord = useCallback(() => {
    if (currentChord === null) return;
    const entry: ProgressionEntry = { id: `${Date.now()}-${Math.random()}`, chord: currentChord };
    setProgression((prev) => [...prev, entry]);
    setCurrentChord(null);
  }, [currentChord]);

  return (
    <main style={{ display: 'grid', placeItems: 'center', minHeight: '100vh', padding: '2rem 1rem', boxSizing: 'border-box' }}>
      <h1>Hello World</h1>
      <CurrentChordPanel chord={currentChord} onAddChord={handleAddChord} />
      <ChromaticCircle onCurrentChordChange={handleCurrentChordChange} />
      {progression.length > 0 && (
        <div
          aria-label="Chord progression"
          style={{
            marginTop: '1.5rem',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '8px',
            justifyContent: 'center',
          }}
        >
          {progression.map((entry, i) => {
            const colors = ChordQualityColors[entry.chord.quality];
            const noteIndices = getChordNoteIndices(entry.chord.root, entry.chord.quality);
            return (
              <div key={entry.id} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                {i > 0 && (
                  <span style={{ color: '#9ca3af', fontSize: '16px', fontWeight: 'bold' }}>→</span>
                )}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    backgroundColor: colors.light,
                    border: `1.5px solid ${colors.base}`,
                    minWidth: `${PROGRESSION_TILE_MIN_WIDTH}px`,
                  }}
                >
                  <ChordThumbnail noteIndices={noteIndices} quality={entry.chord.quality} size={PROGRESSION_TILE_THUMBNAIL_SIZE} />
                  <span style={{ fontSize: '12px', fontWeight: '700', color: colors.dark }}>
                    {PITCH_CLASSES[entry.chord.root]}
                  </span>
                  <span style={{ fontSize: '10px', color: colors.dark, opacity: 0.75 }}>
                    {CHORD_QUALITY_LABELS[entry.chord.quality]}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
