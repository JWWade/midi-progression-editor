import { useContext } from "react";
import { EnharmonicContext } from "./EnharmonicContext";
import type { EnharmonicContextValue } from "./EnharmonicContext";

export function useEnharmonic(): EnharmonicContextValue {
  const ctx = useContext(EnharmonicContext);
  if (!ctx) throw new Error("useEnharmonic must be used within an EnharmonicProvider");
  return ctx;
}
