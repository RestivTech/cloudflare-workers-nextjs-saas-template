"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useServerAction } from "zsa-react";
import { createCmsEntryAction, updateCmsEntryAction } from "../../../_actions/cms-entry-actions";
import { listCmsTagsAction } from "../../../_actions/cms-tag-actions";
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
import { Badge } from "@/components/ui/badge";
import { TipTapEditor } from "../../_components/tiptap-editor";
import { Loader2, Save, X, Plus } from "lucide-react";
import { toast } from "sonner";
import type { CmsEntry, CmsTag } from "@/db/schema";
import type { GetCmsCollectionResult } from "@/lib/cms/cms-repository";

type CmsEntryFormProps = {
  collection: string;
  mode: "create" | "edit";
  entry?: GetCmsCollectionResult;
};

export function CmsEntryForm({ collection, mode, entry }: CmsEntryFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState(entry?.title || "");
  const [slug, setSlug] = useState(entry?.slug || "");
  const [content, setContent] = useState<unknown>(entry?.content || { type: "doc", content: [] });
  const [status, setStatus] = useState<"draft" | "published" | "archived">(
    (entry?.status as "draft" | "published" | "archived") || "draft"
  );
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<CmsTag[]>([]);
  const [showTagDropdown, setShowTagDropdown] = useState(false);

  const { execute: createEntry, isPending: isCreating } = useServerAction(createCmsEntryAction);
  const { execute: updateEntry, isPending: isUpdating } = useServerAction(updateCmsEntryAction);
  const { execute: loadTags, isPending: isLoadingTags } = useServerAction(listCmsTagsAction);

  const isPending = isCreating || isUpdating;

  // Load tags on mount
  useEffect(() => {
    const fetchTags = async () => {
      const [data, error] = await loadTags();
      if (data) {
        setAvailableTags(data);
      }
      if (error) {
        console.error("Failed to load tags:", error);
      }
    };
    fetchTags();
  }, [loadTags]);

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

  const handleAddTag = (tagId: string) => {
    if (!selectedTagIds.includes(tagId)) {
      setSelectedTagIds([...selectedTagIds, tagId]);
    }
    setShowTagDropdown(false);
  };

  const handleRemoveTag = (tagId: string) => {
    setSelectedTagIds(selectedTagIds.filter((id) => id !== tagId));
  };

  const getSelectedTags = () => {
    return availableTags.filter((tag) => selectedTagIds.includes(tag.id));
  };

  const getAvailableTagsForSelection = () => {
    return availableTags.filter((tag) => !selectedTagIds.includes(tag.id));
  };

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
            <Label>Tags</Label>
            <div className="space-y-2">
              {/* Selected tags */}
              <div className="flex flex-wrap gap-2 min-h-[2rem] border rounded-md p-2">
                {getSelectedTags().length > 0 ? (
                  getSelectedTags().map((tag) => (
                    <Badge
                      key={tag.id}
                      variant="secondary"
                      className="gap-1 pr-1"
                      style={{
                        backgroundColor: tag.color ? `${tag.color}20` : undefined,
                        borderColor: tag.color || undefined,
                      }}
                    >
                      {tag.name}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag.id)}
                        className="ml-1 hover:bg-black/10 rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))
                ) : (
                  <span className="text-sm text-muted-foreground">No tags selected</span>
                )}
              </div>

              {/* Add tag button and dropdown */}
              <div className="relative">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowTagDropdown(!showTagDropdown)}
                  disabled={isLoadingTags || getAvailableTagsForSelection().length === 0}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Tag
                </Button>

                {showTagDropdown && getAvailableTagsForSelection().length > 0 && (
                  <div className="absolute z-10 mt-2 w-64 max-h-60 overflow-auto border rounded-md bg-popover shadow-lg">
                    <div className="p-2 space-y-1">
                      {getAvailableTagsForSelection().map((tag) => (
                        <button
                          key={tag.id}
                          type="button"
                          onClick={() => handleAddTag(tag.id)}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-accent rounded-md flex items-center gap-2"
                        >
                          {tag.color && (
                            <div
                              className="w-3 h-3 rounded-full border"
                              style={{ backgroundColor: tag.color }}
                            />
                          )}
                          <span>{tag.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <p className="text-xs text-muted-foreground">
                Select tags to categorize this entry.{" "}
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
