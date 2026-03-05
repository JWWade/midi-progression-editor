import { createClient, type Client } from "../generated";

// Configure API client with base URL from environment
// MUST match backend port (5110 for local dev)
const baseURL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ??
  "http://localhost:5110";

/**
 * Pre-configured API client instance
 * All functions are fully typed from OpenAPI spec
 * 
 * Usage in components:
 * ```ts
 * import { client } from '@/api/client';
 * const health = await client.get('/Health');
 * const scale = await client.post('/Scale/from-root', { query: { note: 'C' } });
 * ```
 */
export const client: Client = createClient({ baseURL });

// Re-export all generated types and operations
export type * from "../generated";
