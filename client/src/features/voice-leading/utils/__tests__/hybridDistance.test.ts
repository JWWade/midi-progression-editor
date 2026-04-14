/**
 * Tests for the hybrid harmonic distance metric.
 *
 * Verifies correctness of the primitive geometric functions, the component
 * breakdown, and the top-level hybridDistance / buildHybridChordGraph API.
 */

import { describe, it, expect } from "vitest";
import {
  hybridDistance,
  hybridComponents,
  DEFAULT_HYBRID_PARAMS,
  pitchClassToUnitCircle,
  pcsUnitCentroid,
  pcsPolygonArea,
  pcsRadialSpread,
} from "../hybridDistance";
import { buildHybridChordGraph } from "@/features/harmonic-graph";

// ---------------------------------------------------------------------------
// pitchClassToUnitCircle
// ---------------------------------------------------------------------------

describe("pitchClassToUnitCircle", () => {
  it("maps pc 0 (C) to (1, 0)", () => {
    const p = pitchClassToUnitCircle(0);
    expect(p.x).toBeCloseTo(1, 10);
    expect(p.y).toBeCloseTo(0, 10);
  });

  it("maps pc 3 to the 3 o'clock position in standard math coords", () => {
    // angle = 2π * 3 / 12 = π/2
    const p = pitchClassToUnitCircle(3);
    expect(p.x).toBeCloseTo(0, 10);
    expect(p.y).toBeCloseTo(1, 10);
  });

  it("all points lie exactly on the unit circle", () => {
    for (let pc = 0; pc < 12; pc++) {
      const { x, y } = pitchClassToUnitCircle(pc);
      expect(x * x + y * y).toBeCloseTo(1, 10);
    }
  });
});

// ---------------------------------------------------------------------------
// pcsUnitCentroid
// ---------------------------------------------------------------------------

describe("pcsUnitCentroid", () => {
  it("returns (0, 0) for an empty PCS", () => {
    const c = pcsUnitCentroid([]);
    expect(c.x).toBe(0);
    expect(c.y).toBe(0);
  });

  it("returns the point itself for a single-element PCS", () => {
    const p = pitchClassToUnitCircle(4);
    const c = pcsUnitCentroid([4]);
    expect(c.x).toBeCloseTo(p.x, 10);
    expect(c.y).toBeCloseTo(p.y, 10);
  });

  it("returns correct centroid for C major triad [0, 4, 7]", () => {
    // pc 0 → (1, 0), pc 4 → (-0.5, √3/2 ≈ 0.866), pc 7 → (-√3/2 ≈ -0.866, -0.5)
    // centroid x = (1 − 0.5 − 0.866) / 3 ≈ −0.122
    // centroid y = (0 + 0.866 − 0.5)   / 3 ≈  0.122
    const c = pcsUnitCentroid([0, 4, 7]);
    expect(c.x).toBeCloseTo(-0.122, 2);
    expect(c.y).toBeCloseTo(0.122, 2);
  });

  it("centroid of the full chromatic set is near (0, 0)", () => {
    const c = pcsUnitCentroid([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
    expect(Math.abs(c.x)).toBeLessThan(1e-10);
    expect(Math.abs(c.y)).toBeLessThan(1e-10);
  });
});

// ---------------------------------------------------------------------------
// pcsPolygonArea
// ---------------------------------------------------------------------------

describe("pcsPolygonArea", () => {
  it("returns 0 for empty PCS", () => {
    expect(pcsPolygonArea([])).toBe(0);
  });

  it("returns 0 for single-note PCS", () => {
    expect(pcsPolygonArea([0])).toBe(0);
  });

  it("returns 0 for two-note PCS", () => {
    expect(pcsPolygonArea([0, 6])).toBe(0);
  });

  it("returns a positive finite number for C major triad [0, 4, 7]", () => {
    const area = pcsPolygonArea([0, 4, 7]);
    expect(area).toBeGreaterThan(0);
    expect(Number.isFinite(area)).toBe(true);
  });

  it("verifies shoelace formula numerically for C major triad [0, 4, 7]", () => {
    // Sorted ascending: pcs = [0, 4, 7]
    // pc 0 → (1, 0)
    // pc 4 → (cos 120°, sin 120°) = (−½, √3/2)
    // pc 7 → (cos 210°, sin 210°) = (−√3/2, −½)
    //
    // Shoelace:
    //   term0 = 1*(√3/2) − (−½)*0 = √3/2
    //   term1 = (−½)*(−½) − (−√3/2)*(√3/2) = ¼ + ¾ = 1
    //   term2 = (−√3/2)*0 − 1*(−½) = ½
    //   area  = |√3/2 + 1 + ½| / 2 = (√3 + 3) / 4 ≈ 1.183
    const expected = (Math.sqrt(3) + 3) / 4;
    expect(pcsPolygonArea([0, 4, 7])).toBeCloseTo(expected, 10);
  });

  it("ascending sort order is applied regardless of input order", () => {
    const area1 = pcsPolygonArea([0, 4, 7]);
    const area2 = pcsPolygonArea([7, 0, 4]);
    const area3 = pcsPolygonArea([4, 7, 0]);
    expect(area2).toBeCloseTo(area1, 10);
    expect(area3).toBeCloseTo(area1, 10);
  });

  it("area of an equilateral triangle is close to 3√3/4", () => {
    // Equilateral triangle inscribed in unit circle: pcs 0, 4, 8
    const expected = (3 * Math.sqrt(3)) / 4;
    expect(pcsPolygonArea([0, 4, 8])).toBeCloseTo(expected, 10);
  });
});

// ---------------------------------------------------------------------------
// pcsRadialSpread
// ---------------------------------------------------------------------------

describe("pcsRadialSpread", () => {
  it("returns 0 for empty PCS", () => {
    expect(pcsRadialSpread([])).toBe(0);
  });

  it("returns 0 for single-note PCS (point sits on its own centroid)", () => {
    // centroid = the single point itself, so d² = 0 for every pc
    expect(pcsRadialSpread([5])).toBeCloseTo(0, 10);
  });

  it("returns a positive finite number for C major triad [0, 4, 7]", () => {
    const spread = pcsRadialSpread([0, 4, 7]);
    expect(spread).toBeGreaterThan(0);
    expect(Number.isFinite(spread)).toBe(true);
  });

  it("equilateral triangle [0, 4, 8] has equal radial spread to [1, 5, 9] (another equilateral)", () => {
    // Both are regular inscribed triangles (120° steps), so spread must match.
    // [0,4,8]: centroid = (0,0), each d² = 1 → σ² = 1
    // [1,5,9]: centroid = (0,0), each d² = 1 → σ² = 1
    expect(pcsRadialSpread([0, 4, 8])).toBeCloseTo(pcsRadialSpread([1, 5, 9]), 10);
  });
});

// ---------------------------------------------------------------------------
// hybridDistance — identity (d(A, A) = 0)
// ---------------------------------------------------------------------------

describe("hybridDistance — identity", () => {
  const chords: number[][] = [
    [0, 4, 7],       // C major
    [0, 3, 7],       // C minor
    [0, 3, 6],       // C diminished
    [0, 4, 7, 11],   // C major 7
    [0, 3, 7, 10],   // C minor 7
    [0, 4, 7, 10],   // C dominant 7
  ];

  for (const chord of chords) {
    it(`hybridDistance(${JSON.stringify(chord)}, ${JSON.stringify(chord)}) === 0`, () => {
      expect(hybridDistance(chord, chord)).toBeCloseTo(0, 10);
    });
  }

  it("returns 0 for empty arrays", () => {
    expect(hybridDistance([], [])).toBeCloseTo(0, 10);
  });
});

// ---------------------------------------------------------------------------
// hybridDistance — symmetry (d(A, B) === d(B, A))
// ---------------------------------------------------------------------------

describe("hybridDistance — symmetry", () => {
  const pairs: [number[], number[]][] = [
    [[0, 4, 7],    [0, 3, 7]],      // C major  ↔ C minor
    [[0, 4, 7],    [5, 9, 0]],      // C major  ↔ F major
    [[0, 3, 6],    [0, 4, 8]],      // Cdim     ↔ Caug
    [[0, 4, 7, 11],[0, 3, 7, 10]], // CMaj7    ↔ Cmin7
    [[1, 5, 8],    [2, 6, 11]],     // Db major ↔ D minor (transposed)
    [[0, 4, 7],    [6, 10, 1]],     // C major  ↔ F# major (tritone)
  ];

  for (const [a, b] of pairs) {
    it(`hybridDistance(${JSON.stringify(a)}, ${JSON.stringify(b)}) is symmetric`, () => {
      expect(hybridDistance(a, b)).toBeCloseTo(hybridDistance(b, a), 10);
    });
  }
});

// ---------------------------------------------------------------------------
// hybridDistance — t = 0 (pure graph)
// ---------------------------------------------------------------------------

describe("hybridDistance with t = 0", () => {
  it("dHybrid equals dGraph when t = 0", () => {
    const a = [0, 4, 7];
    const b = [0, 3, 7];
    const c = hybridComponents(a, b, { t: 0 });
    expect(c.dHybrid).toBeCloseTo(c.dGraph, 10);
  });

  it("geometric weight is zero when t = 0 (dHybrid ignores dGeom)", () => {
    const a = [0, 4, 7];
    const b = [5, 9, 2];
    const c = hybridComponents(a, b, { t: 0 });
    // α = 1, β = 0 → dHybrid = dGraph regardless of dGeom
    expect(c.dHybrid).toBeCloseTo(c.dGraph, 10);
  });
});

// ---------------------------------------------------------------------------
// hybridDistance — t = 1 (pure geometry)
// ---------------------------------------------------------------------------

describe("hybridDistance with t = 1", () => {
  it("dHybrid equals dGeom when t = 1", () => {
    const a = [0, 4, 7];
    const b = [0, 3, 7];
    const c = hybridComponents(a, b, { t: 1 });
    expect(c.dHybrid).toBeCloseTo(c.dGeom, 10);
  });

  it("graph weight is zero when t = 1 (dHybrid ignores dGraph)", () => {
    const a = [0, 4, 7];
    const b = [5, 9, 2];
    const c = hybridComponents(a, b, { t: 1 });
    // α = 0, β = 1 → dHybrid = dGeom regardless of dGraph
    expect(c.dHybrid).toBeCloseTo(c.dGeom, 10);
  });
});

// ---------------------------------------------------------------------------
// hybridComponents — empty inputs
// ---------------------------------------------------------------------------

describe("hybridComponents — empty inputs", () => {
  it("does not throw for empty arrays", () => {
    expect(() => hybridComponents([], [])).not.toThrow();
  });

  it("all component distances are 0 for empty arrays", () => {
    const c = hybridComponents([], []);
    expect(c.dShared).toBe(0);
    expect(c.dVl).toBe(0);
    expect(c.dGraph).toBe(0);
    expect(c.dCentroid).toBe(0);
    expect(c.dArea).toBe(0);
    expect(c.dSpread).toBe(0);
    expect(c.dGeom).toBe(0);
    expect(c.dHybrid).toBe(0);
  });

  it("all component distances are finite for typical chord pairs", () => {
    const c = hybridComponents([0, 4, 7], [0, 3, 7, 10]);
    expect(Number.isFinite(c.dShared)).toBe(true);
    expect(Number.isFinite(c.dVl)).toBe(true);
    expect(Number.isFinite(c.dGraph)).toBe(true);
    expect(Number.isFinite(c.dCentroid)).toBe(true);
    expect(Number.isFinite(c.dArea)).toBe(true);
    expect(Number.isFinite(c.dSpread)).toBe(true);
    expect(Number.isFinite(c.dGeom)).toBe(true);
    expect(Number.isFinite(c.dHybrid)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// hybridDistance — musical plausibility
// ---------------------------------------------------------------------------

describe("hybridDistance — musical plausibility", () => {
  it("C major → G major (t=0.3) is closer than C major → F# major", () => {
    // G major = [2, 7, 11], F# major = [1, 6, 10]
    // G major shares the note G (7) with C major and is a perfect fifth away
    // F# major is a tritone away and shares no tones
    const cMajor = [0, 4, 7];
    const gMajor = [2, 7, 11];
    const fsMajor = [1, 6, 10];
    const dCG = hybridDistance(cMajor, gMajor, { t: 0.3 });
    const dCFs = hybridDistance(cMajor, fsMajor, { t: 0.3 });
    expect(dCG).toBeLessThan(dCFs);
  });

  it("dShared is 0 for identical chords", () => {
    const c = hybridComponents([0, 4, 7], [0, 4, 7]);
    expect(c.dShared).toBe(0);
  });

  it("dShared equals symmetric difference size for non-overlapping chords", () => {
    // [0, 4, 7] and [1, 5, 9]: no common notes, union has 6 elements
    const c = hybridComponents([0, 4, 7], [1, 5, 9]);
    expect(c.dShared).toBe(6);
  });
});

// ---------------------------------------------------------------------------
// DEFAULT_HYBRID_PARAMS
// ---------------------------------------------------------------------------

describe("DEFAULT_HYBRID_PARAMS", () => {
  it("has the expected default values", () => {
    expect(DEFAULT_HYBRID_PARAMS.lambda1).toBe(1.0);
    expect(DEFAULT_HYBRID_PARAMS.lambda2).toBe(0.5);
    expect(DEFAULT_HYBRID_PARAMS.mu1).toBe(1.0);
    expect(DEFAULT_HYBRID_PARAMS.mu2).toBe(0.25);
    expect(DEFAULT_HYBRID_PARAMS.mu3).toBe(0.25);
    expect(DEFAULT_HYBRID_PARAMS.t).toBe(0.3);
  });
});

// ---------------------------------------------------------------------------
// buildHybridChordGraph
// ---------------------------------------------------------------------------

describe("buildHybridChordGraph", () => {
  it("returns a ChordGraph with nodes", () => {
    const graph = buildHybridChordGraph(0.3);
    expect(graph.nodes.length).toBeGreaterThan(0);
  });

  it("all edges have finite weights", () => {
    const graph = buildHybridChordGraph(0.3);
    for (const edge of graph.edges) {
      expect(Number.isFinite(edge.weight)).toBe(true);
    }
  });

  it("all edge weights are non-negative", () => {
    const graph = buildHybridChordGraph(0.3);
    for (const edge of graph.edges) {
      expect(edge.weight).toBeGreaterThanOrEqual(0);
    }
  });

  it("with t=0 produces all finite edges (no Infinity from hybrid metric)", () => {
    const graph = buildHybridChordGraph(0);
    for (const edge of graph.edges) {
      expect(Number.isFinite(edge.weight)).toBe(true);
    }
  });

  it("graph size matches default triad graph node count", () => {
    // Default: triads only, T-canonicalization → 19 nodes
    const graph = buildHybridChordGraph(0.3);
    expect(graph.nodes.length).toBe(19);
  });

  it("accepts graphOptions to restrict to seventh chords", () => {
    const graph = buildHybridChordGraph(0.3, undefined, { sizes: [4] });
    // 4-note chords with T-canonicalization → 43 nodes
    expect(graph.nodes.length).toBe(43);
  });
});
