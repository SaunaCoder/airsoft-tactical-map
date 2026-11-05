import mongoose from 'mongoose';
import type { InsertRoom } from './rooms.service.ts';

// ponytail: only the fields used so far; members/features arrive with the slices that use them.
const roomSchema = new mongoose.Schema(
  {
    // Unique index is the collision check: a duplicate insert fails atomically, no read-then-write race.
    code: { type: String, required: true, unique: true },
    leaderTokenHash: { type: String, required: true },
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
