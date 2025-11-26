import { requireAdmin } from "@/utils/auth";
import { redirect } from "next/navigation";
import { getCmsTagById } from "@/lib/cms/cms-repository";
import { TagForm } from "../_components/tag-form";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function EditTagPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireAdmin({ doNotThrowError: true });

  if (!session) {
    return redirect("/");
  }

  const { id } = await params;
  const tag = await getCmsTagById(id);

  if (!tag) {
    return redirect("/admin/cms/tags");
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/cms/tags">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Tag</h1>
          <p className="text-muted-foreground mt-2">
            Update tag details
          </p>
        </div>
      </div>

      <TagForm mode="edit" tag={tag} />
    </div>
  );
}
