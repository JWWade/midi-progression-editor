import createClient, { type Client } from "openapi-fetch";
import type { components, paths } from "../generated";

// Configure API client with base URL from environment.
// Falls back to http://localhost:5110 for local development only —
// set VITE_API_BASE_URL in .env.local (see .env.example) for any other environment.
const baseUrl =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ??
  "http://localhost:5110";

/**
 * Pre-configured API client instance
 * All functions are fully typed from OpenAPI spec
 *
 * Usage in feature modules:
 * ```ts
 * import { client } from '@/api/client';
 * const { data } = await client.GET('/Health');
 * const { data } = await client.POST('/Scale/from-root', { params: { query: { note: 'C' } }, body: { scaleType: 'Major' } });
 * ```
 */
export const client: Client<paths> = createClient<paths>({ baseUrl });

export type HealthResponse = components["schemas"]["HealthResponse"];
export type NoteInfo = components["schemas"]["NoteInfo"];
export type ScaleType = NonNullable<components["schemas"]["ScaleOptionsDto"]["scaleType"]>;

// Note values are defined inline in the OpenAPI path parameters; derive the type from there.
type Note = NonNullable<
  paths["/Scale/from-root"]["post"]["parameters"]["query"]
>["note"];

// Map MIDI note numbers to Note enum values
const MIDI_TO_NOTE: Record<number, Note> = {
  0: "C",
  1: "CSharp",
  2: "D",
  3: "DSharp",
  4: "E",
  5: "F",
  6: "FSharp",
  7: "G",
  8: "GSharp",
  9: "A",
  10: "ASharp",
  11: "B",
};

export async function getHealth(): Promise<HealthResponse> {
  const { data, error } = await client.GET("/Health");
  if (error !== undefined) {
    throw new Error(`Failed to fetch health status: ${String(error)}`);
  }
  return data;
}

export async function getScaleFromRoot(midiRoot: number, scaleType: ScaleType = "Major"): Promise<number[]> {
  // Convert MIDI note number to Note enum
  const noteIndex = midiRoot % 12;
  const note = MIDI_TO_NOTE[noteIndex];
  
  if (!note) {
    throw new Error(`Invalid note index: ${noteIndex}`);
  }

  const { data, error } = await client.POST("/Scale/from-root", {
    params: { query: { note } },
    body: { scaleType },
  });
  if (error !== undefined) {
    throw new Error(`Failed to fetch scale for root ${midiRoot}: ${String(error)}`);
  }
  return (data ?? []).map((noteInfo) => noteInfo.index ?? 0);
}

// Re-export all generated types and operations
export type * from "../generated";
