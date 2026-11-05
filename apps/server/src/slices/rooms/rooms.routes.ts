import { Router } from 'express';
import { insertRoom } from './rooms.schema.ts';
import { createRoom } from './rooms.service.ts';

export const roomsRouter = Router();

// No request body: anyone can create a room and becomes its leader.
roomsRouter.post('/', async (_req, res) => {
  res.status(201).json(await createRoom(insertRoom));
});
