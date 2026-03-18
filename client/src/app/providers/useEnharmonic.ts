import { useContext } from "react";
import { EnharmonicContext, MISSING_ENHARMONIC_PROVIDER } from "./EnharmonicContext";
import type { EnharmonicContextValue } from "./EnharmonicContext";

export function useEnharmonic(): EnharmonicContextValue {
  const ctx = useContext(EnharmonicContext);
  if (ctx === MISSING_ENHARMONIC_PROVIDER) {
    throw new Error("useEnharmonic must be used within an EnharmonicProvider");
  }
  return ctx;
}
