import { z } from 'zod';
import { lineStringSchema, pointSchema, polygonSchema } from '../geojson/geometry.ts';

export const MAX_FEATURES_PER_ROOM = 500;

// Each drawing kind is tied to exactly one geometry type, so a "zone" can never arrive as a Point.
const markerDrawing = z.object({ geometry: pointSchema, properties: z.object({ kind: z.literal('marker') }) });
const lineDrawing = z.object({
  geometry: lineStringSchema,
  properties: z.object({ kind: z.enum(['line', 'arrow']) }),
});
const zoneDrawing = z.object({ geometry: polygonSchema, properties: z.object({ kind: z.literal('zone') }) });

/** `feature:add`: a new drawing. The server assigns the id. */
export const drawingSchema = z.union([markerDrawing, lineDrawing, zoneDrawing]);

const featureFields = { type: z.literal('Feature'), id: z.uuid() };

/** A drawing stored in a room: a GeoJSON Feature with a server-assigned id. Also the `feature:update` payload. */
export const mapFeatureSchema = z.union([
  markerDrawing.extend(featureFields),
  lineDrawing.extend(featureFields),
  zoneDrawing.extend(featureFields),
]);

/** `feature:delete` and `feature:deleted`. */
export const featureRefSchema = z.object({ id: z.uuid() });

export const featureCollectionSchema = z.object({
  type: z.literal('FeatureCollection'),
  features: z.array(mapFeatureSchema),
});

export type Drawing = z.infer<typeof drawingSchema>;
export type DrawingKind = Drawing['properties']['kind'];
export type MapFeature = z.infer<typeof mapFeatureSchema>;
export type FeatureRef = z.infer<typeof featureRefSchema>;
export type FeatureCollection = z.infer<typeof featureCollectionSchema>;
