import type { NextFunction, Request, Response } from 'express';
import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { HttpError, errorHandler, parseOr } from './http.ts';

function fakeResponse() {
  const res = { status: vi.fn(), json: vi.fn() };
  res.status.mockReturnValue(res);
  return res;
}

const handle = (err: unknown) => {
  const res = fakeResponse();
  errorHandler(err, {} as Request, res as unknown as Response, vi.fn() as NextFunction);
  return res;
};

describe('parseOr', () => {
  const schema = z.object({ name: z.string().min(1, 'Enter a name') });

  it('returns parsed data', () => {
    expect(parseOr(schema, { name: 'A' })).toEqual({ name: 'A' });
  });

  it('throws a 400 with the first issue by default, or the given status', () => {
    expect(() => parseOr(schema, { name: '' })).toThrow(expect.objectContaining({ status: 400, message: 'Enter a name' }));
    expect(() => parseOr(schema, undefined, 401)).toThrow(expect.objectContaining({ status: 401 }));
  });
});

describe('errorHandler', () => {
  it('sends HttpError status and message', () => {
    const res = handle(new HttpError(404, 'Template not found'));
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Template not found' });
  });

  it('maps body-parser errors to their 4xx status without details', () => {
    const res = handle(Object.assign(new SyntaxError('Unexpected token } in JSON at position 7'), { status: 400 }));
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid request body' });
  });

  it('hides unexpected errors behind a 500', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const res = handle(new Error('connection string mongodb://secret'));
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
  });
});
