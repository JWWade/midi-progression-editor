import { createContext } from 'react';
import type { TutorialContextValue } from '../types';

export const MISSING_TUTORIAL_PROVIDER = {} as TutorialContextValue;

export const TutorialContext = createContext<TutorialContextValue>(
  MISSING_TUTORIAL_PROVIDER,
);
