import type { SupabaseClient } from "@supabase/supabase-js";
import type { NormalizedJob } from "./providers/adzuna";

export type IngestReport = {
  fetched: number;
  upserted: number;
  /** Rows that did not exist before this run — the only ones worth alerting on. */
  newJobs: number;
  alertsChecked: number;
  notificationsCreated: number;
  errors: string[];
};

/**
 * Writes a batch of feed jobs, then tells anyone whose alert matches.
 *
 * Upsert is keyed on (source, source_id) so re-running the feed refreshes an
 * existing listing instead of duplicating it — the same job appears in the
 * feed every day it stays open.
 */
export async function ingestJobs(
  admin: SupabaseClient,
  jobs: NormalizedJob[]
): Promise<IngestReport> {
  const report: IngestReport = {
    fetched: jobs.length,
    upserted: 0,
    newJobs: 0,
    alertsChecked: 0,
    notificationsCreated: 0,
    errors: [],
  };
  if (jobs.length === 0) return report;

  // Which of these does the database already hold? The feed returns the same
  // listing every day it stays open, so without this every run would re-notify
  // every student about jobs they were told about yesterday.
  const source = jobs[0].source;
  const { data: existingRows } = await admin
    .from("jobs")
    .select("source_id")
    .eq("source", source)
    .in(
      "source_id",
      jobs.map((job) => job.source_id)
    );
  const alreadyKnown = new Set(
    (existingRows ?? []).map((row) => (row as { source_id: string }).source_id)
  );

  const { data: written, error } = await admin
    .from("jobs")
    .upsert(jobs, { onConflict: "source,source_id" })
    .select("id,source_id,title,company,location,sector,employment_type,posted_at");

  if (error) {
    report.errors.push(`upsert: ${error.message}`);
    return report;
  }
  report.upserted = written?.length ?? 0;

  const freshlyAdded = ((written ?? []) as MatchableJob[]).filter(
    (job) => !alreadyKnown.has(job.source_id)
  );
  report.newJobs = freshlyAdded.length;

  await notifyMatchingAlerts(admin, freshlyAdded, report);
  return report;
}

type MatchableJob = {
  id: string;
  source_id: string;
  title: string;
  company: string;
  location: string;
  sector: string;
  employment_type: string;
};

type AlertRow = {
  id: string;
  user_id: string;
  label: string;
  keywords: string;
  location: string;
  sector: string | null;
  employment_type: string | null;
  last_matched_at: string;
};

/** Every term in the alert's keywords must appear somewhere in the job. */
function matches(job: MatchableJob, alert: AlertRow): boolean {
  if (alert.sector && job.sector !== alert.sector) return false;
  if (alert.employment_type && job.employment_type !== alert.employment_type) return false;

  if (alert.location.trim()) {
    if (!job.location.toLowerCase().includes(alert.location.trim().toLowerCase())) return false;
  }

  const terms = alert.keywords
    .toLowerCase()
    .split(/[,\s]+/)
    .map((term) => term.trim())
    .filter(Boolean);
  if (terms.length === 0) return true;

  const haystack = `${job.title} ${job.company} ${job.location}`.toLowerCase();
  return terms.every((term) => haystack.includes(term));
}

async function notifyMatchingAlerts(
  admin: SupabaseClient,
  jobs: MatchableJob[],
  report: IngestReport
): Promise<void> {
  if (jobs.length === 0) return;

  const { data: alerts, error } = await admin
    .from("job_alerts")
    .select("id,user_id,label,keywords,location,sector,employment_type,last_matched_at")
    .eq("is_active", true);

  if (error) {
    report.errors.push(`alerts: ${error.message}`);
    return;
  }
  report.alertsChecked = alerts?.length ?? 0;
  if (!alerts || alerts.length === 0) return;

  const notifications: Record<string, unknown>[] = [];

  for (const alert of alerts as AlertRow[]) {
    const hits = jobs.filter((job) => matches(job, alert));
    if (hits.length === 0) continue;

    // One notification per alert per run, not one per job — a feed that
    // returns 40 matches should not produce 40 rows in someone's inbox.
    const [first] = hits;
    notifications.push({
      user_id: alert.user_id,
      kind: "job_match",
      title:
        hits.length === 1
          ? `New match: ${first.title}`
          : `${hits.length} new matches for "${alert.label}"`,
      body:
        hits.length === 1
          ? [first.company, first.location].filter(Boolean).join(" · ")
          : hits
              .slice(0, 3)
              .map((job) => job.title)
              .join(", "),
      link: hits.length === 1 ? `/jobs/${first.id}` : "/jobs",
    });
  }

  if (notifications.length === 0) return;

  const { error: insertError } = await admin.from("notifications").insert(notifications);
  if (insertError) {
    report.errors.push(`notifications: ${insertError.message}`);
    return;
  }
  report.notificationsCreated = notifications.length;

  const now = new Date().toISOString();
  await admin
    .from("job_alerts")
    .update({ last_matched_at: now })
    .in(
      "id",
      (alerts as AlertRow[]).map((alert) => alert.id)
    );
}
