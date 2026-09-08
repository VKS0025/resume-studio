import type { TemplateId } from "@/lib/resume";
import EditorShell from "@/components/editor/EditorShell";
import { TEMPLATES } from "@/components/templates";

export default async function EditorPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ template?: string }>;
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);

  // /editor/new?template=modern — the landing page's gallery links here.
  const requested = TEMPLATES.find((entry) => entry.id === query.template);

  return (
    <EditorShell
      resumeId={id}
      initialTemplate={requested ? (requested.id as TemplateId) : undefined}
    />
  );
}
