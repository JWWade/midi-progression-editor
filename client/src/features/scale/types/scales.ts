export type ScaleType =
  | "major"
  | "naturalMinor"
  | "harmonicMinor"
  | "melodicMinor"
  | "dorian"
  | "phrygian"
  | "lydian"
  | "mixolydian";

export const SCALE_INTERVALS: Record<ScaleType, readonly number[]> = {
  major: [0, 2, 4, 5, 7, 9, 11],
  naturalMinor: [0, 2, 3, 5, 7, 8, 10],
  harmonicMinor: [0, 2, 3, 5, 7, 8, 11],
  melodicMinor: [0, 2, 3, 5, 7, 9, 11],
  dorian: [0, 2, 3, 5, 7, 9, 10],
  phrygian: [0, 1, 3, 5, 7, 8, 10],
  lydian: [0, 2, 4, 6, 7, 9, 11],
  mixolydian: [0, 2, 4, 5, 7, 9, 10],
};

export const SCALE_LABELS: Record<ScaleType, string> = {
  major: "Major",
  naturalMinor: "Natural Minor",
  harmonicMinor: "Harmonic Minor",
  melodicMinor: "Melodic Minor",
  dorian: "Dorian",
  phrygian: "Phrygian",
  lydian: "Lydian",
  mixolydian: "Mixolydian",
};

export type ScaleTension = "stable" | "moderate" | "floating" | "unresolved" | "high";
export type ScaleBrightness = "dark" | "neutral" | "warm" | "bright" | "ethereal";

export interface ScaleDescriptor {
  /** Two to four mood/emotion keywords */
  mood: string[];
  /** Tonal color keywords */
  color: string[];
  /** Qualitative tension profile */
  tension: ScaleTension;
  /** Perceived brightness on the dark–bright axis */
  brightness: ScaleBrightness;
  /** Genre or cultural tradition associations */
  culturalContext: string[];
  /** One-sentence expressive summary shown in the UI */
  summary: string;
}

export const TENSION_ORDER: Record<ScaleTension, number> = {
  stable: 0,
  moderate: 1,
  floating: 2,
  unresolved: 3,
  high: 4,
};

export const BRIGHTNESS_ORDER: Record<ScaleBrightness, number> = {
  dark: 0,
  neutral: 1,
  warm: 2,
  bright: 3,
  ethereal: 4,
};

export const SCALE_DESCRIPTORS: Record<ScaleType, ScaleDescriptor> = {
  major: {
    mood: ["bright", "confident", "resolved"],
    color: ["warm", "clear"],
    tension: "stable",
    brightness: "bright",
    culturalContext: ["classical", "pop", "folk"],
    summary: "Open and resolved; the default tonal center of Western music.",
  },
  naturalMinor: {
    mood: ["melancholic", "introspective", "soulful"],
    color: ["warm", "subdued"],
    tension: "moderate",
    brightness: "neutral",
    culturalContext: ["classical", "folk", "rock"],
    summary: "Emotionally rich and familiar minor color; plaintive without excess tension.",
  },
  harmonicMinor: {
    mood: ["dramatic", "intense", "exotic"],
    color: ["dark", "vivid"],
    tension: "high",
    brightness: "dark",
    culturalContext: ["classical", "flamenco", "Middle Eastern"],
    summary: "The raised 7th creates strong dominant pull and a distinctive augmented-second flavor.",
  },
  melodicMinor: {
    mood: ["smooth", "searching", "sophisticated"],
    color: ["warm", "shimmering"],
    tension: "moderate",
    brightness: "neutral",
    culturalContext: ["classical", "jazz"],
    summary: "The \"jazz minor\" — ascending smoothness that avoids the harmonic minor's harshness.",
  },
  dorian: {
    mood: ["melancholic", "soulful", "hopeful"],
    color: ["warm", "wistful"],
    tension: "moderate",
    brightness: "neutral",
    culturalContext: ["jazz", "folk", "rock"],
    summary: "Minor with a raised 6th — darker than major, more hopeful than natural minor.",
  },
  phrygian: {
    mood: ["haunting", "intense", "mysterious"],
    color: ["dark", "exotic"],
    tension: "high",
    brightness: "dark",
    culturalContext: ["flamenco", "Middle Eastern", "metal"],
    summary: "The flat 2nd creates immediate tension and a distinctly ancient, exotic character.",
  },
  lydian: {
    mood: ["mystical", "uplifting", "dreamlike"],
    color: ["bright", "ethereal", "otherworldly"],
    tension: "floating",
    brightness: "ethereal",
    culturalContext: ["cinematic", "fusion", "experimental"],
    summary: "The raised 4th lifts the sound upward — expansive, floating, never quite at rest.",
  },
  mixolydian: {
    mood: ["relaxed", "grounded", "approachable"],
    color: ["warm", "bluesy"],
    tension: "moderate",
    brightness: "warm",
    culturalContext: ["blues", "folk", "rock"],
    summary: "Major with a flat 7th — the scale of riffs, drones, and natural resolution.",
  },
};
