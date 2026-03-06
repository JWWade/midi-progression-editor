import { useState, useCallback } from 'react';
import { ChromaticCircle } from '../features/chromatic-circle';
import { CurrentChordPanel, type Chord } from '../features/current-chord';

interface ProgressionEntry {
  id: string;
  chord: Chord;
}

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
        <div aria-label="Chord progression" style={{ marginTop: '1rem', fontSize: '14px', color: '#6b7280' }}>
          Progression: {progression.map((entry, i) => (
            <span key={entry.id}>{i > 0 ? ' → ' : ''}{entry.chord.root}/{entry.chord.quality}</span>
          ))}
        </div>
      )}
    </main>
  );
}
