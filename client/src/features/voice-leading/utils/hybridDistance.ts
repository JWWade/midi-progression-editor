/**
 * Hybrid Harmonic Distance Metric
 *
 * Combines a graph-based voice-leading component with a geometric component
 * derived from the unit-circle embedding of pitch classes.
 *
 * d_hybrid(A, B) = α · d_graph(A, B) + β · d_geom(A, B)
 *
 * where α = 1 − t and β = t, and t ∈ [0, 1] blends between the two regimes.
 */

import { chordDistanceFlexible } from "./chordDistance";

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

/**
 * Weighting parameters for {@link hybridDistance}.
 */
export interface HybridParams {
  /** Weight for shared-pitch (symmetric-difference) component. @default 1.0 */
  lambda1: number;
  /** Weight for voice-leading displacement component. @default 0.5 */
  lambda2: number;
  /** Weight for centroid-motion component. @default 1.0 */
  mu1: number;
  /** Weight for polygon-area-difference component. @default 0.25 */
  mu2: number;
  /** Weight for radial-spread-difference component. @default 0.25 */
  mu3: number;
  /**
   * Blend parameter in [0, 1].
   * 0 = pure graph metric, 1 = pure geometric metric.
   * @default 0.3
   */
  t: number;
}

/** Default parameter values for {@link hybridDistance}. */
export const DEFAULT_HYBRID_PARAMS: HybridParams = {
  lambda1: 1.0,
  lambda2: 0.5,
  mu1: 1.0,
  mu2: 0.25,
  mu3: 0.25,
  t: 0.3,
};

// ---------------------------------------------------------------------------
// Unit-circle primitives
// ---------------------------------------------------------------------------

/**
 * Maps a pitch class to a unit-circle point using the standard mathematical
 * orientation (x = cos, y = sin).  C (pc 0) is at angle 0.
 *
 * The metric is rotation-invariant, so orientation does not affect distance
 * values — only the absolute coordinates differ from SVG conventions.
 *
 * @param pc - Pitch class in 0–11.
 */
export function pitchClassToUnitCircle(pc: number): { x: number; y: number } {
  const angle = (2 * Math.PI * pc) / 12;
  return { x: Math.cos(angle), y: Math.sin(angle) };
}

/**
 * Computes the arithmetic centroid of the unit-circle points for a
 * pitch-class set.  Returns `{ x: 0, y: 0 }` for an empty array.
 *
 * @param pcs - Array of pitch classes.
 */
export function pcsUnitCentroid(pcs: number[]): { x: number; y: number } {
  if (pcs.length === 0) return { x: 0, y: 0 };
  let sumX = 0;
  let sumY = 0;
  for (const pc of pcs) {
    const p = pitchClassToUnitCircle(pc);
    sumX += p.x;
    sumY += p.y;
  }
  return { x: sumX / pcs.length, y: sumY / pcs.length };
}

/**
 * Computes the area of the polygon whose vertices are the unit-circle points
 * of a pitch-class set, with notes ordered by ascending pitch class (= ascending
 * angle).  Uses the shoelace formula and returns the absolute value.
 *
 * Returns `0` for sets with fewer than 3 elements.
 *
 * @param pcs - Array of pitch classes.
 */
export function pcsPolygonArea(pcs: number[]): number {
  if (pcs.length < 3) return 0;
  const sorted = [...pcs].sort((a, b) => a - b);
  const pts = sorted.map(pitchClassToUnitCircle);
  const n = pts.length;
  let sum = 0;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    sum += pts[i].x * pts[j].y - pts[j].x * pts[i].y;
  }
  return Math.abs(sum) / 2;
}

/**
 * Computes the radial-spread variance: the mean squared Euclidean distance
 * from each unit-circle point to the centroid of the pitch-class set.
 *
 * Returns `0` for an empty array.
 *
 * @param pcs - Array of pitch classes.
 */
export function pcsRadialSpread(pcs: number[]): number {
  if (pcs.length === 0) return 0;
  const centroid = pcsUnitCentroid(pcs);
  let sumSq = 0;
  for (const pc of pcs) {
    const p = pitchClassToUnitCircle(pc);
    const dx = p.x - centroid.x;
    const dy = p.y - centroid.y;
    sumSq += dx * dx + dy * dy;
  }
  return sumSq / pcs.length;
}

// ---------------------------------------------------------------------------
// Hybrid distance components
// ---------------------------------------------------------------------------

/**
 * All seven named distance components plus the final hybrid value.
 * Useful for explainability and ML feature extraction.
 */
export interface HybridComponents {
  /** Size of the symmetric difference: |A ∪ B| − |A ∩ B|. */
  dShared: number;
  /** Flexible voice-leading displacement (cross-size aware). */
  dVl: number;
  /** Graph component: λ1·dShared + λ2·dVl. */
  dGraph: number;
  /** Euclidean distance between unit-circle centroids. */
  dCentroid: number;
  /** Absolute difference of polygon areas. */
  dArea: number;
  /** Absolute difference of radial-spread variances. */
  dSpread: number;
  /** Geometric component: μ1·dCentroid + μ2·dArea + μ3·dSpread. */
  dGeom: number;
  /** Final hybrid distance: α·dGraph + β·dGeom, where α = 1−t, β = t. */
  dHybrid: number;
}

/**
 * Computes all hybrid-distance components for two pitch-class sets.
 *
 * @param a      - Pitch classes of the first chord.
 * @param b      - Pitch classes of the second chord.
 * @param params - Optional partial parameter overrides.
 */
export function hybridComponents(
  a: number[],
  b: number[],
  params?: Partial<HybridParams>,
): HybridComponents {
  const p: HybridParams = { ...DEFAULT_HYBRID_PARAMS, ...params };

  // --- Graph components ---
  const setB = new Set(b);
  const unionSize = new Set([...a, ...b]).size;
  const intersectionSize = a.filter((x) => setB.has(x)).length;
  const dShared = unionSize - intersectionSize;

  const dVl = chordDistanceFlexible(a, b);
  const dGraph = p.lambda1 * dShared + p.lambda2 * dVl;

  // --- Geometric components ---
  const cA = pcsUnitCentroid(a);
  const cB = pcsUnitCentroid(b);
  const dCentroid = Math.sqrt((cA.x - cB.x) ** 2 + (cA.y - cB.y) ** 2);
  const dArea = Math.abs(pcsPolygonArea(a) - pcsPolygonArea(b));
  const dSpread = Math.abs(pcsRadialSpread(a) - pcsRadialSpread(b));
  const dGeom = p.mu1 * dCentroid + p.mu2 * dArea + p.mu3 * dSpread;

  // --- Hybrid blend ---
  const alpha = 1 - p.t;
  const beta = p.t;
  const dHybrid = alpha * dGraph + beta * dGeom;

  return { dShared, dVl, dGraph, dCentroid, dArea, dSpread, dGeom, dHybrid };
}

/**
 * Computes the hybrid harmonic distance between two pitch-class sets.
 *
 * Suitable for use as a {@link WeightFn} in `buildChordGraph` /
 * `findShortestVoiceLeading`.
 *
 * @param a      - Pitch classes of the first chord.
 * @param b      - Pitch classes of the second chord.
 * @param params - Optional partial parameter overrides.
 * @returns A non-negative finite distance value.
 */
export function hybridDistance(
  a: number[],
  b: number[],
  params?: Partial<HybridParams>,
): number {
  return hybridComponents(a, b, params).dHybrid;
}
