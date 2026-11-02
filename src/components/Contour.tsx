type Point = [number, number];

/**
 * A smooth closed curve through the points (Catmull-Rom converted to cubic
 * Béziers). Deterministic, so server and client render the same SVG.
 */
function closedCurve(points: Point[]): string {
  const n = points.length;
  const at = (i: number) => points[(i + n) % n];
  let d = `M${at(0)[0].toFixed(1)} ${at(0)[1].toFixed(1)}`;
  for (let i = 0; i < n; i += 1) {
    const p0 = at(i - 1);
    const p1 = at(i);
    const p2 = at(i + 1);
    const p3 = at(i + 2);
    const c1: Point = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2: Point = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return `${d}Z`;
}

/** One irregular ring around a hill: radius wobbles with the angle. */
function ring(cx: number, cy: number, rx: number, ry: number, seed: number): string {
  const steps = 14;
  const points: Point[] = [];
  for (let i = 0; i < steps; i += 1) {
    const angle = (i / steps) * Math.PI * 2;
    const wobble =
      1 +
      0.09 * Math.sin(angle * 2 + seed) +
      0.05 * Math.sin(angle * 3 + seed * 1.7) +
      0.03 * Math.sin(angle * 5 + seed * 0.6);
    points.push([cx + Math.cos(angle) * rx * wobble, cy + Math.sin(angle) * ry * wobble]);
  }
  return closedCurve(points);
}

const RINGS = [
  { rx: 90, ry: 56, seed: 0.4 },
  { rx: 190, ry: 118, seed: 0.9 },
  { rx: 300, ry: 184, seed: 1.5 },
  { rx: 430, ry: 258, seed: 2.1 },
  { rx: 580, ry: 340, seed: 2.8 },
  { rx: 750, ry: 430, seed: 3.4 },
];

/**
 * Topographic contour lines behind the hero. Decorative: hidden from
 * assistive tech, and drawn in once on load (see `.contour` in globals.css).
 */
export default function Contour() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 1200 460"
      preserveAspectRatio="xMaxYMid slice"
      className="contour pointer-events-none absolute inset-0 h-full w-full text-contour opacity-30 md:opacity-100"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"

    >
      {RINGS.map(({ rx, ry, seed }) => (
        <path
          key={seed}
          d={ring(930, 210, rx, ry, seed)}
          pathLength={1}
          vectorEffect="non-scaling-stroke"
        />
      ))}
    </svg>
  );
}
