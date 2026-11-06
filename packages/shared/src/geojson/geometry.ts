import { z } from 'zod';
import { lngLatSchema, type LngLat } from './position.ts';

/** Upper bound per line or ring, so one payload can't carry an arbitrarily large shape. */
export const MAX_VERTICES = 1000;

const samePosition = (a: LngLat | undefined, b: LngLat | undefined) => !!a && !!b && a[0] === b[0] && a[1] === b[1];

export const pointSchema = z.object({ type: z.literal('Point'), coordinates: lngLatSchema });

export const lineStringSchema = z.object({
  type: z.literal('LineString'),
  coordinates: z.array(lngLatSchema).min(2).max(MAX_VERTICES),
});

/** GeoJSON linear ring: at least 4 positions, first equals last. */
const linearRingSchema = z
  .array(lngLatSchema)
  .min(4)
  .max(MAX_VERTICES)
  .refine((ring) => samePosition(ring[0], ring.at(-1)), 'Polygon ring must be closed');

export const polygonSchema = z.object({
  type: z.literal('Polygon'),
  coordinates: z.array(linearRingSchema).min(1).max(10),
});
