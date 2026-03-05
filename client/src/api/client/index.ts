import createClient, { type Client } from "openapi-fetch";
import type { components, paths } from "../generated";

// Configure API client with base URL from environment
// MUST match backend port (5110 for local dev)
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
 * const { data } = await client.GET('/Scale/from-root', { params: { query: { root: 60 } } });
 * ```
 */
export const client: Client<paths> = createClient<paths>({ baseUrl });

export type HealthResponse = components["schemas"]["HealthResponse"];

export async function getHealth(): Promise<HealthResponse> {
  const { data, error } = await client.GET("/Health");
  if (error !== undefined) {
    throw new Error(`Failed to fetch health status: ${String(error)}`);
  }
  return data;
}

export async function getScaleFromRoot(root: number): Promise<number[]> {
  const { data, error } = await client.GET("/Scale/from-root", {
    params: { query: { root } },
  });
  if (error !== undefined) {
    throw new Error(`Failed to fetch scale for root ${root}: ${String(error)}`);
  }
  return data;
}

// Re-export all generated types and operations
export type * from "../generated";
