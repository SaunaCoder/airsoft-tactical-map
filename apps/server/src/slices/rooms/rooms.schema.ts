import mongoose from 'mongoose';
import type { InsertRoom, StoredRoom } from './rooms.service.ts';

const memberSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    lastSeen: { type: Date, required: true },
  },
  { _id: false },
);

const roomSchema = new mongoose.Schema(
  {
    // Unique index is the collision check: a duplicate insert fails atomically, no read-then-write race.
    code: { type: String, required: true, unique: true },
    leaderTokenHash: { type: String, required: true },
    members: { type: [memberSchema], default: [] },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export const RoomModel = mongoose.model('Room', roomSchema);

const DUPLICATE_KEY = 11000;

export const insertRoom: InsertRoom = async (room) => {
  try {
    await RoomModel.create(room);
    return true;
  } catch (err) {
    if (err instanceof mongoose.mongo.MongoServerError && err.code === DUPLICATE_KEY) return false;
    throw err;
  }
};

export async function findRoom(code: string): Promise<StoredRoom | null> {
  return RoomModel.findOne({ code }, { code: 1, leaderTokenHash: 1, members: 1 }).lean();
}

/** Renames and touches an existing member, or appends a new one. Atomic per member, no read-modify-write. */
export async function upsertMember(code: string, member: { id: string; name: string }, now: Date): Promise<void> {
  const updated = await RoomModel.updateOne(
    { code, 'members.id': member.id },
    { $set: { 'members.$.name': member.name, 'members.$.lastSeen': now } },
  );
  if (updated.matchedCount > 0) return;
  // The `$ne` guard keeps a racing duplicate join from pushing the same member twice.
  await RoomModel.updateOne(
    { code, 'members.id': { $ne: member.id } },
    { $push: { members: { ...member, lastSeen: now } } },
  );
}

export async function touchMember(code: string, memberId: string, now: Date): Promise<void> {
  await RoomModel.updateOne({ code, 'members.id': memberId }, { $set: { 'members.$.lastSeen': now } });
}
