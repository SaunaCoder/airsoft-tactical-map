import { describe, expect, it } from 'vitest';
import { drawingSchema, mapFeatureSchema } from './drawings.ts';

const square = [
  [30.52, 50.45],
  [30.53, 50.45],
  [30.53, 50.46],
  [30.52, 50.45],
];

describe('drawingSchema', () => {
  it.each([
    { geometry: { type: 'Point', coordinates: [30.52, 50.45] }, properties: { kind: 'marker' } },
    { geometry: { type: 'LineString', coordinates: square.slice(0, 2) }, properties: { kind: 'arrow' } },
    { geometry: { type: 'Polygon', coordinates: [square] }, properties: { kind: 'zone' } },
  ])('accepts a $properties.kind', (drawing) => {
    expect(drawingSchema.safeParse(drawing).success).toBe(true);
  });

  it.each([
    ['kind that does not match the geometry', { type: 'Point', coordinates: [30.52, 50.45] }, 'zone'],
    ['line with one vertex', { type: 'LineString', coordinates: [[30.52, 50.45]] }, 'line'],
    ['unclosed polygon ring', { type: 'Polygon', coordinates: [square.slice(0, 3).concat([[1, 1]])] }, 'zone'],
    ['swapped [lat, lng] past 90', { type: 'Point', coordinates: [50.45, 130] }, 'marker'],
    ['unknown kind', { type: 'Point', coordinates: [30.52, 50.45] }, 'nuke'],
  ])('rejects %s', (_label, geometry, kind) => {
    expect(drawingSchema.safeParse({ geometry, properties: { kind } }).success).toBe(false);
  });

  it('rejects oversized shapes', () => {
    const coordinates = Array.from({ length: 1001 }, (_, i) => [30 + i / 10_000, 50]);
    expect(drawingSchema.safeParse({ geometry: { type: 'LineString', coordinates }, properties: { kind: 'line' } }).success).toBe(
      false,
    );
  });
});

describe('mapFeatureSchema', () => {
  it('requires a Feature with a uuid', () => {
    const drawing = { geometry: { type: 'Point', coordinates: [30.52, 50.45] }, properties: { kind: 'marker' } };
    expect(mapFeatureSchema.safeParse({ ...drawing, type: 'Feature', id: '11111111-1111-4111-8111-111111111111' }).success).toBe(true);
    expect(mapFeatureSchema.safeParse({ ...drawing, type: 'Feature', id: '1' }).success).toBe(false);
    expect(mapFeatureSchema.safeParse(drawing).success).toBe(false);
  });
});
