import { createContext } from "react";

export interface EnharmonicContextValue {
  useFlats: boolean;
  pitchClasses: readonly string[];
  toggleEnharmonic: () => void;
}

export const MISSING_ENHARMONIC_PROVIDER = {} as EnharmonicContextValue;

export const EnharmonicContext = createContext<EnharmonicContextValue>(MISSING_ENHARMONIC_PROVIDER);
