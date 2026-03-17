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
  { type: "min7",     label: "Min 7" },
  { type: "dom7",     label: "Dom 7" },
  { type: "halfdim7", label: "ø 7" },
  { type: "quartal",  label: "Quartal" },
];

// ─── Small inline SVG helpers ─────────────────────────────────────────────────

function MiniTriangle({ color }: { color: string }) {
  return (
    <svg width="28" height="26" viewBox="0 0 28 26" aria-hidden="true">
      <polygon
        points="14,2 26,24 2,24"
        stroke={color}
        strokeWidth="2"
        strokeLinejoin="round"
        fill={color.replace(/^hsl\(/, "hsla(").replace(/\)$/, ", 0.18)")}
      />
    </svg>
  );
}

function MiniQuadrilateral({ color }: { color: string }) {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true">
      {/* Irregular quadrilateral roughly mimicking a chord shape */}
      <polygon
        points="14,2 26,12 20,26 6,22"
        stroke={color}
        strokeWidth="2"
        strokeLinejoin="round"
        fill={color.replace(/^hsl\(/, "hsla(").replace(/\)$/, ", 0.18)")}
      />
    </svg>
  );
}

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
    <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true">
      <circle
        cx="11"
        cy="11"
        r="8"
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
 * A compact panel explaining the visual language of the chromatic-circle editor:
 * chord quality colors, shape–complexity mapping, and opacity–scale relationship.
 */
export function VisualLegend() {
  return (
    <aside className={styles.legend} aria-label="Visual language legend">

      {/* ── 1. Chord Quality Colors ──────────────────────────────────────── */}
      <section className={styles.section}>
        <SectionHeading>Chord Quality — Color</SectionHeading>
        <ul className={styles.colorList} role="list">
          {CHORD_QUALITY_ENTRIES.map(({ type, label }) => {
            const { base } = ChordQualityColors[type];
            return (
              <li key={type} className={styles.colorItem}>
                <span
                  className={styles.colorSwatch}
                  style={{ background: base }}
                  aria-hidden="true"
                />
                <span className={styles.colorLabel}>{label}</span>
              </li>
            );
          })}
        </ul>
      </section>

      {/* ── 2. Shape — Number of Chord Tones ─────────────────────────────── */}
      <section className={styles.section}>
        <SectionHeading>Shape — Number of Tones</SectionHeading>
        <ul className={styles.shapeList} role="list">
          <li className={styles.shapeItem}>
            <MiniTriangle color={ChordQualityColors.major.base} />
            <span className={styles.shapeLabel}>
              <strong>Triangle</strong> — Triads (3 tones)
            </span>
          </li>
          <li className={styles.shapeItem}>
            <MiniQuadrilateral color={ChordQualityColors.dom7.base} />
            <span className={styles.shapeLabel}>
              <strong>Quadrilateral</strong> — Sevenths (4 tones)
            </span>
          </li>
        </ul>
      </section>

      {/* ── 3. Color Intensity — Harmonic Complexity ─────────────────────── */}
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

      {/* ── 4. Note Node Fill — Chord Tone vs. Non-Chord Tone ─────────────── */}
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

      {/* ── 5. Opacity — Scale / Diatonic Context ─────────────────────────── */}
      <section className={styles.section}>
        <SectionHeading>Opacity — Scale Context</SectionHeading>
        <ul className={styles.opacityList} role="list">
          <li className={styles.opacityItem}>
            <MiniNode
              fill="var(--color-text-secondary)"
              opacity={DIATONIC_OPACITY}
            />
            <span className={styles.opacityLabel}>
              Diatonic — full ({Math.round(DIATONIC_OPACITY * 100)} %)
            </span>
          </li>
          <li className={styles.opacityItem}>
            <MiniNode
              fill={ChordQualityColors.dom7.base}
              opacity={CHORD_TONE_CHROMATIC_OPACITY}
              strokeColor={ChordQualityColors.dom7.base}
            />
            <span className={styles.opacityLabel}>
              Chord tone outside key ({Math.round(CHORD_TONE_CHROMATIC_OPACITY * 100)} %)
            </span>
          </li>
          <li className={styles.opacityItem}>
            <MiniNode
              fill="var(--color-text-secondary)"
              opacity={CHROMATIC_OPACITY}
            />
            <span className={styles.opacityLabel}>
              Chromatic (out of key) — faded ({Math.round(CHROMATIC_OPACITY * 100)} %)
            </span>
          </li>
        </ul>
      </section>

    </aside>
  );
}
