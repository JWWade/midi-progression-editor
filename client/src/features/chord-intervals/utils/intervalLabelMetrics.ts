const MIN_RECT_WIDTH = 26;
const MAX_RECT_WIDTH = 44;
const HORIZONTAL_PADDING = 5;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function getFontSizeForInterval(intervalName: string): number {
  if (intervalName.length >= 6) return 9;
  if (intervalName.length >= 5) return 10;
  return 11;
}

export function getIntervalLabelMetrics(intervalName: string): {
  fontSize: number;
  rectWidth: number;
  textLength: number;
} {
  const fontSize = getFontSizeForInterval(intervalName);
  const estimatedTextWidth = intervalName.length * fontSize * 0.62;
  const rectWidth = clamp(
    estimatedTextWidth + HORIZONTAL_PADDING * 2,
    MIN_RECT_WIDTH,
    MAX_RECT_WIDTH,
  );
  const textLength = rectWidth - HORIZONTAL_PADDING * 2;

  return { fontSize, rectWidth, textLength };
}
