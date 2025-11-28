"use client";

"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { useServerAction } from "zsa-react";
import { createCmsEntryAction, updateCmsEntryAction } from "../../../_actions/cms-entry-actions";
import { listCmsTagsAction, createCmsTagAction } from "../../../_actions/cms-tag-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { TipTapEditor } from "../../_components/tiptap-editor";
import { Loader2, Save, Plus } from "lucide-react";
import { toast } from "sonner";
import { generateSlug } from "@/utils/slugify";
import type { CmsTag } from "@/db/schema";
import type { GetCmsCollectionResult } from "@/lib/cms/cms-repository";

type CmsEntryFormProps = {
  collection: string;
  mode: "create" | "edit";
  entry?: GetCmsCollectionResult;
};

export function CmsEntryForm({ collection, mode, entry }: CmsEntryFormProps) {
  const router = useRouter();
  const multiSelectRef = useRef<MultiSelectRef>(null);
  const [title, setTitle] = useState(entry?.title || "");
  const [slug, setSlug] = useState(entry?.slug || "");
  const [content, setContent] = useState<unknown>(entry?.content || { type: "doc", content: [] });
  const [status, setStatus] = useState<"draft" | "published" | "archived">(
    (entry?.status as "draft" | "published" | "archived") || "draft"
  );
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<CmsTag[]>([]);
  const [searchValue, setSearchValue] = useState("");

  const { execute: createEntry, isPending: isCreating } = useServerAction(createCmsEntryAction);
  const { execute: updateEntry, isPending: isUpdating } = useServerAction(updateCmsEntryAction);
  const { execute: loadTags, isPending: isLoadingTags } = useServerAction(listCmsTagsAction);
  const { execute: createTag, isPending: isCreatingTag } = useServerAction(createCmsTagAction);

  const isPending = isCreating || isUpdating;

  // Load tags function
  const fetchTags = useCallback(async () => {
    const [data, error] = await loadTags();
    if (data) {
      setAvailableTags(data);
    }
    if (error) {
      console.error("Failed to load tags:", error);
    }
  }, [loadTags]);

  // Load tags on mount
  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  // Load existing tags for the entry
  useEffect(() => {
    if (entry?.tags) {
      const tagIds = entry.tags.map((t) => t.tag.id);
      setSelectedTagIds(tagIds);
    }
  }, [entry]);

  // Auto-generate slug from title
  const handleTitleChange = (value: string) => {
    setTitle(value);
    if (mode === "create" && !slug) {
      const generatedSlug = value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      setSlug(generatedSlug);
    }
  };

  // Convert tags to MultiSelect options
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

  // Handle creating a new tag
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
        // Reload tags to include the new one
        await fetchTags();
        // Auto-select the newly created tag
        setSelectedTagIds((prev) => [...prev, data.id]);
        // Clear search value
        setSearchValue("");
        // Close the popover
        multiSelectRef.current?.closePopover();
      }
    },
    [createTag, fetchTags]
  );

  // Check if search value matches existing tag
  const hasExactMatch = useMemo(
    () =>
      tagOptions.some(
        (option) => option.label.toLowerCase() === searchValue.toLowerCase()
      ),
    [tagOptions, searchValue]
  );

  // Custom empty indicator with create option
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title || !slug) {
      toast.error("Title and slug are required");
      return;
    }

    if (mode === "create") {
      const [data, error] = await createEntry({
        collection,
        title,
        slug,
        content,
        fields: {}, // We'll add custom fields later
        status,
        tagIds: selectedTagIds,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      if (data) {
        toast.success("Entry created successfully");
        router.push(`/admin/cms/${collection}`);
      }
    } else {
      if (!entry) return;

      const [data, error] = await updateEntry({
        id: entry.id,
        title,
        slug,
        content,
        fields: {}, // We'll add custom fields later
        status,
        tagIds: selectedTagIds,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      if (data) {
        toast.success("Entry updated successfully");
        router.push(`/admin/cms/${collection}`);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Enter title..."
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">Slug *</Label>
            <Input
              id="slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="url-friendly-slug"
              required
            />
            <p className="text-xs text-muted-foreground">
              URL-friendly version of the title
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={status} onValueChange={(value) => setStatus(value as typeof status)}>
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Tags</Label>
            <MultiSelect
              ref={multiSelectRef}
              options={tagOptions}
              onValueChange={setSelectedTagIds}
              defaultValue={selectedTagIds}
              placeholder="Select tags..."
              variant="default"
              maxCount={5}
              disabled={isLoadingTags || isCreatingTag}
              className="w-full"
              searchable={true}
              onSearchChange={setSearchValue}
              emptyIndicator={emptyIndicator}
              resetOnDefaultValueChange={true}
            />
            <p className="text-xs text-muted-foreground">
              Select tags to categorize this entry. Type to search or create new tags.{" "}
              <a
                href="/admin/cms/tags"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-foreground"
              >
                Manage tags
              </a>
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Content</CardTitle>
        </CardHeader>
        <CardContent>
          <TipTapEditor content={content} onChange={(newContent) => setContent(newContent)} />
        </CardContent>
      </Card>

      <div className="flex items-center gap-4">
        <Button type="submit" disabled={isPending}>
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              {mode === "create" ? "Creating..." : "Updating..."}
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              {mode === "create" ? "Create Entry" : "Update Entry"}
            </>
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push(`/admin/cms/${collection}`)}
          disabled={isPending}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
