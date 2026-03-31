// Public API for the tutorial feature

export type {
  TutorialStep,
  TutorialDefinition,
  TutorialTrigger,
  TutorialAppContext,
  TutorialContextValue,
  TutorialPersistedState,
  TutorialCondition,
  TutorialUIType,
} from './types';

export { TutorialContext, MISSING_TUTORIAL_PROVIDER } from './context/TutorialContext';
export { TutorialProvider } from './context/TutorialProvider';
export { useTutorial } from './hooks/useTutorial';
export { TUTORIAL_CONTENT_VERSION, ALL_TUTORIAL_STEPS } from './data/tutorials';
export { resolveActiveStep, evaluateTrigger } from './utils/triggerManager';
export type { TriggerContext } from './utils/triggerManager';
