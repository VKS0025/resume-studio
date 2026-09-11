import type { EmploymentType, Sector } from "@/lib/portal";

/**
 * Adzuna job feed.
 *
 * Chosen over scraping Indeed or LinkedIn, both of which forbid it and block
 * it. Adzuna publishes a documented API with an India index and a free tier.
 * Register at https://developer.adzuna.com to get an app id and key.
 */

export type NormalizedJob = {
  source: string;
  source_id: string;
  title: string;
  company: string;
  location: string;
  is_remote: boolean;
  sector: Sector;
  employment_type: EmploymentType;
  category: string;
  description: string;
  apply_url: string;
  salary_min: number | null;
  salary_max: number | null;
  salary_period: "hour" | "month" | "year";
  currency: string;
  tags: string[];
  posted_at: string;
};

type AdzunaResult = {
  id?: string | number;
  title?: string;
  description?: string;
  created?: string;
  redirect_url?: string;
  company?: { display_name?: string };
  location?: { display_name?: string; area?: string[] };
  salary_min?: number;
  salary_max?: number;
  salary_is_predicted?: string;
  category?: { label?: string; tag?: string };
  contract_time?: string;
  contract_type?: string;
};

export function isAdzunaConfigured(): boolean {
  return Boolean(process.env.ADZUNA_APP_ID && process.env.ADZUNA_APP_KEY);
}

/** Adzuna returns snippets with markup and entities; the UI wants plain text. */
function toPlainText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function toEmploymentType(result: AdzunaResult): EmploymentType {
  if (result.contract_type === "contract") return "contract";
  if (result.contract_time === "part_time") return "part_time";
  const title = (result.title ?? "").toLowerCase();
  if (title.includes("intern")) return "internship";
  return "full_time";
}

/**
 * Adzuna is a private-sector index, but Indian government recruitment does get
 * posted there. Title and company are the only signals available.
 */
function toSector(result: AdzunaResult): Sector {
  const haystack = `${result.title ?? ""} ${result.company?.display_name ?? ""}`.toLowerCase();
  if (/\b(government|govt|ministry|municipal|psu|sarkari|railway|ordnance)\b/.test(haystack)) {
    return "government";
  }
  if (/\bintern(ship)?\b/.test(haystack)) return "internship";
  return "private";
}

export async function fetchAdzunaJobs(options: {
  country?: string;
  what?: string;
  page?: number;
  perPage?: number;
}): Promise<NormalizedJob[]> {
  const appId = process.env.ADZUNA_APP_ID;
  const appKey = process.env.ADZUNA_APP_KEY;
  if (!appId || !appKey) return [];

  const country = options.country ?? "in";
  const page = options.page ?? 1;
  const params = new URLSearchParams({
    app_id: appId,
    app_key: appKey,
    results_per_page: String(options.perPage ?? 50),
    "content-type": "application/json",
  });
  if (options.what) params.set("what", options.what);

  const response = await fetch(
    `https://api.adzuna.com/v1/api/jobs/${country}/search/${page}?${params.toString()}`,
    { cache: "no-store" }
  );
  if (!response.ok) {
    throw new Error(`Adzuna responded ${response.status}`);
  }

  const body = (await response.json()) as { results?: AdzunaResult[] };
  const results = body.results ?? [];

  return results
    .filter((result) => result.id && result.title)
    .map((result) => {
      const location = result.location?.display_name ?? "";
      const description = toPlainText(result.description ?? "");
      return {
        source: "adzuna",
        source_id: String(result.id),
        title: result.title!.trim(),
        company: result.company?.display_name?.trim() ?? "",
        location,
        is_remote: /remote|work from home/i.test(`${result.title} ${description}`),
        sector: toSector(result),
        employment_type: toEmploymentType(result),
        category: result.category?.label ?? "",
        description,
        apply_url: result.redirect_url ?? "",
        // A predicted salary is a guess, not a figure the employer stated —
        // showing it as fact would mislead.
        salary_min: result.salary_is_predicted === "1" ? null : (result.salary_min ?? null),
        salary_max: result.salary_is_predicted === "1" ? null : (result.salary_max ?? null),
        salary_period: "year" as const,
        currency: country === "in" ? "INR" : "USD",
        tags: [result.category?.label, ...(result.location?.area ?? []).slice(1, 3)].filter(
          (tag): tag is string => Boolean(tag)
        ),
        posted_at: result.created ?? new Date().toISOString(),
      };
    });
}
