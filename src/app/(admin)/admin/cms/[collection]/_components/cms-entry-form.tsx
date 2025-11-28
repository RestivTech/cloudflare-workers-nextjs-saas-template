"use client";

"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { useServerAction } from "zsa-react";
import { formatDistanceToNow } from "date-fns";
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
  // TODO Use react-hook-form with zod validations from the server actions
  const [title, setTitle] = useState(entry?.title || "");
  const [slug, setSlug] = useState(entry?.slug || "");
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false);
  const [content, setContent] = useState<unknown>(entry?.content || { type: "doc", content: [] });
  // TODO Get this enum from the drizzle schema
  // TODO Add pagination
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
    // Only auto-generate slug in create mode and if user hasn't manually edited it
    if (mode === "create" && !isSlugManuallyEdited) {
      const generatedSlug = generateSlug(value);
      setSlug(generatedSlug);
    }
  };

  // Handle manual slug changes
  const handleSlugChange = (value: string) => {
    setSlug(value);
    // Mark as manually edited if user types anything
    if (!isSlugManuallyEdited) {
      setIsSlugManuallyEdited(true);
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
      {/* Header with Title and Action Buttons */}
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

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Content (2/3 width on large screens) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Title and Slug Card */}
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
                  placeholder="Enter a compelling title..."
                  required
                  className="text-lg"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">URL Slug *</Label>
                <Input
                  id="slug"
                  value={slug}
                  onChange={(e) => handleSlugChange(e.target.value)}
                  placeholder="url-friendly-slug"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  This will be used in the URL. Auto-generated from title, but you can customize it.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Content Editor Card */}
          <Card>
            <CardHeader>
              <CardTitle>Content</CardTitle>
            </CardHeader>
            <CardContent>
              <TipTapEditor content={content} onChange={(newContent) => setContent(newContent)} />
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Sidebar (1/3 width on large screens) */}
        <div className="space-y-6">
          {/* Publishing Options Card */}
          <Card>
            <CardHeader>
              <CardTitle>Publishing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={status} onValueChange={(value) => setStatus(value as typeof status)}>
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-gray-500" />
                        <span>Draft</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="published">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-green-500" />
                        <span>Published</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="archived">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-orange-500" />
                        <span>Archived</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Control the visibility of this entry
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Tags Card */}
          <Card>
            <CardHeader>
              <CardTitle>Tags</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="tags">Select Tags</Label>
                <MultiSelect
                  ref={multiSelectRef}
                  options={tagOptions}
                  onValueChange={setSelectedTagIds}
                  defaultValue={selectedTagIds}
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
                <p className="text-xs text-muted-foreground">
                  Type to search or create new tags.{" "}
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

          {/* Quick Info Card */}
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
  );
}
