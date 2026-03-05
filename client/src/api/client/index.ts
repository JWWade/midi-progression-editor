import type { components, operations } from "../generated";

// API base URL: Override with VITE_API_BASE_URL environment variable
// MUST match backend port (5110 for local dev, update if backend moves)
const API_BASE =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ??
  "http://localhost:5110";

export type HealthResponse = components["schemas"]["HealthResponse"];

export async function getHealth(): Promise<HealthResponse> {
  const res = await fetch(`${API_BASE}/Health`);
  if (!res.ok) throw new Error(`Health check failed: ${res.status}`);
  return res.json() as Promise<HealthResponse>;
}

export async function getScaleFromRoot(
  root: operations["GetScaleFromRoot"]["parameters"]["query"]["root"],
): Promise<number[]> {
  const params = new URLSearchParams({ root: String(root) });
  const res = await fetch(`${API_BASE}/Scale/from-root?${params.toString()}`);
  if (!res.ok) throw new Error(`Scale request failed: ${res.status}`);
  return res.json() as Promise<number[]>;
}
