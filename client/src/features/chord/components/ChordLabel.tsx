import type { Point } from "@/features/chromatic-circle/utils/geometry";

interface ChordLabelProps {
  point: Point;
  noteName: string;
  fill?: string;
}

export function ChordLabel({ point, noteName, fill = "#1F2937" }: ChordLabelProps) {
  return (
    <text
      x={point.x}
      y={point.y}
      textAnchor="middle"
      dominantBaseline="middle"
      fontSize={13}
      fontWeight="600"
      fontFamily="system-ui, sans-serif"
      fill={fill}
      pointerEvents="none"
    >
      {noteName}
    </text>
  );
}
