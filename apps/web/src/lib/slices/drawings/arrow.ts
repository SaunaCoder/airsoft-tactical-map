import type { LngLat } from '@airsoft/shared';

const M_PER_DEG_LAT = 111_320;
const HEAD_MAX_M = 25;
const HEAD_SPREAD = Math.PI / 6; // 30 degrees each side

/**
 * Arrowhead at the end of the segment `from -> to`, as a [left wing, tip, right wing] polyline.
 * Sized in metres (max 25 m, or 40% of a short last segment), using a local flat-earth approximation,
 * which is plenty accurate over a game field.
 */
export function arrowHead(from: LngLat, to: LngLat): [LngLat, LngLat, LngLat] {
  const mPerDegLng = M_PER_DEG_LAT * Math.cos((to[1] * Math.PI) / 180);
  const dx = (to[0] - from[0]) * mPerDegLng;
  const dy = (to[1] - from[1]) * M_PER_DEG_LAT;
  const size = Math.min(HEAD_MAX_M, Math.hypot(dx, dy) * 0.4);
  const back = Math.atan2(dy, dx) + Math.PI;

  const wing = (angle: number): LngLat => [
    to[0] + (Math.cos(angle) * size) / mPerDegLng,
    to[1] + (Math.sin(angle) * size) / M_PER_DEG_LAT,
  ];
  return [wing(back - HEAD_SPREAD), to, wing(back + HEAD_SPREAD)];
}
