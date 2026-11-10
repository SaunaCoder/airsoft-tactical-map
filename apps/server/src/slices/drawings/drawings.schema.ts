import { MAX_FEATURES_PER_ROOM, type MapFeature } from '@airsoft/shared';
import { RoomModel, activeAt } from '../rooms/index.ts';

// Features live on the room document. Every write is a single atomic update; each resolves false
// when nothing matched, so the caller can tell the client why.

/** Appends all or nothing, unless the room would exceed MAX_FEATURES_PER_ROOM (checked atomically in the filter). */
export async function pushFeatures(code: string, features: MapFeature[]): Promise<boolean> {
  if (features.length === 0) return true;
  if (features.length > MAX_FEATURES_PER_ROOM) return false;
  // "There is no element at index MAX - n" means the room holds at most MAX - n features.
  const result = await RoomModel.updateOne(
    { code, [`features.${MAX_FEATURES_PER_ROOM - features.length}`]: { $exists: false } },
    { $push: { features: { $each: features } }, $set: activeAt(new Date()) },
  );
  return result.matchedCount > 0;
}

export async function replaceFeature(code: string, feature: MapFeature): Promise<boolean> {
  const result = await RoomModel.updateOne({ code, 'features.id': feature.id }, { $set: { 'features.$': feature, ...activeAt(new Date()) } });
  return result.matchedCount > 0;
}

export async function pullFeature(code: string, id: string): Promise<boolean> {
  const result = await RoomModel.updateOne({ code, 'features.id': id }, { $pull: { features: { id } }, $set: activeAt(new Date()) });
  return result.matchedCount > 0;
}
