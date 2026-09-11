"use client";

import type { Job, MaterialKind, StudyMaterial } from "@/lib/portal";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { STUDY_BUCKET } from "./study";

/**
 * Admin writes go through the ordinary browser client using the signed-in
 * user's session — the is_admin() policies in the database decide whether they
 * land. Nothing here needs the service role, so no secret reaches the browser.
 */

export async function isCurrentUserAdmin(): Promise<boolean> {
  const supabase = getSupabaseBrowser();
  if (!supabase) return false;
  const { data: session } = await supabase.auth.getUser();
  if (!session.user) return false;

  const { data } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", session.user.id)
    .maybeSingle();
  return (data as { role?: string } | null)?.role === "admin";
}

/* ------------------------------------------------------------------- jobs */

export type JobDraft = {
  id?: string;
  title: string;
  company: string;
  location: string;
  isRemote: boolean;
  sector: Job["sector"];
  employmentType: Job["employmentType"];
  category: string;
  description: string;
  applyUrl: string;
  salaryMin: string;
  salaryMax: string;
  salaryPeriod: Job["salaryPeriod"];
  qualification: string;
  experience: string;
  deadline: string;
  isActive: boolean;
};

export const BLANK_JOB: JobDraft = {
  title: "",
  company: "",
  location: "",
  isRemote: false,
  sector: "government",
  employmentType: "full_time",
  category: "",
  description: "",
  applyUrl: "",
  salaryMin: "",
  salaryMax: "",
  salaryPeriod: "month",
  qualification: "",
  experience: "",
  deadline: "",
  isActive: true,
};

function toRow(draft: JobDraft): Record<string, unknown> {
  const number = (value: string) => {
    const parsed = Number(value.replace(/[, ]/g, ""));
    return value.trim() && Number.isFinite(parsed) ? parsed : null;
  };
  return {
    source: "manual",
    title: draft.title.trim(),
    company: draft.company.trim(),
    location: draft.location.trim(),
    is_remote: draft.isRemote,
    sector: draft.sector,
    employment_type: draft.employmentType,
    category: draft.category.trim(),
    description: draft.description,
    apply_url: draft.applyUrl.trim(),
    salary_min: number(draft.salaryMin),
    salary_max: number(draft.salaryMax),
    salary_period: draft.salaryPeriod,
    qualification: draft.qualification.trim(),
    experience: draft.experience.trim(),
    // An empty date input is "", which Postgres rejects for a date column.
    deadline: draft.deadline.trim() || null,
    is_active: draft.isActive,
  };
}

export function jobToDraft(job: Job & { isActive?: boolean }): JobDraft {
  return {
    id: job.id,
    title: job.title,
    company: job.company,
    location: job.location,
    isRemote: job.isRemote,
    sector: job.sector,
    employmentType: job.employmentType,
    category: job.category,
    description: job.description,
    applyUrl: job.applyUrl,
    salaryMin: job.salaryMin ? String(job.salaryMin) : "",
    salaryMax: job.salaryMax ? String(job.salaryMax) : "",
    salaryPeriod: job.salaryPeriod,
    qualification: job.qualification,
    experience: job.experience,
    deadline: job.deadline ?? "",
    isActive: job.isActive ?? true,
  };
}

export async function saveJob(draft: JobDraft): Promise<{ ok: boolean; error?: string }> {
  const supabase = getSupabaseBrowser();
  if (!supabase) return { ok: false, error: "No database configured." };
  if (!draft.title.trim()) return { ok: false, error: "A job needs a title." };

  const row = toRow(draft);
  const { error } = draft.id
    ? await supabase.from("jobs").update(row).eq("id", draft.id)
    : await supabase.from("jobs").insert(row);

  if (error) {
    return {
      ok: false,
      error:
        error.code === "42501"
          ? "Your account is not an admin, so the database rejected the write."
          : error.message,
    };
  }
  return { ok: true };
}

export async function setJobActive(id: string, isActive: boolean): Promise<void> {
  const supabase = getSupabaseBrowser();
  await supabase?.from("jobs").update({ is_active: isActive }).eq("id", id);
}

export async function deleteJob(id: string): Promise<void> {
  const supabase = getSupabaseBrowser();
  await supabase?.from("jobs").delete().eq("id", id);
}

/**
 * The browse page hides inactive rows; an admin has to see them to bring one
 * back, so this deliberately does not filter on is_active.
 */
export async function listAllJobs(limit = 100) {
  const supabase = getSupabaseBrowser();
  if (!supabase) return [];
  const { data } = await supabase
    .from("jobs")
    .select(
      "id,source,source_id,title,company,company_logo,location,is_remote,sector," +
        "employment_type,category,description,apply_url,salary_min,salary_max," +
        "salary_period,currency,qualification,experience,tags,posted_at,deadline,is_active"
    )
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as unknown as (Record<string, unknown> & { is_active: boolean })[];
}

/* --------------------------------------------------------- study material */

export type MaterialDraft = {
  categoryId: string;
  title: string;
  description: string;
  kind: MaterialKind;
  subject: string;
  exam: string;
  year: string;
  externalUrl: string;
};

export const BLANK_MATERIAL: MaterialDraft = {
  categoryId: "",
  title: "",
  description: "",
  kind: "notes",
  subject: "",
  exam: "",
  year: "",
  externalUrl: "",
};

/** Keeps uploads tidy and avoids collisions between two "paper.pdf"s. */
function storagePath(categorySlug: string, fileName: string): string {
  const safe = fileName
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .slice(-80);
  return `${categorySlug || "misc"}/${Date.now()}-${safe}`;
}

export async function saveMaterial(
  draft: MaterialDraft,
  file: File | null,
  categorySlug: string
): Promise<{ ok: boolean; error?: string }> {
  const supabase = getSupabaseBrowser();
  if (!supabase) return { ok: false, error: "No database configured." };
  if (!draft.title.trim()) return { ok: false, error: "Give the material a title." };
  if (!file && !draft.externalUrl.trim()) {
    return { ok: false, error: "Attach a file or provide a link." };
  }

  let filePath = "";
  let fileSize: number | null = null;

  if (file) {
    const path = storagePath(categorySlug, file.name);
    const { error: uploadError } = await supabase.storage
      .from(STUDY_BUCKET)
      .upload(path, file, { upsert: false, contentType: file.type || undefined });

    if (uploadError) {
      return {
        ok: false,
        error: /bucket/i.test(uploadError.message)
          ? "The 'study' storage bucket does not exist yet — run supabase/migrations/0003_study_storage.sql."
          : uploadError.message,
      };
    }
    filePath = path;
    fileSize = file.size;
  }

  const { error } = await supabase.from("study_materials").insert({
    category_id: draft.categoryId || null,
    title: draft.title.trim(),
    description: draft.description.trim(),
    kind: draft.kind,
    subject: draft.subject.trim(),
    exam: draft.exam.trim(),
    year: draft.year.trim() ? Number(draft.year) : null,
    file_path: filePath,
    external_url: draft.externalUrl.trim(),
    file_size: fileSize,
    is_published: true,
  });

  if (error) {
    // The file is already in storage at this point; leaving it behind would
    // be an orphan nobody can reach.
    if (filePath) await supabase.storage.from(STUDY_BUCKET).remove([filePath]);
    return {
      ok: false,
      error:
        error.code === "42501"
          ? "Your account is not an admin, so the database rejected the write."
          : error.message,
    };
  }
  return { ok: true };
}

export async function deleteMaterial(material: StudyMaterial): Promise<void> {
  const supabase = getSupabaseBrowser();
  if (!supabase) return;
  if (material.filePath) {
    await supabase.storage.from(STUDY_BUCKET).remove([material.filePath]);
  }
  await supabase.from("study_materials").delete().eq("id", material.id);
}

/* ------------------------------------------------------------- dashboard */

export type AdminStats = {
  jobsActive: number;
  jobsTotal: number;
  materials: number;
  categories: number;
};

// Deliberately no alert/user counts: job_alerts and profiles are owner-only, so
// an admin querying them sees only their own rows. A number that looks global
// but is not would be worse than no number.

export async function getAdminStats(): Promise<AdminStats> {
  const supabase = getSupabaseBrowser();
  const empty: AdminStats = {
    jobsActive: 0,
    jobsTotal: 0,
    materials: 0,
    categories: 0,
  };
  if (!supabase) return empty;

  const head = { count: "exact" as const, head: true };
  const [active, total, materials, categories] = await Promise.all([
    supabase.from("jobs").select("id", head).eq("is_active", true),
    supabase.from("jobs").select("id", head),
    supabase.from("study_materials").select("id", head),
    supabase.from("study_categories").select("id", head),
  ]);

  return {
    jobsActive: active.count ?? 0,
    jobsTotal: total.count ?? 0,
    materials: materials.count ?? 0,
    categories: categories.count ?? 0,
  };
}
