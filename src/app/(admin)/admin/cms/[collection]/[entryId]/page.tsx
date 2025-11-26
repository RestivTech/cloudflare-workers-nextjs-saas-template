import { requireAdmin } from "@/utils/auth";
import { redirect } from "next/navigation";
import { cmsConfig } from "@/../cms.config";
import { getCmsEntryById } from "@/lib/cms/cms-repository";
import { CmsEntryForm } from "../_components/cms-entry-form";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function EditEntryPage({
  params,
}: {
  params: Promise<{ collection: string; entryId: string }>;
}) {
  const session = await requireAdmin({ doNotThrowError: true });

  if (!session) {
    return redirect("/");
  }

  const { collection, entryId } = await params;

  // Validate collection exists
  const collectionConfig = cmsConfig.collections[collection as keyof typeof cmsConfig.collections];

  if (!collectionConfig) {
    return redirect("/admin/cms");
  }

  // Get the entry
  const entry = await getCmsEntryById({
    id: entryId,
    includeRelations: {
      tags: true,
    }
  });
  if (!entry) {
    return redirect(`/admin/cms/${collection}`);
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/admin/cms/${collection}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Edit {collectionConfig.labels.singular}
          </h1>
          <p className="text-muted-foreground mt-2">{entry.title}</p>
        </div>
      </div>

      <CmsEntryForm collection={collection} mode="edit" entry={entry} />
    </div>
  );
}
