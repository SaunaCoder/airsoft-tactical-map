import type { MapFeature, Template, TemplateInput, TemplateSummary } from '@airsoft/shared';
import mongoose from 'mongoose';

const templateSchema = new mongoose.Schema(
  {
    ownerKeyHash: { type: String, required: true, index: true },
    name: { type: String, required: true },
    center: { type: [Number], required: true }, // GeoJSON order [lng, lat]
    zoom: { type: Number, required: true },
    // GeoJSON Features, validated with the shared Zod schema before every write.
    features: { type: [mongoose.Schema.Types.Mixed], default: [] },
  },
  { timestamps: true },
);

const TemplateModel = mongoose.model('Template', templateSchema);

type StoredTemplate = {
  _id: mongoose.Types.ObjectId;
  name: string;
  center: Template['center'];
  zoom: number;
  features?: MapFeature[];
  updatedAt: Date;
};

const toSummary = (doc: StoredTemplate): TemplateSummary => ({
  id: doc._id.toString(),
  name: doc.name,
  center: doc.center,
  zoom: doc.zoom,
  updatedAt: doc.updatedAt.toISOString(),
});

const toTemplate = (doc: StoredTemplate): Template => ({
  ...toSummary(doc),
  features: { type: 'FeatureCollection', features: doc.features ?? [] },
});

const toDoc = (input: TemplateInput) => ({ ...input, features: input.features.features });

// Every query is scoped by owner: another owner's template is indistinguishable from a missing one.

export async function findTemplates(ownerKeyHash: string): Promise<TemplateSummary[]> {
  const docs = await TemplateModel.find({ ownerKeyHash }, { features: 0 }).sort({ updatedAt: -1 }).lean<StoredTemplate[]>();
  return docs.map(toSummary);
}

export async function findTemplate(ownerKeyHash: string, id: string): Promise<Template | null> {
  const doc = await TemplateModel.findOne({ _id: id, ownerKeyHash }).lean<StoredTemplate>();
  return doc && toTemplate(doc);
}

export async function insertTemplate(ownerKeyHash: string, input: TemplateInput): Promise<Template> {
  const doc = await TemplateModel.create({ ownerKeyHash, ...toDoc(input) });
  return toTemplate(doc.toObject<StoredTemplate>());
}

export async function replaceTemplate(ownerKeyHash: string, id: string, input: TemplateInput): Promise<Template | null> {
  const doc = await TemplateModel.findOneAndUpdate({ _id: id, ownerKeyHash }, toDoc(input), {
    new: true,
  }).lean<StoredTemplate>();
  return doc && toTemplate(doc);
}

export async function removeTemplate(ownerKeyHash: string, id: string): Promise<boolean> {
  const result = await TemplateModel.deleteOne({ _id: id, ownerKeyHash });
  return result.deletedCount > 0;
}
