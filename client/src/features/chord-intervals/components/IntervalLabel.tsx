import type { Point } from "@/features/chromatic-circle/utils/geometry";
import { INTERVAL_LABEL_TEXT_COLOR } from "@/features/chromatic-circle/constants/visualConstants";
import { getIntervalLabelMetrics } from "../utils/intervalLabelMetrics";

interface IntervalLabelProps {
  from: Point;
  to: Point;
  intervalName: string;
  centerX: number;
  centerY: number;
}

const LABEL_OFFSET = 12;
const RECT_HEIGHT = 16;
const RECT_RX = 3;

export function IntervalLabel({
  from,
  to,
  intervalName,
  centerX,
  centerY,
}: IntervalLabelProps) {
  const midX = (from.x + to.x) / 2;
  const midY = (from.y + to.y) / 2;

  const dx = midX - centerX;
  const dy = midY - centerY;
  const magnitude = Math.sqrt(dx * dx + dy * dy);

  const labelX = magnitude > 0 ? midX + (dx / magnitude) * LABEL_OFFSET : midX;
  const labelY = magnitude > 0 ? midY + (dy / magnitude) * LABEL_OFFSET : midY;

  const { fontSize, rectWidth, textLength } = getIntervalLabelMetrics(intervalName);

  return (
    <g role="img" aria-label={`Interval: ${intervalName}`}>
      <rect
        x={labelX - rectWidth / 2}
        y={labelY - RECT_HEIGHT / 2}
        width={rectWidth}
        height={RECT_HEIGHT}
        fill="white"
        rx={RECT_RX}
        stroke="rgba(17, 24, 39, 0.2)"
        strokeWidth={0.8}
        opacity={0.96}
      />
      <text
        x={labelX}
        y={labelY}
        fontSize={fontSize}
        fontWeight="600"
        fill={INTERVAL_LABEL_TEXT_COLOR}
        textAnchor="middle"
        dominantBaseline="middle"
        textLength={textLength}
        lengthAdjust="spacingAndGlyphs"
        fontFamily="sans-serif"
      >
        {intervalName}
      </text>
    </g>
  );
}
