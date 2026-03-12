import type { ChordType } from "@/features/chord/types";
import { ChordColors } from "@/features/color-language/constants/chordColors";
import type { Theme } from "@/app/providers/ThemeContext";

type AmbientSurface = "circle" | "panel";

function isDarkTheme(): boolean {
  if (typeof document === "undefined") return false;
  return document.documentElement.getAttribute("data-theme") === "dark";
}

function parseHsl(color: string): [number, number, number] | null {
  const match = color.match(/hsl\(\s*([\d.]+)\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%\s*\)/i);
  if (!match) return null;
  return [Number(match[1]), Number(match[2]), Number(match[3])];
}

/**
 * Returns the ambient background tint color for the chromatic circle and
 * chord panels.  The color is derived from the quality's light variant in
 * {@link ChordColors}, providing a cohesive, quality-specific hue
 * that reinforces the system-wide color grammar.
 *
 * @param _key    Root note index (0 = C … 11 = B) — currently unused; kept
 *                for API compatibility with call sites that pass the root.
 * @param quality Chord quality / type.
 * @param surface Target surface to tint.
 * @returns       CSS color string from the quality palette, adapted by theme.
 */
export function getCircleColor(_key: number, quality: ChordType, surface: AmbientSurface = "circle"): string {
  const light = ChordColors[quality].light;
  if (!isDarkTheme()) return light;

  const parsed = parseHsl(light);
  if (!parsed) {
    return surface === "panel" ? "#222431" : "#1d2230";
  }

  const [h, s] = parsed;

  // In dark theme, keep hue identity while reducing lightness and saturation.
  if (surface === "panel") {
    return `hsl(${h}, ${Math.min(s, 24)}%, 17%)`;
  }

  return `hsla(${h}, ${Math.min(s, 36)}%, 20%, 0.58)`;
}

export function getCircleColorForTheme(
  _key: number,
  quality: ChordType,
  theme: Theme,
  surface: AmbientSurface = "circle",
): string {
  const light = ChordColors[quality].light;
  if (theme !== "dark") return light;

  const parsed = parseHsl(light);
  if (!parsed) {
    return surface === "panel" ? "#222431" : "#1d2230";
  }

  const [h, s] = parsed;

  // In dark theme, keep hue identity while reducing lightness and saturation.
  if (surface === "panel") {
    return `hsl(${h}, ${Math.min(s, 24)}%, 17%)`;
  }

  return `hsla(${h}, ${Math.min(s, 36)}%, 20%, 0.58)`;
}
