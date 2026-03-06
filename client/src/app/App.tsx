import { useState, useCallback } from 'react';
import { ChromaticCircle } from '../features/chromatic-circle';
import { CurrentChordPanel, type Chord } from '../features/current-chord';
import { ProgressionSidebar, type ProgressionEntry } from '../features/progression';

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
      <ProgressionSidebar progression={progression} />
    </main>
  );
}
