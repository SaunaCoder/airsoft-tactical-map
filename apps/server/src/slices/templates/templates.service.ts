import type { Template, TemplateInput, TemplateSummary } from '@airsoft/shared';
import { sha256Hex } from '../../core/secrets.ts';
import { findTemplate, findTemplates, insertTemplate, removeTemplate, replaceTemplate } from './templates.schema.ts';

// Transport-agnostic API for templates. REST (and later GraphQL, P1-6) only parse input and map
// `null` / `false` to "not found". The raw owner key never reaches the database, only its hash.

export function listTemplates(ownerKey: string): Promise<TemplateSummary[]> {
  return findTemplates(sha256Hex(ownerKey));
}

export function getTemplate(ownerKey: string, id: string): Promise<Template | null> {
  return findTemplate(sha256Hex(ownerKey), id);
}

export function createTemplate(ownerKey: string, input: TemplateInput): Promise<Template> {
  return insertTemplate(sha256Hex(ownerKey), input);
}

export function updateTemplate(ownerKey: string, id: string, input: TemplateInput): Promise<Template | null> {
  return replaceTemplate(sha256Hex(ownerKey), id, input);
}

export function deleteTemplate(ownerKey: string, id: string): Promise<boolean> {
  return removeTemplate(sha256Hex(ownerKey), id);
}
