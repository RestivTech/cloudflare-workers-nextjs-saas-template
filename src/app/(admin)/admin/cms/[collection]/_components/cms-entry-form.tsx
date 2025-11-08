"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useServerAction } from "zsa-react";
import { createCmsEntryAction, updateCmsEntryAction } from "../../../_actions/cms-entry-actions";
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
import { TipTapEditor } from "../../_components/tiptap-editor";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import type { CmsEntry } from "@/db/schema";

type CmsEntryFormProps = {
  collection: string;
  mode: "create" | "edit";
  entry?: CmsEntry;
};

export function CmsEntryForm({ collection, mode, entry }: CmsEntryFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState(entry?.title || "");
  const [slug, setSlug] = useState(entry?.slug || "");
  const [content, setContent] = useState(entry?.content || { type: "doc", content: [] });
  const [status, setStatus] = useState<"draft" | "published" | "archived">(
    (entry?.status as "draft" | "published" | "archived") || "draft"
  );

  const { execute: createEntry, isPending: isCreating } = useServerAction(createCmsEntryAction);
  const { execute: updateEntry, isPending: isUpdating } = useServerAction(updateCmsEntryAction);

  const isPending = isCreating || isUpdating;

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
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Content</CardTitle>
        </CardHeader>
        <CardContent>
          <TipTapEditor content={content} onChange={setContent} />
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
