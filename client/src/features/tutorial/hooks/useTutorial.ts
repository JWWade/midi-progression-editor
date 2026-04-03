import { useContext } from 'react';
import { TutorialContext, MISSING_TUTORIAL_PROVIDER } from '../context/TutorialContext';
import type { TutorialContextValue } from '../types';

/**
 * Returns the tutorial engine context.  Must be called inside a component
 * tree that is wrapped with `<TutorialProvider>`.
 *
 * Feature modules can use the returned `fireEvent` and `updateAppContext`
 * functions to feed real-time events and state into the tutorial engine:
 *
 * ```tsx
 * const { fireEvent } = useTutorial();
 * // ...
 * fireEvent('chordAdded');        // action trigger
 * updateAppContext({ progressionLength: chords.length }); // state trigger
 * ```
 */
export function useTutorial(): TutorialContextValue {
  const ctx = useContext(TutorialContext);
  if (ctx === MISSING_TUTORIAL_PROVIDER) {
    throw new Error('useTutorial must be used within a TutorialProvider');
  }
  return ctx;
}
