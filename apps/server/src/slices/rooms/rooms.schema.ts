import mongoose from 'mongoose';
import type { LngLat } from '@airsoft/shared';
import { nextExpiry, type InsertRoom, type StoredRoom } from './rooms.service.ts';

const memberSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    lastSeen: { type: Date, required: true },
    // GeoJSON order [lng, lat]. No default, so members without a fix have no field at all.
    lastPosition: { type: [Number], default: undefined },
  },
  { _id: false },
);

const roomSchema = new mongoose.Schema(
  {
    // Unique index is the collision check: a duplicate insert fails atomically, no read-then-write race.
    code: { type: String, required: true, unique: true },
    leaderTokenHash: { type: String, required: true },
    members: { type: [memberSchema], default: [] },
    // GeoJSON Features, validated with the shared Zod schema before every write.
    features: { type: [mongoose.Schema.Types.Mixed], default: [] },
    // TTL index: MongoDB deletes the room once this passes (checked about once a minute).
    expiresAt: { type: Date, required: true, expires: 0 },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export const RoomModel = mongoose.model('Room', roomSchema);

const DUPLICATE_KEY = 11000;

/** `$set` fields that mark the room as active at `now`. Merge into every room write. */
export function activeAt(now: Date): { expiresAt: Date } {
  return { expiresAt: nextExpiry(now) };
}

// ponytail: one-off migration for rooms created before expiry existed; cheap no-op once none are left.
export async function backfillRoomExpiry(now = new Date()): Promise<void> {
  await RoomModel.updateMany({ expiresAt: { $exists: false } }, { $set: activeAt(now) });
}

export const insertRoom: InsertRoom = async (room) => {
  try {
    await RoomModel.create({ ...room, ...activeAt(new Date()) });
    return true;
  } catch (err) {
    if (err instanceof mongoose.mongo.MongoServerError && err.code === DUPLICATE_KEY) return false;
    throw err;
  }
};

export async function findRoom(code: string): Promise<StoredRoom | null> {
  // Typed at the DB boundary: Mongoose sees number[], but only Zod-validated [lng, lat] tuples are ever written.
  return RoomModel.findOne({ code }, { code: 1, leaderTokenHash: 1, members: 1, features: 1 }).lean<StoredRoom>();
}

/** Renames and touches an existing member, or appends a new one. Atomic per member, no read-modify-write. */
export async function upsertMember(code: string, member: { id: string; name: string }, now: Date): Promise<void> {
  const updated = await RoomModel.updateOne(
    { code, 'members.id': member.id },
    { $set: { 'members.$.name': member.name, 'members.$.lastSeen': now, ...activeAt(now) } },
  );
  if (updated.matchedCount > 0) return;
  // The `$ne` guard keeps a racing duplicate join from pushing the same member twice.
  await RoomModel.updateOne(
    { code, 'members.id': { $ne: member.id } },
    { $push: { members: { ...member, lastSeen: now } }, $set: activeAt(now) },
  );
}

export async function touchMember(code: string, memberId: string, now: Date): Promise<void> {
  await RoomModel.updateOne({ code, 'members.id': memberId }, { $set: { 'members.$.lastSeen': now, ...activeAt(now) } });
}

export async function setMemberPosition(code: string, memberId: string, position: LngLat, now: Date): Promise<void> {
  await RoomModel.updateOne(
    { code, 'members.id': memberId },
    { $set: { 'members.$.lastPosition': position, 'members.$.lastSeen': now, ...activeAt(now) } },
  );
}
