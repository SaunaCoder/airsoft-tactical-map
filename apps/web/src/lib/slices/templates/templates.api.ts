import {
  OWNER_KEY_HEADER,
  templateListSchema,
  templateSchema,
  type Template,
  type TemplateInput,
  type TemplateSummary,
} from '@airsoft/shared';
import { ownerKey } from './templates.storage.ts';

async function request(path: string, init: RequestInit = {}, fetchFn = fetch): Promise<Response> {
  const res = await fetchFn(path, {
    ...init,
    headers: { 'content-type': 'application/json', [OWNER_KEY_HEADER]: ownerKey(), ...init.headers },
  });
  if (!res.ok && res.status !== 404) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? `Request failed: HTTP ${res.status}`);
  }
  return res;
}

export async function listTemplates(): Promise<TemplateSummary[]> {
  return templateListSchema.parse(await (await request('/api/templates')).json());
}

/** `null` when the template doesn't exist or belongs to another device. */
export async function getTemplate(id: string, fetchFn = fetch): Promise<Template | null> {
  const res = await request(`/api/templates/${id}`, {}, fetchFn);
  return res.status === 404 ? null : templateSchema.parse(await res.json());
}

/** Creates when `id` is null, otherwise replaces. */
export async function saveTemplate(id: string | null, input: TemplateInput): Promise<Template> {
  const res = await request(id ? `/api/templates/${id}` : '/api/templates', {
    method: id ? 'PUT' : 'POST',
    body: JSON.stringify(input),
  });
  if (res.status === 404) throw new Error('Template not found');
  return templateSchema.parse(await res.json());
}

export async function deleteTemplate(id: string): Promise<void> {
  await request(`/api/templates/${id}`, { method: 'DELETE' });
}
