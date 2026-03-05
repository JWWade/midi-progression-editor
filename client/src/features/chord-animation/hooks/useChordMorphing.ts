import { useState, useEffect, useRef } from "react";
import type { Point } from "@/features/chromatic-circle/utils/geometry";
import { morphPoints } from "@/features/chord-morphing/utils/morphing";

const MORPH_DURATION_MS = 350;

function easeInOutQuad(t: number): number {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
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
export function useChordMorphing(currentPoints: Point[]) {
  const [fromPoints, setFromPoints] = useState<Point[]>(currentPoints);
  const [morphProgress, setMorphProgress] = useState(1);

  // Tracks the most-recent "to" position so overlapping changes start from there
  const prevPointsRef = useRef<Point[]>(currentPoints);
  const prevKeyRef = useRef(pointsToKey(currentPoints));
  const animationIdRef = useRef<number>(0);

  const currentKey = pointsToKey(currentPoints);

  useEffect(() => {
    if (currentKey === prevKeyRef.current) return;

    // Capture the previous destination as the new "from"
    const capturedFrom = prevPointsRef.current;
    prevPointsRef.current = currentPoints;
    prevKeyRef.current = currentKey;

    // Cancel any in-progress animation (Option A)
    cancelAnimationFrame(animationIdRef.current);

    // Snap "from" to last destination and reset progress to 0
    setFromPoints(capturedFrom);
    setMorphProgress(0);

    let startTime = 0;

    const animate = (now: number) => {
      if (startTime === 0) startTime = now;
      const elapsed = now - startTime;
      const linear = Math.min(elapsed / MORPH_DURATION_MS, 1);
      setMorphProgress(easeInOutQuad(linear));
      if (linear < 1) {
        animationIdRef.current = requestAnimationFrame(animate);
      }
    };

    animationIdRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationIdRef.current);
    // currentKey encodes all changes in currentPoints; both listed to satisfy exhaustive-deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentKey]);

  const morphedPoints = morphPoints(fromPoints, currentPoints, morphProgress);
  return { morphedPoints, morphProgress };
}
