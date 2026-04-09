import { ChordQualityColors } from "@/features/chord/constants/chordQualityColors";
import type { ChordType } from "@/features/chord/types";
import {
  DIATONIC_OPACITY,
  CHROMATIC_OPACITY,
} from "@/features/chromatic-circle/utils/scaleUtils";
import { CHORD_TONE_CHROMATIC_OPACITY } from "@/features/color-language/utils/harmonyOpacity";
import styles from "./VisualLegend.module.css";

// ─── Data ────────────────────────────────────────────────────────────────────

const CHORD_QUALITY_ENTRIES: { type: ChordType; label: string }[] = [
  { type: "major",    label: "Major" },
  { type: "minor",    label: "Minor" },
  { type: "dim",      label: "Dim" },
  { type: "aug",      label: "Aug" },
  { type: "maj7",     label: "Maj 7" },
  { type: "maj6",     label: "Major 6" },
  { type: "min7",     label: "Min 7" },
  { type: "dom7",     label: "Dom 7" },
  { type: "halfdim7", label: "ø 7" },
  { type: "quartal",  label: "Quartal" },
];

/** Seventh-chord types rendered with a quadrilateral glyph (4 tones). */
const SEVENTH_TYPES: ReadonlySet<ChordType> = new Set([
  "maj6", "maj7", "min7", "dom7", "halfdim7",
]);

// ─── Inline SVG helpers ───────────────────────────────────────────────────────

/**
 * Small white polygon glyph rendered inside a colored spectrum band.
 * Triads → triangle; seventh chords → quadrilateral.
 */
function BandGlyph({ type }: { type: ChordType }) {
  const isQuad = SEVENTH_TYPES.has(type);
  const stroke = "rgba(255,255,255,0.92)";
  const fill   = "rgba(255,255,255,0.20)";
  return isQuad ? (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <polygon
        points="9,2 16,7 13,16 3,14"
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinejoin="round"
        fill={fill}
      />
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <polygon
        points="9,2 16,15 2,15"
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinejoin="round"
        fill={fill}
      />
    </svg>
  );
}

/** A neutral-gray regular polygon with `sides` sides — for the cardinality stack. */
function CardinalityShape({ sides, size = 22 }: { sides: number; size?: number }) {
  const center = size / 2;
  const r = (size - 4) / 2;
  const pts = Array.from({ length: sides }, (_, i) => {
    const angle = -Math.PI / 2 + (i / sides) * 2 * Math.PI;
    return `${(center + r * Math.cos(angle)).toFixed(2)},${(center + r * Math.sin(angle)).toFixed(2)}`;
  }).join(" ");
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
      <polygon
        points={pts}
        fill="none"
        stroke="var(--color-text-secondary)"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** A triangle with a centroid dot — visual key for the centroid toggle. */
function CentroidIcon({ size = 22 }: { size?: number }) {
  const c = size / 2;
  const r = (size - 4) / 2;
  // Major-like pitch classes: 0, 4, 7
  const verts = [0, 4, 7].map((pc) => {
    const a = (pc / 12) * 2 * Math.PI - Math.PI / 2;
    return { x: c + r * Math.cos(a), y: c + r * Math.sin(a) };
  });
  const cx = verts.reduce((s, v) => s + v.x, 0) / verts.length;
  const cy = verts.reduce((s, v) => s + v.y, 0) / verts.length;
  const poly = verts.map((v) => `${v.x.toFixed(2)},${v.y.toFixed(2)}`).join(" ");
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
      <polygon
        points={poly}
        fill="none"
        stroke="var(--color-text-secondary)"
        strokeWidth="1.5"
      />
      <circle cx={cx.toFixed(2)} cy={cy.toFixed(2)} r="2.5" fill="var(--color-text-primary)" />
    </svg>
  );
}

/** A triangle with dashed spokes from each vertex to the centroid — visual key for the intervals toggle. */
function IntervalIcon({ size = 22 }: { size?: number }) {
  const c = size / 2;
  const r = (size - 4) / 2;
  const verts = [0, 4, 7].map((pc) => {
    const a = (pc / 12) * 2 * Math.PI - Math.PI / 2;
    return { x: c + r * Math.cos(a), y: c + r * Math.sin(a) };
  });
  const cx = verts.reduce((s, v) => s + v.x, 0) / verts.length;
  const cy = verts.reduce((s, v) => s + v.y, 0) / verts.length;
  const poly = verts.map((v) => `${v.x.toFixed(2)},${v.y.toFixed(2)}`).join(" ");
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
      <polygon
        points={poly}
        fill="none"
        stroke="var(--color-text-secondary)"
        strokeWidth="1.5"
      />
      {verts.map((v, i) => (
        <line
          key={i}
          x1={v.x.toFixed(2)}
          y1={v.y.toFixed(2)}
          x2={cx.toFixed(2)}
          y2={cy.toFixed(2)}
          stroke="var(--color-text-secondary)"
          strokeWidth="1"
          strokeDasharray="2,1.5"
          opacity="0.7"
        />
      ))}
    </svg>
  );
}

/** A single note-node circle with configurable fill and opacity. */
function MiniNode({
  fill,
  opacity = 1,
  strokeColor,
}: {
  fill: string;
  opacity?: number;
  strokeColor?: string;
}) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
      <circle
        cx="10"
        cy="10"
        r="7"
        fill={fill}
        stroke={strokeColor ?? "var(--color-border)"}
        strokeWidth="1.5"
        opacity={opacity}
      />
    </svg>
  );
}

// ─── Section heading ──────────────────────────────────────────────────────────

function SectionHeading({ children }: { children: React.ReactNode }) {
  return <h3 className={styles.sectionHeading}>{children}</h3>;
}

// ─── VisualLegend ─────────────────────────────────────────────────────────────

/**
 * A compact panel explaining the visual language of the chromatic-circle editor.
 *
 * Layout:
 *   1. Quality Spectrum  — vertical ribbon of colored bands with micro-polygon
 *      glyphs, displayed side-by-side with:
 *   2. Opacity Gradient  — translucency strip encoding diatonic / chromatic context
 *   3. Cardinality Stack — neutral-gray shapes keyed to tone count
 *   4. Visual Keys       — centroid-dot and interval-spoke icons
 *   5. Color Intensity   — base / deeper / richest shades for harmonic complexity
 *   6. Node Fill         — chord-tone vs. non-chord-tone node appearance
 */
export function VisualLegend() {
  // Build CSS gradient string for the opacity bar using the minor-blue quality color.
  const minorBase = ChordQualityColors.minor.base;
  const minorFaded = minorBase.replace(/^hsl\(/, "hsla(").replace(/\)$/, ", 0.15)");
  const opacityBarGradient = `linear-gradient(to bottom, ${minorBase} 0%, ${minorFaded} 100%)`;

  return (
    <aside className={styles.legend} aria-label="Visual language legend">

      {/* ── Top two-column layout ────────────────────────────────────────── */}
      <div className={styles.topRow}>

        {/* ── 1. Quality Spectrum — vertical ribbon ─────────────────────── */}
        <section className={styles.spectrumSection}>
          <SectionHeading>Quality — Color</SectionHeading>
          <ul className={styles.spectrumList} role="list">
            {CHORD_QUALITY_ENTRIES.map(({ type, label }) => {
              const { base } = ChordQualityColors[type];
              return (
                <li key={type} className={styles.spectrumItem}>
                  <span
                    className={styles.spectrumBand}
                    style={{ background: base }}
                    aria-hidden="true"
                  >
                    <BandGlyph type={type} />
                  </span>
                  <span className={styles.spectrumLabel}>{label}</span>
                </li>
              );
            })}
          </ul>
        </section>

        {/* ── 2. Transparency Gradient Strip ────────────────────────────── */}
        <section className={styles.opacitySection} aria-label="Opacity">
          <SectionHeading>Opacity</SectionHeading>
          <div className={styles.opacityStrip}>
            {/* Vertical gradient bar: opaque → translucent */}
            <div
              className={styles.opacityBar}
              style={{ background: opacityBarGradient }}
              aria-hidden="true"
            />
            {/* Three reference nodes at diatonic / chord-tone / chromatic levels */}
            <div className={styles.opacityNodes}>
              <div className={styles.opacityNodeRow}>
                <MiniNode
                  fill="var(--color-text-secondary)"
                  opacity={DIATONIC_OPACITY}
                />
                <span className={styles.opacityNodeLabel}>
                  Diatonic {Math.round(DIATONIC_OPACITY * 100)}%
                </span>
              </div>
              <div className={styles.opacityNodeRow}>
                <MiniNode
                  fill={ChordQualityColors.dom7.base}
                  opacity={CHORD_TONE_CHROMATIC_OPACITY}
                  strokeColor={ChordQualityColors.dom7.base}
                />
                <span className={styles.opacityNodeLabel}>
                  Chr. tone {Math.round(CHORD_TONE_CHROMATIC_OPACITY * 100)}%
                </span>
              </div>
              <div className={styles.opacityNodeRow}>
                <MiniNode
                  fill="var(--color-text-secondary)"
                  opacity={CHROMATIC_OPACITY}
                />
                <span className={styles.opacityNodeLabel}>
                  Chromatic {Math.round(CHROMATIC_OPACITY * 100)}%
                </span>
              </div>
            </div>
          </div>
        </section>

      </div>{/* end topRow */}

      {/* ── 3. Cardinality Stack — shape encodes tone count ───────────────── */}
      <section className={styles.section}>
        <SectionHeading>Shape — Number of Tones</SectionHeading>
        <div className={styles.cardinalityRow}>
          <div className={styles.cardinalityItem}>
            <CardinalityShape sides={3} />
            <span className={styles.cardinalityLabel}>3 tones — triad</span>
          </div>
          <div className={styles.cardinalityItem}>
            <CardinalityShape sides={4} />
            <span className={styles.cardinalityLabel}>4 tones — seventh</span>
          </div>
        </div>
      </section>

      {/* ── 4. Visual Keys — centroid and interval toggle icons ──────────── */}
      <section className={styles.section}>
        <SectionHeading>Visual Keys</SectionHeading>
        <div className={styles.iconRow}>
          <div className={styles.iconItem}>
            <CentroidIcon />
            <span className={styles.iconLabel}>Centroid</span>
          </div>
          <div className={styles.iconItem}>
            <IntervalIcon />
            <span className={styles.iconLabel}>Intervals</span>
          </div>
        </div>
      </section>

      {/* ── 5. Color Intensity — Harmonic Complexity ─────────────────────── */}
      <section className={styles.section}>
        <SectionHeading>Color Intensity — Complexity</SectionHeading>
        <ul className={styles.intensityList} role="list">
          <li className={styles.intensityItem}>
            <span
              className={styles.intensitySwatch}
              style={{ background: ChordQualityColors.minor.base }}
              aria-hidden="true"
            />
            <span className={styles.intensityLabel}>
              <strong>Base</strong> — Triad
            </span>
          </li>
          <li className={styles.intensityItem}>
            <span
              className={styles.intensitySwatch}
              style={{ background: ChordQualityColors.minor.deeper }}
              aria-hidden="true"
            />
            <span className={styles.intensityLabel}>
              <strong>Deeper</strong> — Seventh
            </span>
          </li>
          <li className={styles.intensityItem}>
            <span
              className={styles.intensitySwatch}
              style={{ background: ChordQualityColors.minor.richest }}
              aria-hidden="true"
            />
            <span className={styles.intensityLabel}>
              <strong>Richest</strong> — Extended (9/11/13)
            </span>
          </li>
        </ul>
      </section>

      {/* ── 6. Note Node Fill — Chord Tone vs. Non-Chord Tone ─────────────── */}
      <section className={styles.section}>
        <SectionHeading>Node Fill — Chord Tone</SectionHeading>
        <ul className={styles.nodeList} role="list">
          <li className={styles.nodeItem}>
            <MiniNode
              fill={ChordQualityColors.major.base}
              strokeColor={ChordQualityColors.major.base}
            />
            <span className={styles.nodeLabel}>Chord tone — quality fill</span>
          </li>
          <li className={styles.nodeItem}>
            <MiniNode fill="var(--color-bg-surface)" />
            <span className={styles.nodeLabel}>Non-chord tone — no fill</span>
          </li>
        </ul>
      </section>

    </aside>
  );
}
