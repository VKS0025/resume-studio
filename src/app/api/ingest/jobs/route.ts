import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/server/supabaseAdmin";
import { fetchAdzunaJobs, isAdzunaConfigured } from "@/lib/server/providers/adzuna";
import { ingestJobs, type IngestReport } from "@/lib/server/ingest";

/**
 * Pulls the job feed and fans out alert notifications.
 *
 * Triggered by the Vercel cron in vercel.json, or by hand for a first fill:
 *   curl -H "Authorization: Bearer $INGEST_SECRET" https://<host>/api/ingest/jobs
 *
 * Route handlers are uncached by default in Next 16, which is what we want —
 * this must actually run every time it is called.
 */

// Broad enough to fill an Indian student job board on the free tier.
const QUERIES = [
  "software engineer",
  "data analyst",
  "internship",
  "government",
  "graduate trainee",
  "teaching",
];

function authorize(request: NextRequest): boolean {
  const secret = process.env.INGEST_SECRET ?? process.env.CRON_SECRET;
  // With no secret set the endpoint is open; fine locally, so warn loudly in
  // the response rather than failing a first-run experiment.
  if (!secret) return true;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(request: NextRequest) {
  if (!authorize(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const admin = getSupabaseAdmin();
  if (!admin) {
    return NextResponse.json(
      { error: "SUPABASE_SERVICE_ROLE_KEY is not set; ingestion cannot write jobs." },
      { status: 503 }
    );
  }
  if (!isAdzunaConfigured()) {
    return NextResponse.json(
      { error: "ADZUNA_APP_ID and ADZUNA_APP_KEY are not set. Get free keys at developer.adzuna.com." },
      { status: 503 }
    );
  }

  const totals: IngestReport = {
    fetched: 0,
    upserted: 0,
    newJobs: 0,
    alertsChecked: 0,
    notificationsCreated: 0,
    emailsSent: 0,
    errors: [],
  };

  for (const what of QUERIES) {
    try {
      const jobs = await fetchAdzunaJobs({ what, perPage: 50 });
      const report = await ingestJobs(admin, jobs);
      totals.fetched += report.fetched;
      totals.upserted += report.upserted;
      totals.newJobs += report.newJobs;
      totals.alertsChecked = Math.max(totals.alertsChecked, report.alertsChecked);
      totals.notificationsCreated += report.notificationsCreated;
      totals.emailsSent += report.emailsSent;
      totals.errors.push(...report.errors);
    } catch (error) {
      totals.errors.push(
        `${what}: ${error instanceof Error ? error.message : "unknown error"}`
      );
    }
  }

  const warnings = process.env.INGEST_SECRET || process.env.CRON_SECRET
    ? []
    : ["No INGEST_SECRET set — this endpoint is currently open to anyone."];

  return NextResponse.json({ ok: totals.errors.length === 0, ...totals, warnings });
}
