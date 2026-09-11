/**
 * Transactional email for job alert digests, via Resend.
 *
 * Optional, like every other integration here: with no RESEND_API_KEY the
 * portal keeps working and students still get in-app notifications. The
 * "email me a digest" checkbox is honoured when this is configured and quietly
 * has no effect when it is not — it is never presented as more than a
 * preference in the UI.
 */

export type DigestJob = {
  id: string;
  title: string;
  company: string;
  location: string;
};

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

/**
 * Absolute URLs, because a relative link in an email goes nowhere. Vercel
 * supplies the production host automatically, so this usually needs no config.
 */
export function siteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/$/, "");
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercel) return `https://${vercel}`;
  return "http://localhost:3001";
}

/** Email bodies are HTML; anything from a job feed has to be escaped. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderDigest(alertLabel: string, jobs: DigestJob[]): { html: string; text: string } {
  const base = siteUrl();
  const heading =
    jobs.length === 1
      ? "1 new opening matches your alert"
      : `${jobs.length} new openings match your alert`;

  const rows = jobs
    .map((job) => {
      const meta = [job.company, job.location].filter(Boolean).map(escapeHtml).join(" · ");
      return `
        <tr>
          <td style="padding:14px 0;border-bottom:1px solid #e2e8f0;">
            <a href="${base}/jobs/${job.id}" style="font-size:15px;font-weight:600;color:#1e293b;text-decoration:none;">${escapeHtml(job.title)}</a>
            ${meta ? `<div style="margin-top:3px;font-size:13px;color:#64748b;">${meta}</div>` : ""}
          </td>
        </tr>`;
    })
    .join("");

  const html = `<!doctype html>
<html><body style="margin:0;padding:24px;background:#f5f6f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:14px;padding:28px;">
    <div style="font-size:16px;font-weight:700;color:#0f172a;">Career<span style="color:#4f46e5;">Setu</span></div>
    <h1 style="margin:18px 0 4px;font-size:19px;line-height:1.3;color:#0f172a;">${escapeHtml(heading)}</h1>
    <p style="margin:0;font-size:13px;color:#64748b;">From your alert &ldquo;${escapeHtml(alertLabel)}&rdquo;</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:14px;">${rows}</table>
    <a href="${base}/jobs" style="display:inline-block;margin-top:22px;background:#4f46e5;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;padding:11px 22px;border-radius:9px;">View all openings</a>
    <p style="margin:26px 0 0;font-size:12px;line-height:1.6;color:#94a3b8;">
      You are getting this because you asked CareerSetu to watch for these jobs.
      <a href="${base}/alerts" style="color:#64748b;">Manage or turn off this alert</a>.
    </p>
  </div>
</body></html>`;

  const text = [
    heading,
    `From your alert "${alertLabel}"`,
    "",
    ...jobs.map((job) =>
      `- ${job.title}${job.company ? ` — ${job.company}` : ""}${job.location ? ` (${job.location})` : ""}\n  ${base}/jobs/${job.id}`
    ),
    "",
    `Manage or turn off this alert: ${base}/alerts`,
  ].join("\n");

  return { html, text };
}

export async function sendJobDigest(options: {
  to: string;
  alertLabel: string;
  jobs: DigestJob[];
}): Promise<{ ok: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { ok: false, error: "RESEND_API_KEY not set" };
  if (options.jobs.length === 0) return { ok: true };

  // Resend only accepts a verified sender; onboarding@resend.dev works
  // immediately but can only deliver to the account owner's own address.
  const from = process.env.EMAIL_FROM ?? "CareerSetu <onboarding@resend.dev>";
  const { html, text } = renderDigest(options.alertLabel, options.jobs);
  const subject =
    options.jobs.length === 1
      ? `New opening: ${options.jobs[0].title}`
      : `${options.jobs.length} new openings for "${options.alertLabel}"`;

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to: [options.to], subject, html, text }),
    });

    if (!response.ok) {
      const body = await response.text();
      return { ok: false, error: `Resend ${response.status}: ${body.slice(0, 200)}` };
    }
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "send failed" };
  }
}
