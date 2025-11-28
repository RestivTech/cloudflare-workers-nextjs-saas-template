import { z } from "zod";
import { zodCollectionEnum } from "@/../cms.config";

export const cmsEntryStatusEnum = z.enum(["draft", "published", "archived"]);

const baseCmsEntrySchema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z.string().min(1, "Slug is required"),
  content: z.any(),
  status: cmsEntryStatusEnum.default("draft"),
  tagIds: z.array(z.string()).optional(),
});

export const cmsEntryFormSchema = baseCmsEntrySchema;

export const createCmsEntrySchema = baseCmsEntrySchema.extend({
  collection: zodCollectionEnum,
  fields: z.record(z.any()),
});

export const updateCmsEntrySchema = baseCmsEntrySchema
  .extend({
    fields: z.record(z.any()),
  })
  .partial()
  .extend({
    id: z.string(),
  });

export type CmsEntryFormData = z.infer<typeof cmsEntryFormSchema>;
