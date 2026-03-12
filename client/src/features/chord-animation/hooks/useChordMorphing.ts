import { useState, useEffect, useRef } from "react";
import type { Point } from "@/features/chromatic-circle/utils/geometry";
import { morphPoints } from "@/features/chord-morphing/utils/morphing";

export const DEFAULT_MORPH_DURATION_MS = 260;

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function pointsToKey(points: Point[]): string {
  return points.map((p) => `${p.x},${p.y}`).join("|");
}

/**
 * Automatically animates a polygon to its new position whenever `currentPoints`
 * changes. Previous points are tracked internally — no explicit "from" input is
 * needed. Returns the interpolated points and eased progress (0 → 1).
 *
 * Overlapping changes use Option A: the running animation is cancelled and a
 * new one starts immediately from the last "destination" position.
 */
export function useChordMorphing(
  currentPoints: Point[],
  durationMs: number = DEFAULT_MORPH_DURATION_MS,
) {
  const [fromPoints, setFromPoints] = useState<Point[]>(currentPoints);
  const [toPoints, setToPoints] = useState<Point[]>(currentPoints);
  const [morphProgress, setMorphProgress] = useState(1);

  // Tracks active animation endpoints so overlapping changes resume in-flight.
  const fromPointsRef = useRef<Point[]>(currentPoints);
  const toPointsRef = useRef<Point[]>(currentPoints);
  const progressRef = useRef(1);
  const prevKeyRef = useRef(pointsToKey(currentPoints));
  const animationIdRef = useRef<number>(0);

  const currentKey = pointsToKey(currentPoints);
  const safeDurationMs = Math.max(1, durationMs);

  useEffect(() => {
    if (currentKey === prevKeyRef.current) return;

    const capturedFrom =
      progressRef.current >= 1
        ? toPointsRef.current
        : morphPoints(fromPointsRef.current, toPointsRef.current, progressRef.current);
    const nextTo = currentPoints;

    fromPointsRef.current = capturedFrom;
    toPointsRef.current = nextTo;
    prevKeyRef.current = currentKey;

    // Cancel any in-progress animation and continue from the currently rendered shape.
    cancelAnimationFrame(animationIdRef.current);
    progressRef.current = 0;

    let startTime = 0;

    const animate = (now: number) => {
      if (startTime === 0) {
        startTime = now;
        setFromPoints(capturedFrom);
        setToPoints(nextTo);
        setMorphProgress(0);
      }
      const elapsed = now - startTime;
      const linear = Math.min(elapsed / safeDurationMs, 1);
      const eased = easeInOutCubic(linear);
      progressRef.current = eased;
      setMorphProgress(eased);
      if (linear < 1) {
        animationIdRef.current = requestAnimationFrame(animate);
      }
    };

    animationIdRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationIdRef.current);
  // `currentKey` fully captures point changes; excluding raw `currentPoints`
  // prevents cancel/restart loops caused by new array identities each render.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentKey, safeDurationMs]);

  // When point counts differ (triad <-> seventh), snap to destination points
  // at animation end so the final rendered polygon includes all vertices.
  const morphedPoints = morphProgress >= 1
    ? toPoints
    : morphPoints(fromPoints, toPoints, morphProgress);
  return { morphedPoints, morphProgress };
}
