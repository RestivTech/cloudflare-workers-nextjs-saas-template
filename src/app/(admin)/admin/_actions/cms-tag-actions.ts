"use server";

import { z } from "zod";
import { createServerAction, ZSAError } from "zsa";
import { requireAdmin } from "@/utils/auth";
import {
  getCmsTags,
  getCmsTagById,
  createCmsTag,
  updateCmsTag,
  deleteCmsTag,
} from "@/lib/cms/cms-repository";

export const listCmsTagsAction = createServerAction()
  .handler(async () => {
    await requireAdmin();
    const tags = await getCmsTags();
    return tags;
  });

export const getCmsTagAction = createServerAction()
  .input(z.object({ id: z.string() }))
  .handler(async ({ input }) => {
    await requireAdmin();

    const tag = await getCmsTagById(input.id);

    if (!tag) {
      throw new ZSAError("NOT_FOUND", "Tag not found");
    }

    return tag;
  });

export const createCmsTagAction = createServerAction()
  .input(
    z.object({
      name: z.string().min(1, "Name is required"),
      slug: z.string().min(1, "Slug is required"),
      description: z.string().optional(),
      color: z.string().optional(),
    })
  )
  .handler(async ({ input }) => {
    const session = await requireAdmin();

    if (!session?.userId) {
      throw new ZSAError("FORBIDDEN", "Not authorized");
    }

    const newTag = await createCmsTag({
      name: input.name,
      slug: input.slug,
      description: input.description,
      color: input.color,
      createdBy: session.userId,
    });

    return newTag;
  });

export const updateCmsTagAction = createServerAction()
  .input(
    z.object({
      id: z.string(),
      name: z.string().min(1, "Name is required").optional(),
      slug: z.string().min(1, "Slug is required").optional(),
      description: z.string().optional(),
      color: z.string().optional(),
    })
  )
  .handler(async ({ input }) => {
    await requireAdmin();

    const updatedTag = await updateCmsTag({
      id: input.id,
      name: input.name,
      slug: input.slug,
      description: input.description,
      color: input.color,
    });

    if (!updatedTag) {
      throw new ZSAError("NOT_FOUND", "Tag not found");
    }

    return updatedTag;
  });

export const deleteCmsTagAction = createServerAction()
  .input(z.object({ id: z.string() }))
  .handler(async ({ input }) => {
    await requireAdmin();

    await deleteCmsTag(input.id);

    return { success: true };
  });
