import { createContext } from "react";

export interface EnharmonicContextValue {
  useFlats: boolean;
  pitchClasses: readonly string[];
  toggleEnharmonic: () => void;
}

export const EnharmonicContext = createContext<EnharmonicContextValue | null>(null);
