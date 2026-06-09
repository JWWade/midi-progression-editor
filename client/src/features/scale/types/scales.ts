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
export type ScaleStability = "low" | "moderate" | "high" | "veryHigh";

export interface ScaleDescriptor {
  /** Two to four mood/emotion keywords */
  mood: string[];
  /** Tonal color keywords */
  color: string[];
  /** Qualitative tension profile */
  tension: ScaleTension;
  /** Perceived brightness on the dark–bright axis */
  brightness: ScaleBrightness;
  /** Structural stability profile relative to tonic grounding */
  stability: ScaleStability;
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

export const STABILITY_ORDER: Record<ScaleStability, number> = {
  low: 0,
  moderate: 1,
  high: 2,
  veryHigh: 3,
};

export const SCALE_DESCRIPTORS: Record<ScaleType, ScaleDescriptor> = {
  major: {
    mood: ["open", "confident", "complete"],
    color: ["warm", "clear"],
    tension: "stable",
    brightness: "bright",
    stability: "veryHigh",
    culturalContext: ["classical", "pop", "folk"],
    summary: "Open and daylight-clear; strongly grounded and complete to many Western listeners.",
  },
  naturalMinor: {
    mood: ["melancholic", "introspective", "vulnerable"],
    color: ["dark", "subdued"],
    tension: "moderate",
    brightness: "dark",
    stability: "high",
    culturalContext: ["classical", "folk", "rock"],
    summary: "Familiar minor color with efficient emotional pull: inward, low-light, and stable.",
  },
  harmonicMinor: {
    mood: ["dramatic", "passionate", "urgent"],
    color: ["dark", "vivid"],
    tension: "high",
    brightness: "dark",
    stability: "high",
    culturalContext: ["classical", "flamenco", "Middle Eastern"],
    summary: "The raised 7th drives intense dominant pull and a dramatic augmented-second contour.",
  },
  melodicMinor: {
    mood: ["sophisticated", "searching", "fluid"],
    color: ["warm", "shimmering"],
    tension: "moderate",
    brightness: "neutral",
    stability: "high",
    culturalContext: ["classical", "jazz"],
    summary: "The jazz-minor profile: controlled ambiguity with smooth motion and modern harmonic flexibility.",
  },
  dorian: {
    mood: ["reflective", "resilient", "wistful"],
    color: ["warm", "wistful"],
    tension: "moderate",
    brightness: "neutral",
    stability: "high",
    culturalContext: ["jazz", "folk", "rock"],
    summary: "Minor with raised 6th energy: serious and cool, but resilient rather than resigned.",
  },
  phrygian: {
    mood: ["mysterious", "ritual", "intense"],
    color: ["dark", "smoky"],
    tension: "high",
    brightness: "dark",
    stability: "moderate",
    culturalContext: ["flamenco", "Middle Eastern", "metal"],
    summary: "The flat 2nd creates immediate constraint and danger-colored tension with ancient character.",
  },
  lydian: {
    mood: ["weightless", "wonder", "expansive"],
    color: ["bright", "ethereal", "otherworldly"],
    tension: "floating",
    brightness: "ethereal",
    stability: "high",
    culturalContext: ["cinematic", "fusion", "experimental"],
    summary: "The raised 4th suspends gravity: luminous and floating, yet still anchored around tonic.",
  },
  mixolydian: {
    mood: ["relaxed", "grounded", "communal"],
    color: ["warm", "bluesy"],
    tension: "moderate",
    brightness: "warm",
    stability: "high",
    culturalContext: ["blues", "folk", "rock"],
    summary: "Major with flat 7th: stable and approachable, with less ceremonial pull than Ionian.",
  },
};
