import { Point, ReferenceLine, Unit } from '../types/harness';

/**
 * Calculate Euclidean distance between two points
 */
export function distance(p1: Point, p2: Point): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calculate total length of a polyline path
 */
export function polylineLength(points: Point[]): number {
  if (points.length < 2) return 0;
  let total = 0;
  for (let i = 0; i < points.length - 1; i++) {
    total += distance(points[i], points[i + 1]);
  }
  return total;
}

/**
 * Calculate individual segment lengths
 */
export function segmentLengths(points: Point[]): number[] {
  const lengths: number[] = [];
  for (let i = 0; i < points.length - 1; i++) {
    lengths.push(distance(points[i], points[i + 1]));
  }
  return lengths;
}

/**
 * Scale factor: how many units per pixel
 */
export function getScaleRatio(ref: ReferenceLine): number {
  if (!ref.calibrated) return 1;
  const pxDist = distance(ref.p1, ref.p2);
  if (pxDist <= 0.0001) return 1;
  return ref.realDistance / pxDist;
}

/**
 * Convert pixel distance to real world distance
 */
export function pixelsToReal(px: number, ref: ReferenceLine): number {
  const ratio = getScaleRatio(ref);
  return px * ratio;
}

/**
 * Convert real world distance to pixels
 */
export function realToPixels(real: number, ref: ReferenceLine): number {
  const ratio = getScaleRatio(ref);
  if (ratio <= 0.000001) return 0;
  return real / ratio;
}

/**
 * Format real world measurement nicely
 */
export function formatMeasurement(value: number, unit: Unit, decimals?: number): string {
  let dec = decimals;
  if (dec === undefined) {
    if (unit === 'm' || unit === 'ft') dec = 2;
    else if (unit === 'cm' || unit === 'in') dec = 1;
    else dec = 1;
  }
  return `${value.toFixed(dec)} ${unit}`;
}

/**
 * Unit conversion factors to mm
 */
const UNIT_TO_MM: Record<Unit, number> = {
  mm: 1,
  cm: 10,
  m: 1000,
  in: 25.4,
  ft: 304.8,
};

/**
 * Convert between units
 */
export function convertUnit(val: number, from: Unit, to: Unit): number {
  const valInMm = val * UNIT_TO_MM[from];
  return valInMm / UNIT_TO_MM[to];
}

/**
 * Midpoint between two points
 */
export function midpoint(p1: Point, p2: Point): Point {
  return {
    x: (p1.x + p2.x) / 2,
    y: (p1.y + p2.y) / 2,
  };
}

/**
 * Angle in radians between two points
 */
export function angleBetween(p1: Point, p2: Point): number {
  return Math.atan2(p2.y - p1.y, p2.x - p1.x);
}

/**
 * Angle in degrees
 */
export function angleDegrees(p1: Point, p2: Point): number {
  return (angleBetween(p1, p2) * 180) / Math.PI;
}

/**
 * Normal unit vector (perpendicular) to segment p1->p2
 */
export function normalVector(p1: Point, p2: Point, length = 1): Point {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len === 0) return { x: 0, y: -length };
  return {
    x: (-dy / len) * length,
    y: (dx / len) * length,
  };
}

/**
 * Check if a point is close to a line segment
 */
export function distanceToSegment(p: Point, a: Point, b: Point): { dist: number; closestPoint: Point; t: number } {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const l2 = dx * dx + dy * dy;
  if (l2 === 0) {
    return { dist: distance(p, a), closestPoint: a, t: 0 };
  }
  let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / l2;
  t = Math.max(0, Math.min(1, t));
  const closestPoint: Point = {
    x: a.x + t * dx,
    y: a.y + t * dy,
  };
  return {
    dist: distance(p, closestPoint),
    closestPoint,
    t,
  };
}

/**
 * Snap point to nearby snap targets (other vertices, connector pins)
 */
export function snapToPoint(
  target: Point,
  snapCandidates: Point[],
  threshold = 12
): { snapped: boolean; point: Point } {
  let closestDist = Infinity;
  let bestPoint = target;

  for (const candidate of snapCandidates) {
    const d = distance(target, candidate);
    if (d < threshold && d < closestDist) {
      closestDist = d;
      bestPoint = candidate;
    }
  }

  return {
    snapped: closestDist !== Infinity,
    point: bestPoint,
  };
}

/**
 * Generate rounded polyline SVG path with fillets at vertices
 */
export function generateSmoothPolylinePath(points: Point[], cornerRadius = 14): string {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  if (points.length === 2) return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;

  let path = `M ${points[0].x} ${points[0].y}`;

  for (let i = 1; i < points.length - 1; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const next = points[i + 1];

    const dPrev = distance(curr, prev);
    const dNext = distance(curr, next);
    const r = Math.min(cornerRadius, dPrev / 2, dNext / 2);

    if (r <= 1) {
      path += ` L ${curr.x} ${curr.y}`;
      continue;
    }

    // Point before vertex
    const tPrev = (dPrev - r) / dPrev;
    const pBefore = {
      x: prev.x + (curr.x - prev.x) * tPrev,
      y: prev.y + (curr.y - prev.y) * tPrev,
    };

    // Point after vertex
    const tNext = r / dNext;
    const pAfter = {
      x: curr.x + (next.x - curr.x) * tNext,
      y: curr.y + (next.y - curr.y) * tNext,
    };

    path += ` L ${pBefore.x} ${pBefore.y} Q ${curr.x} ${curr.y} ${pAfter.x} ${pAfter.y}`;
  }

  const last = points[points.length - 1];
  path += ` L ${last.x} ${last.y}`;
  return path;
}

