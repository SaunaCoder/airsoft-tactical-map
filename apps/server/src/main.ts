// ponytail: runs on Node's native TypeScript type stripping (Node 24+), no build step.
// Requires erasable-only syntax and explicit .ts import extensions (enforced by tsconfig).
import express from 'express';
import mongoose from 'mongoose';
import { config } from './core/config.ts';

const app = express();

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, db: mongoose.connection.readyState === 1 });
});

await mongoose.connect(config.MONGO_URL, { serverSelectionTimeoutMS: 5000 });

app.listen(config.PORT, () => {
  console.log(`server listening on http://localhost:${config.PORT}`);
});
