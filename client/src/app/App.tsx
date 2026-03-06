import { useState, useCallback } from 'react';
import { ChromaticCircle } from '../features/chromatic-circle';
import { CurrentChordPanel, type Chord } from '../features/current-chord';

export default function App() {
  const [currentChord, setCurrentChord] = useState<Chord | null>(null);

  const handleCurrentChordChange = useCallback((chord: Chord) => {
    setCurrentChord(chord);
  }, []);

  return (
    <main style={{ display: 'grid', placeItems: 'center', minHeight: '100vh', padding: '2rem 1rem', boxSizing: 'border-box' }}>
      <h1>Hello World</h1>
      <CurrentChordPanel chord={currentChord} />
      <ChromaticCircle onCurrentChordChange={handleCurrentChordChange} />
    </main>
  );
}
