import { z } from 'zod';

/** GeoJSON position: [lng, lat]. Not Leaflet's [lat, lng]. */
export const lngLatSchema = z.tuple([z.number().min(-180).max(180), z.number().min(-90).max(90)]);

export type LngLat = z.infer<typeof lngLatSchema>;
