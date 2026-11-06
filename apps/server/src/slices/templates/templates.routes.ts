import { OWNER_KEY_HEADER, ownerKeySchema, templateIdSchema, templateInputSchema } from '@airsoft/shared';
import express, { Router, type Request } from 'express';
import { HttpError, parseOr } from '../../core/http.ts';
import { createTemplate, deleteTemplate, getTemplate, listTemplates, updateTemplate } from './templates.service.ts';

export const templatesRouter = Router();

// 500 features x up to 1000 vertices fits well below this; anything bigger is rejected with 413.
templatesRouter.use(express.json({ limit: '2mb' }));

const ownerKeyOf = (req: Request) => parseOr(ownerKeySchema, req.get(OWNER_KEY_HEADER), 401);
// An unparseable id can't exist, so it's a 404 like any other missing template.
const idOf = (req: Request) => parseOr(templateIdSchema, req.params.id, 404);

function found<T>(value: T | null | false): T {
  if (!value) throw new HttpError(404, 'Template not found');
  return value;
}

templatesRouter.get('/', async (req, res) => {
  res.json(await listTemplates(ownerKeyOf(req)));
});

templatesRouter.post('/', async (req, res) => {
  const ownerKey = ownerKeyOf(req);
  res.status(201).json(await createTemplate(ownerKey, parseOr(templateInputSchema, req.body)));
});

templatesRouter.get('/:id', async (req, res) => {
  res.json(found(await getTemplate(ownerKeyOf(req), idOf(req))));
});

templatesRouter.put('/:id', async (req, res) => {
  const ownerKey = ownerKeyOf(req);
  const id = idOf(req);
  res.json(found(await updateTemplate(ownerKey, id, parseOr(templateInputSchema, req.body))));
});

templatesRouter.delete('/:id', async (req, res) => {
  found(await deleteTemplate(ownerKeyOf(req), idOf(req)));
  res.status(204).end();
});
