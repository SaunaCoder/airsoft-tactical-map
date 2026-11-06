import { error } from '@sveltejs/kit';
import { getTemplate } from '#lib/slices/templates/index.ts';
import type { PageLoad } from './$types';

// Map editor + localStorage owner key: client only.
export const ssr = false;

export const load: PageLoad = async ({ params, fetch }) => {
  if (params.id === 'new') return { template: null };
  const template = await getTemplate(params.id, fetch);
  if (!template) error(404, 'Template not found');
  return { template };
};
