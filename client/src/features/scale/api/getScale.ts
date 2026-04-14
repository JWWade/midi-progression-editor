import { getScaleFromRoot, type RequestControlOptions } from "@/api/client";

// MIDI note number for middle C (C4)
const C_MAJOR_ROOT = 60;

export async function getScaleCMajor(options: RequestControlOptions = {}): Promise<number[]> {
  return getScaleFromRoot(C_MAJOR_ROOT, "Major", options);
}
