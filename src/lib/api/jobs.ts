"use client";

import type {
  EmploymentType,
  Job,
  JobAlert,
  Sector,
} from "@/lib/portal";
import { getSupabaseBrowser } from "@/lib/supabase/client";

const JOB_COLUMNS =
  "id,source,source_id,title,company,company_logo,location,is_remote,sector," +
  "employment_type,category,description,apply_url,salary_min,salary_max," +
  "salary_period,currency,qualification,experience,tags,posted_at,deadline";

type JobRow = Record<string, unknown>;

function toJob(row: JobRow): Job {
  return {
    id: row.id as string,
    source: (row.source as string) ?? "manual",
    sourceId: (row.source_id as string) ?? null,
    title: (row.title as string) ?? "",
    company: (row.company as string) ?? "",
    companyLogo: (row.company_logo as string) ?? "",
    location: (row.location as string) ?? "",
    isRemote: Boolean(row.is_remote),
    sector: (row.sector as Sector) ?? "private",
    employmentType: (row.employment_type as EmploymentType) ?? "full_time",
    category: (row.category as string) ?? "",
    description: (row.description as string) ?? "",
    applyUrl: (row.apply_url as string) ?? "",
    salaryMin: (row.salary_min as number) ?? null,
    salaryMax: (row.salary_max as number) ?? null,
    salaryPeriod: (row.salary_period as Job["salaryPeriod"]) ?? "year",
    currency: (row.currency as string) ?? "INR",
    qualification: (row.qualification as string) ?? "",
    experience: (row.experience as string) ?? "",
    tags: (row.tags as string[]) ?? [],
    postedAt: (row.posted_at as string) ?? new Date().toISOString(),
    deadline: (row.deadline as string) ?? null,
  };
}

export type JobFilters = {
  q?: string;
  sector?: Sector | "";
  employmentType?: EmploymentType | "";
  location?: string;
  remoteOnly?: boolean;
  page?: number;
  perPage?: number;
};

export type JobPage = {
  jobs: Job[];
  total: number;
  page: number;
  perPage: number;
};

export async function listJobs(filters: JobFilters = {}): Promise<JobPage> {
  const supabase = getSupabaseBrowser();
  const page = Math.max(1, filters.page ?? 1);
  const perPage = filters.perPage ?? 20;
  const empty: JobPage = { jobs: [], total: 0, page, perPage };
  if (!supabase) return empty;

  let query = supabase
    .from("jobs")
    .select(JOB_COLUMNS, { count: "exact" })
    .eq("is_active", true);

  const q = filters.q?.trim();
  if (q) {
    // websearch syntax lets a student type "data analyst -intern" and have it
    // mean what they expect.
    query = query.textSearch("search_vector", q, { type: "websearch" });
  }
  if (filters.sector) query = query.eq("sector", filters.sector);
  if (filters.employmentType) query = query.eq("employment_type", filters.employmentType);
  if (filters.location?.trim()) query = query.ilike("location", `%${filters.location.trim()}%`);
  if (filters.remoteOnly) query = query.eq("is_remote", true);

  const from = (page - 1) * perPage;
  const { data, error, count } = await query
    .order("posted_at", { ascending: false })
    .range(from, from + perPage - 1);

  if (error || !data) return empty;
  return {
    jobs: (data as unknown as JobRow[]).map(toJob),
    total: count ?? 0,
    page,
    perPage,
  };
}

export async function getJob(id: string): Promise<Job | null> {
  const supabase = getSupabaseBrowser();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("jobs")
    .select(JOB_COLUMNS)
    .eq("id", id)
    .maybeSingle();
  return error || !data ? null : toJob(data as unknown as JobRow);
}

/** Distinct locations actually present in the data, for the filter dropdown. */
export async function listJobLocations(limit = 40): Promise<string[]> {
  const supabase = getSupabaseBrowser();
  if (!supabase) return [];
  const { data } = await supabase
    .from("jobs")
    .select("location")
    .eq("is_active", true)
    .not("location", "eq", "")
    .limit(500);
  if (!data) return [];
  const counts = new Map<string, number>();
  for (const row of data as { location: string }[]) {
    counts.set(row.location, (counts.get(row.location) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([name]) => name);
}

/* --------------------------------------------------------------- saved jobs */

export async function listSavedJobIds(): Promise<Set<string>> {
  const supabase = getSupabaseBrowser();
  if (!supabase) return new Set();
  const { data } = await supabase.from("saved_jobs").select("job_id");
  return new Set((data ?? []).map((row) => (row as { job_id: string }).job_id));
}

export async function listSavedJobs(): Promise<Job[]> {
  const supabase = getSupabaseBrowser();
  if (!supabase) return [];
  const { data } = await supabase
    .from("saved_jobs")
    .select(`created_at, jobs (${JOB_COLUMNS})`)
    .order("created_at", { ascending: false });
  if (!data) return [];
  // A many-to-one embed comes back as a single object, but the generated types
  // describe it as an array — accept either rather than fight the generic.
  return (data as unknown as { jobs: JobRow | JobRow[] | null }[])
    .flatMap((row) => (Array.isArray(row.jobs) ? row.jobs : row.jobs ? [row.jobs] : []))
    .map(toJob);
}

export async function toggleSavedJob(jobId: string, saved: boolean): Promise<boolean> {
  const supabase = getSupabaseBrowser();
  if (!supabase) return false;
  const { data: session } = await supabase.auth.getUser();
  const userId = session.user?.id;
  if (!userId) return false;

  if (saved) {
    const { error } = await supabase.from("saved_jobs").delete().eq("job_id", jobId);
    return !error ? false : saved;
  }
  const { error } = await supabase
    .from("saved_jobs")
    .insert({ job_id: jobId, user_id: userId });
  return error ? saved : true;
}

/* ------------------------------------------------------------- job alerts */

function toAlert(row: JobRow): JobAlert {
  return {
    id: row.id as string,
    label: (row.label as string) ?? "My alert",
    keywords: (row.keywords as string) ?? "",
    location: (row.location as string) ?? "",
    sector: (row.sector as Sector) ?? null,
    employmentType: (row.employment_type as EmploymentType) ?? null,
    emailDigest: Boolean(row.email_digest),
    isActive: Boolean(row.is_active),
    createdAt: (row.created_at as string) ?? "",
  };
}

const ALERT_COLUMNS =
  "id,label,keywords,location,sector,employment_type,email_digest,is_active,created_at";

export async function listAlerts(): Promise<JobAlert[]> {
  const supabase = getSupabaseBrowser();
  if (!supabase) return [];
  const { data } = await supabase
    .from("job_alerts")
    .select(ALERT_COLUMNS)
    .order("created_at", { ascending: false });
  return (data ?? []).map((row) => toAlert(row as unknown as JobRow));
}

export async function createAlert(
  input: Omit<JobAlert, "id" | "createdAt">
): Promise<JobAlert | null> {
  const supabase = getSupabaseBrowser();
  if (!supabase) return null;
  const { data: session } = await supabase.auth.getUser();
  const userId = session.user?.id;
  if (!userId) return null;

  const { data, error } = await supabase
    .from("job_alerts")
    .insert({
      user_id: userId,
      label: input.label,
      keywords: input.keywords,
      location: input.location,
      sector: input.sector,
      employment_type: input.employmentType,
      email_digest: input.emailDigest,
      is_active: input.isActive,
    })
    .select(ALERT_COLUMNS)
    .single();
  return error || !data ? null : toAlert(data as unknown as JobRow);
}

export async function updateAlert(id: string, patch: Partial<JobAlert>): Promise<void> {
  const supabase = getSupabaseBrowser();
  if (!supabase) return;
  const row: Record<string, unknown> = {};
  if (patch.label !== undefined) row.label = patch.label;
  if (patch.keywords !== undefined) row.keywords = patch.keywords;
  if (patch.location !== undefined) row.location = patch.location;
  if (patch.sector !== undefined) row.sector = patch.sector;
  if (patch.employmentType !== undefined) row.employment_type = patch.employmentType;
  if (patch.emailDigest !== undefined) row.email_digest = patch.emailDigest;
  if (patch.isActive !== undefined) row.is_active = patch.isActive;
  if (Object.keys(row).length === 0) return;
  await supabase.from("job_alerts").update(row).eq("id", id);
}

export async function deleteAlert(id: string): Promise<void> {
  const supabase = getSupabaseBrowser();
  if (!supabase) return;
  await supabase.from("job_alerts").delete().eq("id", id);
}
