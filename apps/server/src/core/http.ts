import type { ErrorRequestHandler } from 'express';
import type { z } from 'zod';

/** An expected REST failure: the status and message are sent to the client as `{ error }`. */
export class HttpError extends Error {
  readonly status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

/** Parses untrusted input or throws an HttpError (400 by default) with the first Zod issue. */
export function parseOr<S extends z.ZodType>(schema: S, value: unknown, status = 400): z.infer<S> {
  const result = schema.safeParse(value);
  if (!result.success) throw new HttpError(status, result.error.issues[0]?.message ?? 'Invalid request');
  return result.data;
}

/** JSON errors instead of Express's HTML page. Internals are never sent to the client. */
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.message });
    return;
  }
  // body-parser errors (malformed JSON, body too large) carry a client-safe 4xx status.
  const status: unknown = (err as { status?: unknown })?.status;
  if (typeof status === 'number' && status >= 400 && status < 500) {
    res.status(status).json({ error: 'Invalid request body' });
    return;
  }
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
};
