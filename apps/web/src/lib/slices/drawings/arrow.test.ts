import type { LngLat } from '@airsoft/shared';
import { describe, expect, it } from 'vitest';
import { arrowHead } from './arrow.ts';

const metresBetween = (a: LngLat, b: LngLat) => {
  const mPerDegLng = 111_320 * Math.cos((a[1] * Math.PI) / 180);
  return Math.hypot((b[0] - a[0]) * mPerDegLng, (b[1] - a[1]) * 111_320);
};

describe('arrowHead', () => {
  const from: LngLat = [30.52, 50.45];
  const northTo: LngLat = [30.52, 50.4518]; // ~200 m north

  it('puts the tip on the line end and both wings behind it, symmetric', () => {
    const [left, tip, right] = arrowHead(from, northTo);
    expect(tip).toEqual(northTo);
    expect(left[1]).toBeLessThan(tip[1]);
    expect(right[1]).toBeLessThan(tip[1]);
    expect(left[0] - tip[0]).toBeCloseTo(-(right[0] - tip[0]), 10);
  });

  it('caps the head at 25 m on long lines', () => {
    const [left, tip] = arrowHead(from, northTo);
    expect(metresBetween(left, tip)).toBeCloseTo(25, 0);
  });

  it('shrinks the head on short last segments', () => {
    const short: LngLat = [30.52, 50.45 + 10 / 111_320]; // 10 m
    const [left, tip] = arrowHead(from, short);
    expect(metresBetween(left, tip)).toBeCloseTo(4, 0);
  });

  it('degrades to a point for a zero-length segment instead of NaN', () => {
    expect(arrowHead(from, from).flat().every(Number.isFinite)).toBe(true);
  });
});
