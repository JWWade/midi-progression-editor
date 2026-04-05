import { useState, useCallback, useRef } from 'react';
import { importSnapshot } from '../../features/progression-sidebar/utils/snapshotIO';
import type { Chord } from '../../features/current-chord';
import type { ScaleType } from '../../features/scale/types';

type SetKeyContext = (action: {
  root: number;
  scale: ScaleType;
  source: 'panel' | 'tonicSnap' | 'snapshot' | 'startup';
}) => void;

export function useFileImport(
  setChords: (chords: Chord[]) => void,
  setKeyContext: SetKeyContext,
) {
  const [importError, setImportError] = useState<string | null>(null);
  const loadJsonInputRef = useRef<HTMLInputElement>(null);

  const handleLoadJsonClick = useCallback(() => {
    loadJsonInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      // Reset value so re-selecting the same file triggers onChange again
      e.target.value = '';

      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result;
        if (typeof text !== 'string') {
          setImportError('Failed to read file.');
          return;
        }
        const snapshot = importSnapshot(text);
        if (!snapshot) {
          setImportError(
            'Invalid session file. The file does not contain a valid progression snapshot.',
          );
          return;
        }
        setChords(snapshot.progression);
        if (snapshot.scaleContext) {
          setKeyContext({
            root: snapshot.scaleContext.root,
            scale: snapshot.scaleContext.mode,
            source: 'snapshot',
          });
        }
        setImportError(null);
      };
      reader.onerror = () => {
        setImportError('Failed to read file.');
      };
      reader.readAsText(file);
    },
    [setChords, setKeyContext],
  );

  const clearImportError = useCallback(() => {
    setImportError(null);
  }, []);

  return {
    importError,
    clearImportError,
    loadJsonInputRef,
    handleLoadJsonClick,
    handleFileChange,
  };
}
