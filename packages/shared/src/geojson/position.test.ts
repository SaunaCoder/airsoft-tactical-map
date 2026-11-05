import { describe, expect, it } from 'vitest';
import { lngLatSchema } from './position.ts';

describe('lngLatSchema', () => {
  it('accepts [lng, lat]', () => {
    expect(lngLatSchema.parse([30.52, 50.45])).toEqual([30.52, 50.45]);
  });

  it('rejects out-of-range latitude (catches swapped [lat, lng] past 90)', () => {
    expect(lngLatSchema.safeParse([10, 120]).success).toBe(false);
  });

  it('rejects wrong arity', () => {
    expect(lngLatSchema.safeParse([1]).success).toBe(false);
  });
});
