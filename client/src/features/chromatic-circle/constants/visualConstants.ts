/**
 * Shared visual and layout constants for the chromatic-circle feature.
 *
 * These values are the single source of truth for sizing, spacing, typography,
 * and interaction geometry used across ChromaticCircle and all child components.
 * Centralising them here keeps the visual hierarchy consistent and makes
 * site-wide tweaks a one-line change.
 */

// ─── SVG coordinate space ────────────────────────────────────────────────────

/** Side length (px) of the SVG viewBox. The coordinate space is always square. */
export const VIEWBOX_SIZE = 300;

/** Centre point of the SVG coordinate space (= VIEWBOX_SIZE / 2). */
export const CENTER = VIEWBOX_SIZE / 2;

// ─── Ring geometry ───────────────────────────────────────────────────────────

/** Radius of the main chromatic ring path. */
export const RING_RADIUS = 110;

/**
 * Distance from the circle centre to outer note-name labels.
 * The extra 28 px clears the node circle (r = NODE_RADIUS) with comfortable
 * reading space.
 */
export const LABEL_DISTANCE = RING_RADIUS + 28;

// ─── Note nodes ──────────────────────────────────────────────────────────────

/** Radius of each note-node circle on the ring. */
export const NODE_RADIUS = 12;

/** Stroke width of the white border drawn around each note-node circle. */
export const NODE_STROKE_WIDTH = 1.5;

// ─── Polygon vertices ────────────────────────────────────────────────────────

/** Radius of a polygon vertex marker in its default (unselected) state. */
export const VERTEX_RADIUS = 6;

/** Radius of a polygon vertex marker when it is selected. */
export const VERTEX_RADIUS_SELECTED = 9;

/** Fill colour of a selected polygon vertex. */
export const VERTEX_SELECTED_FILL = "#FCD34D";

/** Stroke colour of a selected polygon vertex. */
export const VERTEX_SELECTED_STROKE = "#D97706";

// ─── Centroid marker ─────────────────────────────────────────────────────────

/** Radius of the centroid dot. */
export const CENTROID_RADIUS = 4;

/** Half-length (px) of each arm of the centroid crosshair. */
export const CENTROID_CROSSHAIR_LENGTH = 8;

// ─── Stroke widths ───────────────────────────────────────────────────────────

/** Stroke width for the ring outline circle. */
export const RING_STROKE_WIDTH = 1;

/** Stroke width for chord polygon outlines. */
export const POLYGON_STROKE_WIDTH = 2;

// ─── Typography ──────────────────────────────────────────────────────────────

/**
 * Font size for natural-note labels (single character, e.g. "C", "G").
 * Sized relative to NODE_RADIUS so labels fit comfortably inside the node.
 */
export const NATURAL_LABEL_FONT_SIZE = 11;

/**
 * Font size for accidental note labels (two characters, e.g. "C#", "Bb").
 * Slightly smaller than NATURAL_LABEL_FONT_SIZE to avoid overflowing the node.
 */
export const ACCIDENTAL_LABEL_FONT_SIZE = 9;

/**
 * Font family applied to all SVG text elements on the chromatic circle.
 * Using system-ui ensures the same clean typeface as the surrounding UI.
 */
export const NOTE_FONT_FAMILY = "system-ui, sans-serif";

// ─── Layout ──────────────────────────────────────────────────────────────────

/**
 * Horizontal padding (px) added on each side of the SVG within its container.
 * Gives the circle breathing room and prevents the ring from touching the
 * viewport edge on narrow screens.
 */
export const CIRCLE_PADDING = 16;
