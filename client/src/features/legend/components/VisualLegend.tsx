import { ChordQualityColors } from "@/features/chord/constants/chordQualityColors";
import type { ChordType } from "@/features/chord/types";
import styles from "./VisualLegend.module.css";

type QualityTile = { type: ChordType; label: string };

type QualityGroup = {
  title: string;
  entries: QualityTile[];
};

const CHORD_QUALITY_GROUPS: QualityGroup[] = [
  {
    title: "Triads + Suspended",
    entries: [
      { type: "major", label: "Major" },
      { type: "minor", label: "Minor" },
      { type: "dim", label: "Dim" },
      { type: "aug", label: "Aug" },
      { type: "sus2", label: "Sus 2" },
    ],
  },
  {
    title: "Added-Sixth + Minor/Major Seventh",
    entries: [
      { type: "maj6", label: "Major 6" },
      { type: "min6", label: "Minor 6" },
      { type: "maj7", label: "Maj 7" },
      { type: "min7", label: "Min 7" },
      { type: "minmaj7", label: "m(maj7)" },
    ],
  },
  {
    title: "Dominant + Modern Colors",
    entries: [
      { type: "dom7", label: "Dom 7" },
      { type: "dom7sus4", label: "7sus4" },
      { type: "halfdim7", label: "ø 7" },
      { type: "quartal", label: "Quartal" },
    ],
  },
];

const SEVENTH_TYPES: ReadonlySet<ChordType> = new Set([
  "maj6",
  "min6",
  "maj7",
  "min7",
  "minmaj7",
  "dom7",
  "dom7sus4",
  "halfdim7",
]);

function SectionHeading({ children }: { children: React.ReactNode }) {
  return <h3 className={styles.sectionHeading}>{children}</h3>;
}

function BandGlyph({ type }: { type: ChordType }) {
  const isQuad = SEVENTH_TYPES.has(type);
  const points = isQuad ? "9,2 16,7 13,16 3,14" : "9,2 16,15 2,15";

  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <polygon
        points={points}
        stroke="rgba(255,255,255,0.92)"
        strokeWidth="1.5"
        strokeLinejoin="round"
        fill="rgba(255,255,255,0.20)"
      />
    </svg>
  );
}

export function VisualLegend() {
  return (
    <aside className={styles.legend} aria-label="Visual language legend">
      <section className={styles.spectrumSection}>
        <SectionHeading>Quality — Color</SectionHeading>
        <div className={styles.groupStack}>
          {CHORD_QUALITY_GROUPS.map((group) => (
            <section key={group.title} className={styles.groupSection} aria-label={group.title}>
              <h4 className={styles.groupHeading}>{group.title}</h4>
              <ul className={styles.tileRow} role="list">
                {group.entries.map(({ type, label }) => {
                  const { base } = ChordQualityColors[type];
                  return (
                    <li key={type} className={styles.tileItem}>
                      <span
                        className={styles.tileBand}
                        style={{ background: base }}
                        aria-hidden="true"
                      >
                        <BandGlyph type={type} />
                      </span>
                      <span className={styles.tileLabel}>{label}</span>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      </section>
    </aside>
  );
}
