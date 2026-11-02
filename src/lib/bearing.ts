/** A stable bearing from text: the same text always points the same way (-70 to 70 degrees). */
export function bearingFor(text: string): number {
  const value = text.trim().toLowerCase();
  if (value === "") {
    return 0;
  }
  let hash = 0;
  for (const char of value) {
    hash = (hash * 31 + char.charCodeAt(0)) % 1000;
  }
  return (hash % 141) - 70;
}

/** Degrees clockwise from north for a pointer at (x, y) seen from (centerX, centerY). */
export function bearingToPoint(
  centerX: number,
  centerY: number,
  x: number,
  y: number,
): number {
  return (Math.atan2(x - centerX, centerY - y) * 180) / Math.PI;
}

/**
 * The angle equal to `target` (mod 360) that is closest to `previous`, so a
 * needle crossing north turns the short way instead of spinning a full circle.
 */
export function nearestBearing(previous: number, target: number): number {
  const turns = Math.round((previous - target) / 360);
  return target + turns * 360;
}

const POINTS = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"] as const;

/** Eight-point compass label and whole degrees (0-359) for a bearing, e.g. "NE 42°". */
export function headingLabel(bearing: number): string {
  const degrees = ((Math.round(bearing) % 360) + 360) % 360;
  const point = POINTS[Math.round(degrees / 45) % 8];
  return `${point} ${degrees}°`;
}
