"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Job } from "@/lib/portal";
import {
  EMPLOYMENT_LABELS,
  SECTOR_LABELS,
  daysUntil,
  formatSalary,
  timeAgo,
} from "@/lib/portal";
import { getJob, listSavedJobIds, toggleSavedJob } from "@/lib/api/jobs";
import { Button } from "@/components/ui/controls";

export default function JobDetail({ jobId }: { jobId: string }) {
  const [job, setJob] = useState<Job | null | "missing">(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [found, savedIds] = await Promise.all([getJob(jobId), listSavedJobIds()]);
      if (cancelled) return;
      setJob(found ?? "missing");
      setSaved(savedIds.has(jobId));
    })();
    return () => {
      cancelled = true;
    };
  }, [jobId]);

  if (job === null) {
    return <div className="mx-auto max-w-3xl px-6 py-12 text-sm text-slate-500">Loading…</div>;
  }

  if (job === "missing") {
    return (
      <div className="mx-auto max-w-3xl px-6 py-16 text-center">
        <h1 className="text-lg font-semibold text-slate-900">This opening is no longer listed</h1>
        <p className="mt-1 text-sm text-slate-500">
          It may have closed or been removed by the source.
        </p>
        <Link href="/jobs" className="mt-5 inline-block text-sm font-medium text-indigo-600">
          ← Back to all jobs
        </Link>
      </div>
    );
  }

  const salary = formatSalary(job);
  const left = daysUntil(job.deadline);
  const closed = left !== null && left < 0;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <Link href="/jobs" className="text-sm font-medium text-slate-500 hover:text-slate-800">
        ← All jobs
      </Link>

      <header className="mt-4 rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex items-start gap-4">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-lg font-bold text-slate-500">
            {(job.company || job.title).slice(0, 2).toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">{job.title}</h1>
            <p className="mt-0.5 text-sm text-slate-600">
              {job.company || "—"}
              {job.location ? <span className="text-slate-400"> · {job.location}</span> : null}
              {job.isRemote ? <span className="text-emerald-600"> · Remote</span> : null}
            </p>
            <p className="mt-1 text-xs text-slate-400">Posted {timeAgo(job.postedAt)}</p>
          </div>
        </div>

        <dl className="mt-5 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4 sm:grid-cols-4">
          <Fact label="Sector" value={SECTOR_LABELS[job.sector]} />
          <Fact label="Type" value={EMPLOYMENT_LABELS[job.employmentType]} />
          <Fact label="Salary" value={salary || "Not disclosed"} />
          <Fact
            label="Apply by"
            value={
              job.deadline
                ? closed
                  ? "Closed"
                  : `${job.deadline}${left !== null && left <= 7 ? ` · ${left}d left` : ""}`
                : "Not specified"
            }
            urgent={!closed && left !== null && left <= 7}
          />
          {job.qualification ? <Fact label="Qualification" value={job.qualification} /> : null}
          {job.experience ? <Fact label="Experience" value={job.experience} /> : null}
          {job.category ? <Fact label="Category" value={job.category} /> : null}
        </dl>

        <div className="mt-5 flex flex-wrap gap-2">
          {job.applyUrl ? (
            <a
              href={job.applyUrl}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className={`rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition ${
                closed ? "pointer-events-none bg-slate-300" : "bg-indigo-600 hover:bg-indigo-700"
              }`}
            >
              {closed ? "Applications closed" : "Apply on official site ↗"}
            </a>
          ) : null}
          <Button
            variant="secondary"
            onClick={async () => setSaved(await toggleSavedJob(job.id, saved))}
          >
            {saved ? "★ Saved" : "☆ Save this job"}
          </Button>
          <Link href="/dashboard">
            <Button variant="secondary">Tailor my resume</Button>
          </Link>
        </div>

        {/* Applications happen on the employer's own site, so be explicit that
            leaving this page is expected and no fee is ever collected here. */}
        <p className="mt-3 text-[11px] leading-relaxed text-slate-400">
          Applications are submitted on the employer&apos;s or department&apos;s official website.
          CareerSetu never asks for an application fee. Always verify details on the official
          notification before paying anything.
        </p>
      </header>

      {job.description ? (
        <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-slate-900">About this role</h2>
          <div className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-700">
            {job.description}
          </div>
        </section>
      ) : null}

      {job.tags.length > 0 ? (
        <section className="mt-5">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Related searches
          </h2>
          <div className="flex flex-wrap gap-1.5">
            {job.tags.map((tag) => (
              <Link
                key={tag}
                href={`/jobs?q=${encodeURIComponent(tag)}`}
                className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600 hover:border-slate-300"
              >
                {tag}
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function Fact({ label, value, urgent }: { label: string; value: string; urgent?: boolean }) {
  return (
    <div>
      <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</dt>
      <dd className={`mt-0.5 text-sm ${urgent ? "font-semibold text-rose-600" : "text-slate-800"}`}>
        {value}
      </dd>
    </div>
  );
}
