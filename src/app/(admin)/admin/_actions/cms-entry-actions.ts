"use server";

import { z } from "zod";
import { createServerAction, ZSAError } from "zsa";
import { requireAdmin } from "@/utils/auth";
import { CMS_ENTRY_STATUS } from "@/db/schema";
import { cmsConfig, zodCollectionEnum } from "@/../cms.config";
import {
  getCmsCollection,
  getCmsEntryById,
  createCmsEntry,
  updateCmsEntry,
  deleteCmsEntry,
} from "@/lib/cms/cms-repository";

/**
 * Get all CMS entries for a collection
 */
export const listCmsEntriesAction = createServerAction()
  .input(
    z.object({
      collection: zodCollectionEnum,
      status: z.enum(["draft", "published", "archived", "all"]).optional().default("all"),
      limit: z.number().optional().default(20),
      offset: z.number().optional().default(0),
    })
  )
  .handler(async ({ input }) => {
    await requireAdmin();

    const entries = await getCmsCollection({
      collectionSlug: input.collection as keyof typeof cmsConfig.collections,
      status: input.status as "draft" | "published" | "archived" | "all",
      limit: input.limit,
      offset: input.offset,
      includeRelations: {
        createdByUser: true,
        tags: true,
      },
    });

    return entries;
  });

/**
 * Get a single CMS entry by ID
 */
export const getCmsEntryAction = createServerAction()
  .input(z.object({ id: z.string() }))
  .handler(async ({ input }) => {
    await requireAdmin();

    const entry = await getCmsEntryById({
      id: input.id,
      includeRelations: {
        createdByUser: true,
        media: true,
      },
    });

    if (!entry) {
      throw new ZSAError("NOT_FOUND", "Entry not found");
    }

    return entry;
  });

/**
 * Create a new CMS entry
 */
export const createCmsEntryAction = createServerAction()
  .input(
    z.object({
      collection: zodCollectionEnum,
      title: z.string().min(1, "Title is required"),
      slug: z.string().min(1, "Slug is required"),
      content: z.any(), // TipTap JSON content
      fields: z.record(z.any()),
      status: z.enum(["draft", "published", "archived"]).default("draft"),
      tagIds: z.array(z.string()).optional(),
    })
  )
  .handler(async ({ input }) => {
    const session = await requireAdmin();

    if (!session?.userId) {
      throw new ZSAError("FORBIDDEN", "Not authorized");
    }

    const newEntry = await createCmsEntry({
      collectionSlug: input.collection as keyof typeof cmsConfig.collections,
      title: input.title,
      slug: input.slug,
      content: input.content,
      fields: input.fields,
      status: input.status as typeof CMS_ENTRY_STATUS[keyof typeof CMS_ENTRY_STATUS],
      createdBy: session.userId,
      tagIds: input.tagIds,
    });

    return newEntry;
  });

/**
 * Update an existing CMS entry
 */
export const updateCmsEntryAction = createServerAction()
  .input(
    z.object({
      id: z.string(),
      title: z.string().min(1, "Title is required").optional(),
      slug: z.string().min(1, "Slug is required").optional(),
      content: z.any().optional(), // TipTap JSON content
      fields: z.record(z.any()).optional(),
      status: z.enum(["draft", "published", "archived"]).optional(),
      tagIds: z.array(z.string()).optional(),
    })
  )
  .handler(async ({ input }) => {
    await requireAdmin();

    const updatedEntry = await updateCmsEntry({
      id: input.id,
      title: input.title,
      slug: input.slug,
      content: input.content,
      fields: input.fields,
      status: input.status as typeof CMS_ENTRY_STATUS[keyof typeof CMS_ENTRY_STATUS] | undefined,
      tagIds: input.tagIds,
    });

    if (!updatedEntry) {
      throw new ZSAError("NOT_FOUND", "Entry not found");
    }

    return updatedEntry;
  });

/**
 * Delete a CMS entry
 */
export const deleteCmsEntryAction = createServerAction()
  .input(z.object({ id: z.string() }))
  .handler(async ({ input }) => {
    await requireAdmin();

    await deleteCmsEntry({ id: input.id });

    return { success: true };
  });
