import { useContext } from "react";
import { ThemeContext, MISSING_THEME_PROVIDER } from "./ThemeContext";
import type { ThemeContextValue } from "./ThemeContext";

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (ctx === MISSING_THEME_PROVIDER) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return ctx;
}
