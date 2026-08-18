import { useCallback, useEffect, useRef, useState } from "react";
import { PITCH_CLASSES } from "@/features/chromatic-circle/utils";
import { ChordQualityColors } from "../constants/chordQualityColors";
import { CHORD_NAME_TO_DATA, CHORD_TYPE_ORDER, getChordName } from "../data/chordNames";
import type { ChordType } from "../types";
import { useEnharmonic } from "@/app/providers/useEnharmonic";
import { ChordQualityIcon } from "./ChordQualityIcon";
import { rerootChord } from "../utils/rerootChord";
import { getChordNoteIndices } from "../utils/transpose";

const QUALITY_LABELS: Record<ChordType, string> = {
  major: "maj",
  minor: "m",
  dim: "dim",
  aug: "aug",
  sus2: "sus2",
  dom7: "7",
  dom7sus4: "7sus4",
  maj6: "6",
  min6: "m6",
  maj7: "maj7",
  min7: "m7",
  minmaj7: "m(maj7)",
  halfdim7: "m7b5",
  quartal: "q",
};

interface ChordGridProps {
  value: string;
  onChange: (chordName: string) => void;
  customChord?: { root: number; quality: ChordType; customNotes: number[] } | null;
  "aria-label"?: string;
  /** Pitch classes (0–11) that are diatonic to the active key. Diatonic cells show a filled-dot indicator. */
  diatonicRoots?: Set<number>;
}

export function ChordGrid({ value, onChange, customChord, "aria-label": ariaLabel, diatonicRoots }: ChordGridProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { pitchClasses } = useEnharmonic();

  useEffect(() => {
    if (!isOpen) return;

    const onPointerDown = (event: PointerEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isOpen]);

  const handleSelect = useCallback(
    (name: string) => {
      onChange(name);
      setIsOpen(false);
    },
    [onChange],
  );

  if (customChord?.customNotes) {
    const { root: identifiedRoot, quality: identifiedQuality, matchScore } = rerootChord(
      customChord.customNotes,
      customChord.root,
    );
    const inferredChordToneSet = new Set(getChordNoteIndices(identifiedRoot, identifiedQuality));
    const normalizedCustom = customChord.customNotes.map((index) => ((index % 12) + 12) % 12);
    const isSubsetOfInferredNamedChord = normalizedCustom.every((index) => inferredChordToneSet.has(index));

    // Exact or omitted-tone match: the custom notes resolve cleanly to a named
    // chord with no out-of-chord notes — show the normal clickable dropdown
    // trigger so the user can still explore the picker.
    if (matchScore === 1 || isSubsetOfInferredNamedChord) {
      const exactName = getChordName(identifiedRoot, identifiedQuality, pitchClasses);
      const exactData = CHORD_NAME_TO_DATA[exactName];
      const exactColor = exactData ? ChordQualityColors[exactData.type] : null;
      return (
        <div ref={containerRef} style={{ position: "relative", display: "inline-flex", gap: 4, alignItems: "center" }}>
          <button
            type="button"
            aria-label={ariaLabel}
            aria-haspopup="grid"
            aria-expanded={isOpen}
            onClick={() => setIsOpen((open) => !open)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 6,
              minWidth: 90,
              padding: "5px 10px",
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
              borderRadius: 6,
              background: "var(--color-bg-surface)",
              border: `1.5px solid ${exactColor?.base ?? "#d1d5db"}`,
              color: exactColor?.dark ?? "var(--color-text-primary)",
              transition: "border-color 0.15s, color 0.15s",
            }}
          >
            {exactName}
          </button>
          <button
            type="button"
            onClick={() => onChange(value)}
            style={{
              padding: "2px 6px",
              fontSize: 11,
              cursor: "pointer",
              color: "var(--color-text-primary)",
              background: "var(--color-bg-surface)",
              border: "1px solid var(--color-border)",
              borderRadius: 3,
            }}
            title="Reset to named chord"
            aria-label="Reset to named chord"
          >
            Reset
          </button>
          {isOpen && (
            <div
              role="grid"
              aria-label="Chord picker"
              style={{
                position: "fixed",
                bottom: 16,
                left: "50%",
                transform: "translateX(-50%)",
                zIndex: 1000,
                background: "var(--color-bg-surface)",
                border: "1px solid var(--color-border)",
                borderRadius: 10,
                boxShadow: "0 8px 28px rgba(0,0,0,0.16)",
                padding: "12px 14px",
                userSelect: "none",
                maxWidth: "calc(100vw - 32px)",
                maxHeight: "calc(100vh - 32px)",
                overflow: "auto",
              }}
            >
              <div role="row" style={{ display: "flex", marginBottom: 6 }}>
                <div style={{ width: 42, flexShrink: 0 }} />
                {CHORD_TYPE_ORDER.map((type) => (
                  <div
                    key={type}
                    role="columnheader"
                    title={QUALITY_LABELS[type]}
                    aria-label={QUALITY_LABELS[type]}
                    style={{
                      width: 64,
                      flexShrink: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      paddingBottom: 4,
                      borderBottom: `2px solid ${ChordQualityColors[type].base}`,
                    }}
                  >
                    <ChordQualityIcon quality={type} size={30} />
                  </div>
                ))}
              </div>

              {diatonicRoots !== undefined && (
                <div
                  role="note"
                  style={{
                    fontSize: 10,
                    color: "var(--color-text-secondary)",
                    marginBottom: 4,
                    paddingLeft: 30,
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <span style={{ color: "#22c55e", fontWeight: 700 }}>●</span>
                  <span>= diatonic to active key</span>
                </div>
              )}
              {PITCH_CLASSES.map((rootLabel, rootIndex) => {
                const isRootDiatonic = diatonicRoots?.has(rootIndex) ?? false;
                return (
                  <div key={rootLabel} role="row" style={{ display: "flex", alignItems: "center" }}>
                    <div
                      role="rowheader"
                      style={{
                        width: 42,
                        flexShrink: 0,
                        fontSize: 13,
                        fontWeight: 700,
                        color: "var(--color-text-secondary)",
                        textAlign: "right",
                        paddingRight: 6,
                        position: "relative",
                      }}
                    >
                      {isRootDiatonic && (
                        <span
                          aria-label="diatonic to active key"
                          title="diatonic to active key"
                          style={{
                            position: "absolute",
                            left: 0,
                            top: "50%",
                            transform: "translateY(-50%)",
                            color: "#22c55e",
                            fontSize: 8,
                            lineHeight: 1,
                          }}
                        >
                          ●
                        </span>
                      )}
                      {pitchClasses[rootIndex]}
                    </div>
                    {CHORD_TYPE_ORDER.map((type) => {
                      const chordName = getChordName(rootIndex, type);
                      const displayName = getChordName(rootIndex, type, pitchClasses);
                      const isSelected = chordName === exactName;
                      const color = ChordQualityColors[type];
                      return (
                        <button
                          key={type}
                          type="button"
                          role="gridcell"
                          aria-selected={isSelected}
                          onClick={() => handleSelect(chordName)}
                          style={{
                            width: 64,
                            height: 32,
                            flexShrink: 0,
                            fontSize: 13,
                            fontWeight: isSelected ? 700 : 400,
                            cursor: "pointer",
                            border: isSelected ? `1.5px solid ${color.base}` : "1px solid transparent",
                            borderRadius: 4,
                            background: isSelected ? color.light : "transparent",
                            color: isSelected ? color.dark : "var(--color-text-primary)",
                            textAlign: "center",
                            padding: 0,
                            transition: "background 0.08s",
                          }}
                          onMouseEnter={(event) => {
                            if (!isSelected) {
                              event.currentTarget.style.background = color.fill;
                            }
                          }}
                          onMouseLeave={(event) => {
                            if (!isSelected) {
                              event.currentTarget.style.background = "transparent";
                            }
                          }}
                        >
                          {displayName}
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      );
    }

    // No exact match: still show the picker trigger so named-chord selection
    // stays available even while the current tones are custom.
    const displayLabel = customChord.customNotes.map((index) => pitchClasses[index]).join(" ");
    return (
      <div ref={containerRef} style={{ position: "relative", display: "inline-flex", gap: 4, alignItems: "center" }}>
        <button
          type="button"
          aria-label={ariaLabel}
          aria-haspopup="grid"
          aria-expanded={isOpen}
          onClick={() => setIsOpen((open) => !open)}
          onMouseEnter={(event) => {
            event.currentTarget.style.background = "var(--color-bg-elevated)";
            event.currentTarget.style.borderColor = "var(--color-text-secondary)";
          }}
          onMouseLeave={(event) => {
            event.currentTarget.style.background = "var(--color-bg-surface)";
            event.currentTarget.style.borderColor = "var(--color-border)";
          }}
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 6,
            minWidth: 90,
            padding: "5px 10px",
            fontSize: 14,
            fontWeight: 700,
            cursor: "pointer",
            borderRadius: 6,
            background: "var(--color-bg-surface)",
            border: "1.5px solid var(--color-border)",
            color: "var(--color-text-primary)",
            transition: "border-color 0.15s, color 0.15s",
          }}
        >
          <span>{displayLabel}</span>
          <span style={{ fontSize: 11, opacity: 0.75, marginTop: 1 }}>▾</span>
        </button>
        <button
          type="button"
          onClick={() => onChange(value)}
          style={{
            padding: "2px 6px",
            fontSize: 11,
            cursor: "pointer",
            color: "var(--color-text-primary)",
            background: "var(--color-bg-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: 3,
          }}
          title="Reset to named chord"
          aria-label="Reset to named chord"
        >
          Reset
        </button>
        {isOpen && (
          <div
            role="grid"
            aria-label="Chord picker"
            style={{
              position: "fixed",
              bottom: 16,
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 1000,
              background: "var(--color-bg-surface)",
              border: "1px solid var(--color-border)",
              borderRadius: 10,
              boxShadow: "0 8px 28px rgba(0,0,0,0.16)",
              padding: "12px 14px",
              userSelect: "none",
              maxWidth: "calc(100vw - 32px)",
              maxHeight: "calc(100vh - 32px)",
              overflow: "auto",
            }}
          >
            <div role="row" style={{ display: "flex", marginBottom: 6 }}>
              <div style={{ width: 42, flexShrink: 0 }} />
              {CHORD_TYPE_ORDER.map((type) => (
                <div
                  key={type}
                  role="columnheader"
                  title={QUALITY_LABELS[type]}
                  aria-label={QUALITY_LABELS[type]}
                  style={{
                    width: 64,
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    paddingBottom: 4,
                    borderBottom: `2px solid ${ChordQualityColors[type].base}`,
                  }}
                >
                  <ChordQualityIcon quality={type} size={30} />
                </div>
              ))}
            </div>

            {diatonicRoots !== undefined && (
              <div
                role="note"
                style={{
                  fontSize: 10,
                  color: "var(--color-text-secondary)",
                  marginBottom: 4,
                  paddingLeft: 30,
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <span style={{ color: "#22c55e", fontWeight: 700 }}>●</span>
                <span>= diatonic to active key</span>
              </div>
            )}
            {PITCH_CLASSES.map((rootLabel, rootIndex) => {
              const isRootDiatonic = diatonicRoots?.has(rootIndex) ?? false;
              return (
                <div key={rootLabel} role="row" style={{ display: "flex", alignItems: "center" }}>
                  <div
                    role="rowheader"
                    style={{
                      width: 42,
                      flexShrink: 0,
                      fontSize: 13,
                      fontWeight: 700,
                      color: "var(--color-text-secondary)",
                      textAlign: "right",
                      paddingRight: 6,
                      position: "relative",
                    }}
                  >
                    {isRootDiatonic && (
                      <span
                        aria-label="diatonic to active key"
                        title="diatonic to active key"
                        style={{
                          position: "absolute",
                          left: 0,
                          top: "50%",
                          transform: "translateY(-50%)",
                          color: "#22c55e",
                          fontSize: 8,
                          lineHeight: 1,
                        }}
                      >
                        ●
                      </span>
                    )}
                    {pitchClasses[rootIndex]}
                  </div>
                  {CHORD_TYPE_ORDER.map((type) => {
                    const chordName = getChordName(rootIndex, type);
                    const displayName = getChordName(rootIndex, type, pitchClasses);
                    const isSelected = chordName === value;
                    const color = ChordQualityColors[type];
                    return (
                      <button
                        key={type}
                        type="button"
                        role="gridcell"
                        aria-selected={isSelected}
                        onClick={() => handleSelect(chordName)}
                        style={{
                          width: 64,
                          height: 32,
                          flexShrink: 0,
                          fontSize: 13,
                          fontWeight: isSelected ? 700 : 400,
                          cursor: "pointer",
                          border: isSelected ? `1.5px solid ${color.base}` : "1px solid transparent",
                          borderRadius: 4,
                          background: isSelected ? color.light : "transparent",
                          color: isSelected ? color.dark : "var(--color-text-primary)",
                          textAlign: "center",
                          padding: 0,
                          transition: "background 0.08s",
                        }}
                        onMouseEnter={(event) => {
                          if (!isSelected) {
                            event.currentTarget.style.background = color.fill;
                          }
                        }}
                        onMouseLeave={(event) => {
                          if (!isSelected) {
                            event.currentTarget.style.background = "transparent";
                          }
                        }}
                      >
                        {displayName}
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  const selectedData = CHORD_NAME_TO_DATA[value];
  const qualityColor = selectedData ? ChordQualityColors[selectedData.type] : null;
  const displayValue = selectedData
    ? getChordName(selectedData.root, selectedData.type, pitchClasses)
    : value;

  return (
    <div ref={containerRef} style={{ position: "relative", display: "inline-block" }}>
      <button
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="grid"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 6,
          minWidth: 90,
          padding: "5px 10px",
          fontSize: 14,
          fontWeight: 700,
          cursor: "pointer",
          borderRadius: 6,
          background: "var(--color-bg-surface)",
          border: `1.5px solid ${qualityColor?.base ?? "#d1d5db"}`,
          color: qualityColor?.dark ?? "var(--color-text-primary)",
          transition: "border-color 0.15s, color 0.15s",
        }}
      >
        <span>{displayValue || "-"}</span>
        <span style={{ fontSize: 11, opacity: 0.75, marginTop: 1 }}>▾</span>
      </button>

      {isOpen && (
        <div
          role="grid"
          aria-label="Chord picker"
          style={{
            position: "fixed",
            bottom: 16,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 1000,
            background: "var(--color-bg-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: 10,
            boxShadow: "0 8px 28px rgba(0,0,0,0.16)",
            padding: "12px 14px",
            userSelect: "none",
            maxWidth: "calc(100vw - 32px)",
            maxHeight: "calc(100vh - 32px)",
            overflow: "auto",
          }}
        >
          <div role="row" style={{ display: "flex", marginBottom: 6 }}>
            <div style={{ width: 42, flexShrink: 0 }} />
            {CHORD_TYPE_ORDER.map((type) => (
              <div
                key={type}
                role="columnheader"
                title={QUALITY_LABELS[type]}
                aria-label={QUALITY_LABELS[type]}
                style={{
                  width: 64,
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  paddingBottom: 4,
                  borderBottom: `2px solid ${ChordQualityColors[type].base}`,
                }}
              >
                <ChordQualityIcon quality={type} size={30} />
              </div>
            ))}
          </div>

          {diatonicRoots !== undefined && (
            <div
              role="note"
              style={{
                fontSize: 10,
                color: "var(--color-text-secondary)",
                marginBottom: 4,
                paddingLeft: 30,
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <span style={{ color: "#22c55e", fontWeight: 700 }}>●</span>
              <span>= diatonic to active key</span>
            </div>
          )}
          {PITCH_CLASSES.map((rootLabel, rootIndex) => {
            const isRootDiatonic = diatonicRoots?.has(rootIndex) ?? false;
            return (
              <div key={rootLabel} role="row" style={{ display: "flex", alignItems: "center" }}>
                <div
                  role="rowheader"
                  style={{
                    width: 42,
                    flexShrink: 0,
                    fontSize: 13,
                    fontWeight: 700,
                    color: "var(--color-text-secondary)",
                    textAlign: "right",
                    paddingRight: 6,
                    position: "relative",
                  }}
                >
                  {isRootDiatonic && (
                    <span
                      aria-label="diatonic to active key"
                      title="diatonic to active key"
                      style={{
                        position: "absolute",
                        left: 0,
                        top: "50%",
                        transform: "translateY(-50%)",
                        color: "#22c55e",
                        fontSize: 8,
                        lineHeight: 1,
                      }}
                    >
                      ●
                    </span>
                  )}
                  {pitchClasses[rootIndex]}
                </div>
                {CHORD_TYPE_ORDER.map((type) => {
                  const chordName = getChordName(rootIndex, type);
                  const displayName = getChordName(rootIndex, type, pitchClasses);
                  const isSelected = chordName === value;
                  const color = ChordQualityColors[type];
                  return (
                    <button
                      key={type}
                      type="button"
                      role="gridcell"
                      aria-selected={isSelected}
                      onClick={() => handleSelect(chordName)}
                      style={{
                        width: 64,
                        height: 32,
                        flexShrink: 0,
                        fontSize: 13,
                        fontWeight: isSelected ? 700 : 400,
                        cursor: "pointer",
                        border: isSelected ? `1.5px solid ${color.base}` : "1px solid transparent",
                        borderRadius: 4,
                        background: isSelected ? color.light : "transparent",
                        color: isSelected ? color.dark : "var(--color-text-primary)",
                        textAlign: "center",
                        padding: 0,
                        transition: "background 0.08s",
                      }}
                      onMouseEnter={(event) => {
                        if (!isSelected) {
                          event.currentTarget.style.background = color.fill;
                        }
                      }}
                      onMouseLeave={(event) => {
                        if (!isSelected) {
                          event.currentTarget.style.background = "transparent";
                        }
                      }}
                    >
                      {displayName}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
