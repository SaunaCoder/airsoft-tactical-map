import type { Drawing, FeatureRef, MapFeature } from './drawings/drawings.ts';
import type { PositionUpdate, PositionUpdated } from './presence/presence.ts';
import type { Member, RoomJoin, RoomState } from './rooms/rooms.ts';
import type { TemplateLoad } from './templates/templates.ts';

/** Every socket event name. Apps import these; never hardcode the strings. */
export const Events = {
  roomJoin: 'room:join',
  roomState: 'room:state',
  memberJoined: 'member:joined',
  memberLeft: 'member:left',
  positionUpdate: 'position:update',
  positionUpdated: 'position:updated',
  featureAdd: 'feature:add',
  featureUpdate: 'feature:update',
  featureDelete: 'feature:delete',
  featureAdded: 'feature:added',
  featureUpdated: 'feature:updated',
  featureDeleted: 'feature:deleted',
  templateLoad: 'template:load',
  error: 'error',
} as const;

/** Sent only to the client whose event failed. */
export type SocketError = { event: string; message: string };

// Payload types describe what a well-behaved client sends. The server still parses every payload
// with its Zod schema, because the wire carries `unknown`.
export type ClientToServerEvents = {
  [Events.roomJoin]: (payload: RoomJoin) => void;
  [Events.positionUpdate]: (payload: PositionUpdate) => void;
  [Events.featureAdd]: (drawing: Drawing) => void;
  [Events.featureUpdate]: (feature: MapFeature) => void;
  [Events.featureDelete]: (ref: FeatureRef) => void;
  [Events.templateLoad]: (payload: TemplateLoad) => void;
};

export type ServerToClientEvents = {
  [Events.roomState]: (state: RoomState) => void;
  [Events.memberJoined]: (member: Member) => void;
  [Events.memberLeft]: (payload: { memberId: string }) => void;
  [Events.positionUpdated]: (payload: PositionUpdated) => void;
  [Events.featureAdded]: (feature: MapFeature) => void;
  [Events.featureUpdated]: (feature: MapFeature) => void;
  [Events.featureDeleted]: (ref: FeatureRef) => void;
  [Events.error]: (error: SocketError) => void;
};
