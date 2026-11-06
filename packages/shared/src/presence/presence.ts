import { z } from 'zod';
import { lngLatSchema } from '../geojson/position.ts';
import { memberIdSchema } from '../rooms/rooms.ts';

/** `position:update`: the sender's own GPS fix. Who sent it comes from the socket session, never the payload. */
export const positionUpdateSchema = z.object({ position: lngLatSchema });

/** `position:updated`: broadcast to the rest of the room. */
export const positionUpdatedSchema = z.object({ memberId: memberIdSchema, position: lngLatSchema });

export type PositionUpdate = z.infer<typeof positionUpdateSchema>;
export type PositionUpdated = z.infer<typeof positionUpdatedSchema>;
