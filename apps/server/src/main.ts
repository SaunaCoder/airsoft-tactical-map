// ponytail: runs on Node's native TypeScript type stripping (Node 24+), no build step.
// Requires erasable-only syntax and explicit .ts import extensions (enforced by tsconfig).
import express, { type ErrorRequestHandler } from 'express';
import mongoose from 'mongoose';
import { config } from './core/config.ts';
import { createSocketServer } from './core/socket.ts';
import { registerPresenceHandlers } from './slices/presence/index.ts';
import { registerRoomHandlers, roomsRouter } from './slices/rooms/index.ts';

const app = express();

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, db: mongoose.connection.readyState === 1 });
});

app.use('/api/rooms', roomsRouter);

// JSON instead of Express's default HTML page; never leak internals to the client.
const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
};
app.use(errorHandler);

await mongoose.connect(config.MONGO_URL, { serverSelectionTimeoutMS: 5000 });

const httpServer = app.listen(config.PORT, () => {
  console.log(`server listening on http://localhost:${config.PORT}`);
});

const io = createSocketServer(httpServer);
io.on('connection', (socket) => {
  registerRoomHandlers(io, socket);
  registerPresenceHandlers(socket);
});
