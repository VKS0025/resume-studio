"use client";

import type { MaterialKind, StudyCategory, StudyMaterial } from "@/lib/portal";
import { getSupabaseBrowser } from "@/lib/supabase/client";

const MATERIAL_COLUMNS =
  "id,category_id,title,description,kind,subject,exam,year,file_path," +
  "external_url,file_size,downloads,created_at";

/** Supabase Storage bucket holding uploaded notes and papers. */
export const STUDY_BUCKET = "study";

function toCategory(row: Record<string, unknown>): StudyCategory {
  return {
    id: row.id as string,
    slug: (row.slug as string) ?? "",
    name: (row.name as string) ?? "",
    description: (row.description as string) ?? "",
    icon: (row.icon as string) ?? "book",
    sortOrder: (row.sort_order as number) ?? 0,
  };
}

function toMaterial(row: Record<string, unknown>): StudyMaterial {
  return {
    id: row.id as string,
    categoryId: (row.category_id as string) ?? null,
    title: (row.title as string) ?? "",
    description: (row.description as string) ?? "",
    kind: (row.kind as MaterialKind) ?? "notes",
    subject: (row.subject as string) ?? "",
    exam: (row.exam as string) ?? "",
    year: (row.year as number) ?? null,
    filePath: (row.file_path as string) ?? "",
    externalUrl: (row.external_url as string) ?? "",
    fileSize: (row.file_size as number) ?? null,
    downloads: (row.downloads as number) ?? 0,
    createdAt: (row.created_at as string) ?? "",
  };
}

export async function listCategories(): Promise<StudyCategory[]> {
  const supabase = getSupabaseBrowser();
  if (!supabase) return [];
  const { data } = await supabase
    .from("study_categories")
    .select("id,slug,name,description,icon,sort_order")
    .order("sort_order");
  return (data ?? []).map((row) => toCategory(row as unknown as Record<string, unknown>));
}

export async function getCategory(slug: string): Promise<StudyCategory | null> {
  const supabase = getSupabaseBrowser();
  if (!supabase) return null;
  const { data } = await supabase
    .from("study_categories")
    .select("id,slug,name,description,icon,sort_order")
    .eq("slug", slug)
    .maybeSingle();
  return data ? toCategory(data as unknown as Record<string, unknown>) : null;
}

/** How many published items sit in each category, for the index cards. */
export async function countByCategory(): Promise<Record<string, number>> {
  const supabase = getSupabaseBrowser();
  if (!supabase) return {};
  const { data } = await supabase
    .from("study_materials")
    .select("category_id")
    .eq("is_published", true)
    .limit(2000);
  const counts: Record<string, number> = {};
  for (const row of (data ?? []) as { category_id: string | null }[]) {
    if (!row.category_id) continue;
    counts[row.category_id] = (counts[row.category_id] ?? 0) + 1;
  }
  return counts;
}

export async function listMaterials(options: {
  categoryId?: string;
  q?: string;
  kind?: MaterialKind | "";
  limit?: number;
} = {}): Promise<StudyMaterial[]> {
  const supabase = getSupabaseBrowser();
  if (!supabase) return [];

  let query = supabase
    .from("study_materials")
    .select(MATERIAL_COLUMNS)
    .eq("is_published", true);

  if (options.categoryId) query = query.eq("category_id", options.categoryId);
  if (options.kind) query = query.eq("kind", options.kind);
  const q = options.q?.trim();
  if (q) {
    const term = `%${q}%`;
    query = query.or(
      `title.ilike.${term},description.ilike.${term},subject.ilike.${term},exam.ilike.${term}`
    );
  }

  const { data } = await query
    .order("created_at", { ascending: false })
    .limit(options.limit ?? 60);
  return (data ?? []).map((row) => toMaterial(row as unknown as Record<string, unknown>));
}

/**
 * Uploaded files live in a private bucket, so a download is a short-lived
 * signed URL rather than a public link that could be shared forever.
 */
export async function resolveDownloadUrl(material: StudyMaterial): Promise<string | null> {
  if (material.externalUrl) return material.externalUrl;
  const supabase = getSupabaseBrowser();
  if (!supabase || !material.filePath) return null;

  const { data, error } = await supabase.storage
    .from(STUDY_BUCKET)
    .createSignedUrl(material.filePath, 60 * 10);
  if (error || !data) return null;

  // Students cannot UPDATE study_materials, so the counter goes through a
  // definer function. Best-effort: a failed count must not block the download.
  void supabase.rpc("bump_material_download", { material_id: material.id });

  return data.signedUrl;
}
