// ponytail: runs on Node's native TypeScript type stripping (Node 24+), no build step.
// Requires erasable-only syntax and explicit .ts import extensions (enforced by tsconfig).
import express from 'express';
import mongoose from 'mongoose';
import { config } from './core/config.ts';
import { errorHandler } from './core/http.ts';
import { createSocketServer } from './core/socket.ts';
import { registerDrawingHandlers } from './slices/drawings/index.ts';
import { registerPresenceHandlers } from './slices/presence/index.ts';
import { backfillRoomExpiry, registerRoomHandlers, roomsRouter } from './slices/rooms/index.ts';
import { registerTemplateHandlers, templatesRouter } from './slices/templates/index.ts';

const app = express();

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, db: mongoose.connection.readyState === 1 });
});

app.use('/api/rooms', roomsRouter);
app.use('/api/templates', templatesRouter);
app.use(errorHandler);

await mongoose.connect(config.MONGO_URL, { serverSelectionTimeoutMS: 5000 });
await backfillRoomExpiry();

const httpServer = app.listen(config.PORT, () => {
  console.log(`server listening on http://localhost:${config.PORT}`);
});

const io = createSocketServer(httpServer);
io.on('connection', (socket) => {
  registerRoomHandlers(io, socket);
  registerPresenceHandlers(socket);
  registerDrawingHandlers(socket);
  registerTemplateHandlers(socket);
});
