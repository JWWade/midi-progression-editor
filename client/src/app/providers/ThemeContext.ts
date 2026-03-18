import { createContext } from "react";

export type Theme = "light" | "dark";

export interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
}

export const MISSING_THEME_PROVIDER = {} as ThemeContextValue;

export const ThemeContext = createContext<ThemeContextValue>(MISSING_THEME_PROVIDER);
