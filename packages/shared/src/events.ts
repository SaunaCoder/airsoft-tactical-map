import type { Member, RoomJoin, RoomState } from './rooms/rooms.ts';

/** Every socket event name. Apps import these; never hardcode the strings. */
export const Events = {
  roomJoin: 'room:join',
  roomState: 'room:state',
  memberJoined: 'member:joined',
  memberLeft: 'member:left',
  error: 'error',
} as const;

/** Sent only to the client whose event failed. */
export type SocketError = { event: string; message: string };

// Payload types describe what a well-behaved client sends. The server still parses every payload
// with its Zod schema, because the wire carries `unknown`.
export type ClientToServerEvents = {
  [Events.roomJoin]: (payload: RoomJoin) => void;
};

export type ServerToClientEvents = {
  [Events.roomState]: (state: RoomState) => void;
  [Events.memberJoined]: (member: Member) => void;
  [Events.memberLeft]: (payload: { memberId: string }) => void;
  [Events.error]: (error: SocketError) => void;
};
