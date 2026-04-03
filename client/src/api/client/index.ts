import createClient, { type Client } from "openapi-fetch";
import type { components, paths } from "../generated";

interface ApiRuntimeEnv {
  DEV: boolean;
  MODE?: string;
  VITE_API_BASE_URL?: string;
}

export interface RequestControlOptions {
  timeoutMs?: number;
  signal?: AbortSignal;
}

export type ApiRequestErrorCode = "aborted" | "timeout" | "network";

export class ApiRequestError extends Error {
  constructor(
    public readonly code: ApiRequestErrorCode,
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = "ApiRequestError";
  }
}

export function isApiRequestError(error: unknown): error is ApiRequestError {
  return error instanceof ApiRequestError;
}

const DEFAULT_REQUEST_TIMEOUT_MS = 8000;

export function resolveApiBaseUrl(env: ApiRuntimeEnv): string {
  const configuredBaseUrl = env.VITE_API_BASE_URL?.trim();
  if (configuredBaseUrl) {
    return configuredBaseUrl;
  }

  if (env.DEV) {
    return "http://localhost:5110";
  }

  const mode = env.MODE ?? "production";
  throw new Error(
    `Missing VITE_API_BASE_URL for ${mode} mode. Set an explicit API URL in your environment configuration.`,
  );
}

const baseUrl = resolveApiBaseUrl(import.meta.env);

function combineAbortSignals(signals: AbortSignal[]): {
  signal: AbortSignal;
  cleanup: () => void;
} {
  const controller = new AbortController();

  if (signals.some((signal) => signal.aborted)) {
    controller.abort();
    return { signal: controller.signal, cleanup: () => undefined };
  }

  const abort = () => controller.abort();
  for (const signal of signals) {
    signal.addEventListener("abort", abort, { once: true });
  }

  return {
    signal: controller.signal,
    cleanup: () => {
      for (const signal of signals) {
        signal.removeEventListener("abort", abort);
      }
    },
  };
}

function toApiRequestError(error: unknown, didTimeout: boolean, signal?: AbortSignal): ApiRequestError {
  if (didTimeout) {
    return new ApiRequestError("timeout", "API request timed out.", error);
  }

  if (signal?.aborted) {
    return new ApiRequestError("aborted", "API request was aborted.", error);
  }

  if (error instanceof DOMException && error.name === "AbortError") {
    return new ApiRequestError("aborted", "API request was aborted.", error);
  }

  if (error instanceof Error) {
    return new ApiRequestError("network", error.message, error);
  }

  return new ApiRequestError("network", `API request failed: ${String(error)}`, error);
}

export async function requestWithTimeout<T>(
  request: (signal: AbortSignal) => Promise<T>,
  options: RequestControlOptions = {},
): Promise<T> {
  const timeoutMs = options.timeoutMs ?? DEFAULT_REQUEST_TIMEOUT_MS;
  const timeoutController = new AbortController();
  const signals = [timeoutController.signal];
  if (options.signal) {
    signals.push(options.signal);
  }

  const { signal, cleanup } = combineAbortSignals(signals);
  let didTimeout = false;
  const timeoutId = globalThis.setTimeout(() => {
    didTimeout = true;
    timeoutController.abort();
  }, timeoutMs);

  const abortError = () => new DOMException("Aborted", "AbortError");
  const abortPromise = new Promise<never>((_, reject) => {
    if (signal.aborted) {
      reject(abortError());
      return;
    }

    signal.addEventListener("abort", () => reject(abortError()), { once: true });
  });

  try {
    return await Promise.race([request(signal), abortPromise]);
  } catch (error) {
    throw toApiRequestError(error, didTimeout, options.signal);
  } finally {
    globalThis.clearTimeout(timeoutId);
    cleanup();
  }
}

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

export async function getHealth(options: RequestControlOptions = {}): Promise<HealthResponse> {
  return requestWithTimeout(async (signal) => {
    const { data, error } = await client.GET("/Health", { signal });
    if (error !== undefined) {
      throw new ApiRequestError("network", `Failed to fetch health status: ${String(error)}`);
    }
    return data;
  }, options);
}

export async function getScaleFromRoot(
  midiRoot: number,
  scaleType: ScaleType = "Major",
  options: RequestControlOptions = {},
): Promise<number[]> {
  // Convert MIDI note number to Note enum
  const noteIndex = midiRoot % 12;
  const note = MIDI_TO_NOTE[noteIndex];
  
  if (!note) {
    throw new Error(`Invalid note index: ${noteIndex}`);
  }

  return requestWithTimeout(async (signal) => {
    const { data, error } = await client.POST("/Scale/from-root", {
      params: { query: { note } },
      body: { scaleType },
      signal,
    });
    if (error !== undefined) {
      throw new ApiRequestError("network", `Failed to fetch scale for root ${midiRoot}: ${String(error)}`);
    }
    return (data ?? []).map((noteInfo) => noteInfo.index ?? 0);
  }, options);
}

// Re-export all generated types and operations
export type * from "../generated";
