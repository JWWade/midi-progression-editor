import { useState, useEffect, useRef } from "react";
import type { Point } from "@/features/chromatic-circle/utils/geometry";
import { morphPoints } from "../utils/morphing";

const MORPH_DURATION_MS = 400;

function pointsToKey(points: Point[]): string {
  return points.map((p) => `${p.x},${p.y}`).join("|");
}

/**
 * Animates a polygon from `fromPoints` to `toPoints` whenever either set of
 * points changes. Returns the interpolated points and the current progress
 * value (0 = from, 1 = to).
 */
export function useChordMorph(fromPoints: Point[], toPoints: Point[]) {
  const [morphProgress, setMorphProgress] = useState(0);

  const prevFromKey = useRef(pointsToKey(fromPoints));
  const prevToKey = useRef(pointsToKey(toPoints));

  const fromKey = pointsToKey(fromPoints);
  const toKey = pointsToKey(toPoints);

  useEffect(() => {
    if (fromKey === prevFromKey.current && toKey === prevToKey.current) {
      return;
    }

    prevFromKey.current = fromKey;
    prevToKey.current = toKey;

    let animationId: number;
    let startTime = 0;

    const animate = (now: number) => {
      if (startTime === 0) startTime = now;
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / MORPH_DURATION_MS, 1);
      setMorphProgress(progress);
      if (progress < 1) {
        animationId = requestAnimationFrame(animate);
      }
    };

    animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, [fromKey, toKey]);

  const morphedPoints = morphPoints(fromPoints, toPoints, morphProgress);
  return { morphedPoints, morphProgress };
}
