import { afterEach, describe, expect, it, vi } from 'vitest';
import { sha256Hex } from '../../core/secrets.ts';
import { findTemplate, findTemplates, insertTemplate, removeTemplate, replaceTemplate } from './templates.schema.ts';
import { createTemplate, deleteTemplate, getTemplate, listTemplates, updateTemplate } from './templates.service.ts';

vi.mock('./templates.schema.ts', () => ({
  findTemplates: vi.fn(async () => []),
  findTemplate: vi.fn(async () => null),
  insertTemplate: vi.fn(),
  replaceTemplate: vi.fn(async () => null),
  removeTemplate: vi.fn(async () => false),
}));

const ownerKey = 'k'.repeat(43);
const ownerHash = sha256Hex(ownerKey);
const id = 'a'.repeat(24);
const input = {
  name: 'Field A',
  center: [30.52, 50.45] as [number, number],
  zoom: 16,
  features: { type: 'FeatureCollection' as const, features: [] },
};

afterEach(() => vi.clearAllMocks());

describe('templates service owner scoping', () => {
  it.each([
    ['listTemplates', () => listTemplates(ownerKey), findTemplates, [ownerHash]],
    ['getTemplate', () => getTemplate(ownerKey, id), findTemplate, [ownerHash, id]],
    ['createTemplate', () => createTemplate(ownerKey, input), insertTemplate, [ownerHash, input]],
    ['updateTemplate', () => updateTemplate(ownerKey, id, input), replaceTemplate, [ownerHash, id, input]],
    ['deleteTemplate', () => deleteTemplate(ownerKey, id), removeTemplate, [ownerHash, id]],
  ] as const)('%s queries by the owner key hash, never the raw key', async (_name, call, repo, args) => {
    await call();
    expect(repo).toHaveBeenCalledWith(...args);
    expect(JSON.stringify(vi.mocked(repo).mock.calls)).not.toContain(ownerKey);
  });

  it('a different owner key maps to a different hash', () => {
    expect(sha256Hex('x'.repeat(43))).not.toBe(ownerHash);
  });
});
