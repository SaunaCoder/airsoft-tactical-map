import { createRoomResponseSchema, type CreateRoomResponse } from '@airsoft/shared';

export async function createRoom(): Promise<CreateRoomResponse> {
  const res = await fetch('/api/rooms', { method: 'POST' });
  if (!res.ok) throw new Error(`Create room failed: HTTP ${res.status}`);
  return createRoomResponseSchema.parse(await res.json());
}
