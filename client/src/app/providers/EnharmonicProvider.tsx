import { useState, useEffect, useMemo, useCallback, type ReactNode } from "react";
import { EnharmonicContext } from "./EnharmonicContext";
import { PITCH_CLASSES, FLAT_PITCH_CLASSES } from "@/features/chromatic-circle/utils";

function getInitialUseFlats(): boolean {
  try {
    return localStorage.getItem("enharmonic") === "flats";
  } catch {
    // localStorage unavailable (e.g., SSR or restricted context)
  }
  return false;
}

export function EnharmonicProvider({ children }: { children: ReactNode }) {
  const [useFlats, setUseFlats] = useState<boolean>(getInitialUseFlats);

  useEffect(() => {
    try {
      localStorage.setItem("enharmonic", useFlats ? "flats" : "sharps");
    } catch {
      // ignore
    }
  }, [useFlats]);

  const toggleEnharmonic = useCallback(() => setUseFlats((f) => !f), []);

  const value = useMemo(
    () => ({
      useFlats,
      pitchClasses: useFlats ? FLAT_PITCH_CLASSES : PITCH_CLASSES,
      toggleEnharmonic,
    }),
    [useFlats, toggleEnharmonic],
  );

  return (
    <EnharmonicContext.Provider value={value}>
      {children}
    </EnharmonicContext.Provider>
  );
}
