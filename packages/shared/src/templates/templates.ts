import { z } from 'zod';
import { featureCollectionSchema } from '../drawings/drawings.ts';
import { lngLatSchema } from '../geojson/position.ts';

/** No accounts: templates belong to a random key stored on the device that created them. */
export const OWNER_KEY_HEADER = 'x-owner-key';
export const ownerKeySchema = z.string().min(32).max(128);

/** MongoDB ObjectId as a hex string. */
export const templateIdSchema = z.string().regex(/^[a-f\d]{24}$/, 'Invalid template id');

/** Body of `POST /api/templates` and `PUT /api/templates/:id`. */
export const templateInputSchema = z.object({
  name: z.string().trim().min(1, 'Enter a name').max(60, 'Max 60 characters'),
  center: lngLatSchema,
  zoom: z.number().min(0).max(22),
  features: featureCollectionSchema,
});

export const templateSchema = templateInputSchema.extend({
  id: templateIdSchema,
  updatedAt: z.iso.datetime(),
});

/** `GET /api/templates`: newest first, without features. */
export const templateSummarySchema = templateSchema.omit({ features: true });
export const templateListSchema = z.array(templateSummarySchema);

/** `template:load`: leader only. The owner key proves the leader may read that template. */
export const templateLoadSchema = z.object({ templateId: templateIdSchema, ownerKey: ownerKeySchema });

export type TemplateInput = z.infer<typeof templateInputSchema>;
export type Template = z.infer<typeof templateSchema>;
export type TemplateSummary = z.infer<typeof templateSummarySchema>;
export type TemplateLoad = z.infer<typeof templateLoadSchema>;
