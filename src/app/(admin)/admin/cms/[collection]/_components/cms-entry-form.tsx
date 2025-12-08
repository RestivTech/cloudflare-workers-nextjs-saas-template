"use client";

import React, { useEffect, useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { useServerAction } from "zsa-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { formatDistanceToNow } from "date-fns";
import { createCmsEntryAction, updateCmsEntryAction } from "../../../_actions/cms-entry-actions";
import { listCmsTagsAction, createCmsTagAction } from "../../../_actions/cms-tag-actions";
import { cmsEntryFormSchema, type CmsEntryFormData } from "@/schemas/cms-entry.schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
  FormLabel,
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MultiSelect, type MultiSelectRef } from "@/components/ui/multi-select";
import type { MultiSelectOption } from "@/components/ui/multi-select";
import { SimpleEditor } from "@/components/tiptap-templates/simple/simple-editor";
import { Loader2, Save, Plus } from "lucide-react";
import { toast } from "sonner";
import { generateSlug } from "@/utils/slugify";
import type { CmsTag } from "@/db/schema";
import type { GetCmsCollectionResult } from "@/lib/cms/cms-repository";
import { CMS_ENTRY_STATUS } from "@/app/enums";

const CMS_ENTRY_STATUS_CONFIG = [
  {
    value: CMS_ENTRY_STATUS.DRAFT,
    label: 'Draft',
    color: 'bg-gray-500',
  },
  {
    value: CMS_ENTRY_STATUS.PUBLISHED,
    label: 'Published',
    color: 'bg-green-500',
  },
  {
    value: CMS_ENTRY_STATUS.ARCHIVED,
    label: 'Archived',
    color: 'bg-orange-500',
  },
] as const;

type CmsEntryFormProps = {
  collection: string;
  mode: "create" | "edit";
  entry?: GetCmsCollectionResult;
};

export function CmsEntryForm({ collection, mode, entry }: CmsEntryFormProps) {
  const router = useRouter();
  const multiSelectRef = useRef<MultiSelectRef>(null);
  const isSlugManuallyEditedRef = useRef(false);

  const form = useForm<CmsEntryFormData>({
    resolver: zodResolver(cmsEntryFormSchema),
    defaultValues: {
      title: entry?.title || "",
      slug: entry?.slug || "",
      content: entry?.content || { type: "doc", content: [] },
      status: entry?.status,
      tagIds: entry?.tags?.map((t) => t.tag.id) || [],
    },
  });

  const { execute: createEntry, isPending: isCreating } = useServerAction(createCmsEntryAction, {
    onError: (error) => {
      toast.dismiss();
      toast.error(error.err?.message || "Failed to create entry");
    },
    onStart: () => {
      toast.loading(mode === "create" ? "Creating entry..." : "Updating entry...");
    },
    onSuccess: () => {
      toast.dismiss();
      toast.success(mode === "create" ? "Entry created successfully" : "Entry updated successfully");
      router.push(`/admin/cms/${collection}`);
    },
  });

  const { execute: updateEntry, isPending: isUpdating } = useServerAction(updateCmsEntryAction, {
    onError: (error) => {
      toast.dismiss();
      toast.error(error.err?.message || "Failed to update entry");
    },
    onStart: () => {
      toast.loading("Updating entry...");
    },
    onSuccess: () => {
      toast.dismiss();
      toast.success("Entry updated successfully");
      router.push(`/admin/cms/${collection}`);
    },
  });

  const { execute: loadTags, isPending: isLoadingTags } = useServerAction(listCmsTagsAction);
  const { execute: createTag, isPending: isCreatingTag } = useServerAction(createCmsTagAction);

  const isPending = isCreating || isUpdating;

  const [availableTags, setAvailableTags] = React.useState<CmsTag[]>([]);
  const [searchValue, setSearchValue] = React.useState("");

  const fetchTags = useCallback(async () => {
    const [data, error] = await loadTags();
    if (data) {
      setAvailableTags(data);
    }
    if (error) {
      console.error("Failed to load tags:", error);
    }
  }, [loadTags]);

  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  const handleTitleChange = (value: string) => {
    form.setValue("title", value);
    if (mode === "create" && !isSlugManuallyEditedRef.current) {
      const generatedSlug = generateSlug(value);
      form.setValue("slug", generatedSlug);
    }
  };

  const handleSlugChange = (value: string) => {
    form.setValue("slug", value);
    if (!isSlugManuallyEditedRef.current) {
      isSlugManuallyEditedRef.current = true;
    }
  };

  const tagOptions: MultiSelectOption[] = useMemo(
    () =>
      availableTags.map((tag) => ({
        label: tag.name,
        value: tag.id,
        style: {
          badgeColor: tag.color ? `${tag.color}20` : undefined,
        },
      })),
    [availableTags]
  );

  const handleCreateTag = useCallback(
    async (tagName: string) => {
      if (!tagName.trim()) return;

      const slug = generateSlug(tagName);

      const [data, error] = await createTag({
        name: tagName.trim(),
        slug,
        description: "",
        color: undefined,
      });

      if (error) {
        toast.error(error.message || "Failed to create tag");
        return;
      }

      if (data) {
        toast.success(`Tag "${tagName}" created successfully`);
        await fetchTags();
        const currentTagIds = form.getValues("tagIds") || [];
        form.setValue("tagIds", [...currentTagIds, data.id]);
        setSearchValue("");
        multiSelectRef.current?.closePopover();
      }
    },
    [createTag, fetchTags, form]
  );

  const hasExactMatch = useMemo(
    () =>
      tagOptions.some(
        (option) => option.label.toLowerCase() === searchValue.toLowerCase()
      ),
    [tagOptions, searchValue]
  );

  const emptyIndicator = useMemo(() => {
    if (searchValue && !hasExactMatch) {
      return (
        <div className="text-center py-6">
          <p className="text-sm text-muted-foreground mb-3">
            No tag found for &quot;{searchValue}&quot;
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleCreateTag(searchValue)}
            disabled={isCreatingTag}
            className="mx-auto"
          >
            {isCreatingTag ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Creating...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Create &quot;{searchValue}&quot;
              </>
            )}
          </Button>
        </div>
      );
    }

    return (
      <div className="text-center py-6 text-sm text-muted-foreground">
        No tags found.
      </div>
    );
  }, [searchValue, hasExactMatch, isCreatingTag, handleCreateTag]);

  const onSubmit = async (data: CmsEntryFormData) => {
    if (mode === "create") {
      await createEntry({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        collection: collection as any,
        title: data.title,
        slug: data.slug,
        content: data.content,
        fields: {},
        status: data.status,
        tagIds: data.tagIds || [],
      });
    } else {
      if (!entry) return;

      await updateEntry({
        id: entry.id,
        title: data.title,
        slug: data.slug,
        content: data.content,
        fields: {},
        status: data.status,
        tagIds: data.tagIds || [],
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-semibold tracking-tight">
              {mode === "create" ? "Create New Entry" : "Edit Entry"}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {mode === "create"
                ? "Fill in the details below to create a new entry"
                : "Update the entry details below"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(`/admin/cms/${collection}`)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  {mode === "create" ? "Creating..." : "Saving..."}
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {mode === "create" ? "Create Entry" : "Save Changes"}
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Enter a compelling title..."
                        className="text-lg"
                        onChange={(e) => {
                          field.onChange(e);
                          handleTitleChange(e.target.value);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL Slug *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="url-friendly-slug"
                        onChange={(e) => {
                          field.onChange(e);
                          handleSlugChange(e.target.value);
                        }}
                      />
                    </FormControl>
                    <FormDescription>
                      This will be used in the URL. Auto-generated from title, but you can customize it.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Content</CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <SimpleEditor
                        content={field.value}
                        onChange={(newContent) => field.onChange(newContent)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
          </div>

          <div className="space-y-6">
            <Card>
            <CardHeader>
              <CardTitle>Publishing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CMS_ENTRY_STATUS_CONFIG.map((status) => (
                          <SelectItem key={status.value} value={status.value}>
                            <div className="flex items-center gap-2">
                              <div className={`h-2 w-2 rounded-full ${status.color}`} />
                              <span>{status.label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Control the visibility of this entry
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tags</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="tagIds"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Select Tags</FormLabel>
                    <FormControl>
                      <MultiSelect
                        ref={multiSelectRef}
                        options={tagOptions}
                        onValueChange={field.onChange}
                        defaultValue={field.value || []}
                        placeholder="Select tags..."
                        variant="default"
                        maxCount={3}
                        disabled={isLoadingTags || isCreatingTag}
                        className="w-full"
                        searchable={true}
                        onSearchChange={setSearchValue}
                        emptyIndicator={emptyIndicator}
                        resetOnDefaultValueChange={true}
                      />
                    </FormControl>
                    <FormDescription>
                      Type to search or create new tags.{" "}
                      <a
                        href="/admin/cms/tags"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline hover:text-foreground"
                      >
                        Manage tags
                      </a>
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {mode === "edit" && entry && (
            <Card>
              <CardHeader>
                <CardTitle>Entry Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Created:</span>
                  <p className="font-medium">
                    {formatDistanceToNow(new Date(entry.createdAt), { addSuffix: true })}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {new Date(entry.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Last Updated:</span>
                  <p className="font-medium">
                    {formatDistanceToNow(new Date(entry.updatedAt), { addSuffix: true })}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {new Date(entry.updatedAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
          </div>
        </div>
      </form>
    </Form>
  );
}
