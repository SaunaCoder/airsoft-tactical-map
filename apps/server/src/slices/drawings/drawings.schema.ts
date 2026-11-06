import { MAX_FEATURES_PER_ROOM, type MapFeature } from '@airsoft/shared';
import { RoomModel } from '../rooms/index.ts';

// Features live on the room document. Every write is a single atomic update; each resolves false
// when nothing matched, so the caller can tell the client why.

/** Appends unless the room already holds MAX_FEATURES_PER_ROOM (checked atomically in the filter). */
export async function pushFeature(code: string, feature: MapFeature): Promise<boolean> {
  const result = await RoomModel.updateOne(
    { code, [`features.${MAX_FEATURES_PER_ROOM - 1}`]: { $exists: false } },
    { $push: { features: feature } },
  );
  return result.matchedCount > 0;
}

export async function replaceFeature(code: string, feature: MapFeature): Promise<boolean> {
  const result = await RoomModel.updateOne({ code, 'features.id': feature.id }, { $set: { 'features.$': feature } });
  return result.matchedCount > 0;
}

export async function pullFeature(code: string, id: string): Promise<boolean> {
  const result = await RoomModel.updateOne({ code, 'features.id': id }, { $pull: { features: { id } } });
  return result.matchedCount > 0;
}
