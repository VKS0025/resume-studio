"use client";

import Link from "next/link";
import type { Job } from "@/lib/portal";
import {
  EMPLOYMENT_LABELS,
  SECTOR_LABELS,
  daysUntil,
  formatSalary,
  timeAgo,
} from "@/lib/portal";

const SECTOR_STYLES: Record<Job["sector"], string> = {
  government: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  private: "bg-indigo-50 text-indigo-700 ring-indigo-200",
  internship: "bg-amber-50 text-amber-700 ring-amber-200",
};

export default function JobCard({
  job,
  saved,
  onToggleSave,
}: {
  job: Job;
  saved?: boolean;
  onToggleSave?: (job: Job) => void;
}) {
  const salary = formatSalary(job);
  const left = daysUntil(job.deadline);

  return (
    <article className="group relative rounded-xl border border-slate-200 bg-white p-4 transition hover:border-slate-300 hover:shadow-sm">
      <div className="flex items-start gap-3">
        <span
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-sm font-bold text-slate-500"
          aria-hidden
        >
          {(job.company || job.title).slice(0, 2).toUpperCase()}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="min-w-0 text-sm font-semibold text-slate-900">
              <Link href={`/jobs/${job.id}`} className="after:absolute after:inset-0">
                {job.title}
              </Link>
            </h3>
            {onToggleSave ? (
              <button
                type="button"
                onClick={(event) => {
                  event.preventDefault();
                  onToggleSave(job);
                }}
                aria-label={saved ? "Remove from saved" : "Save this job"}
                title={saved ? "Remove from saved" : "Save this job"}
                className={`relative z-10 shrink-0 rounded-lg p-1.5 transition ${
                  saved
                    ? "text-indigo-600 hover:bg-indigo-50"
                    : "text-slate-300 hover:bg-slate-100 hover:text-slate-500"
                }`}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill={saved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden>
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                </svg>
              </button>
            ) : null}
          </div>

          <p className="mt-0.5 truncate text-sm text-slate-600">
            {job.company || "—"}
            {job.location ? <span className="text-slate-400"> · {job.location}</span> : null}
            {job.isRemote ? <span className="text-emerald-600"> · Remote</span> : null}
          </p>

          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset ${SECTOR_STYLES[job.sector]}`}>
              {SECTOR_LABELS[job.sector]}
            </span>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600">
              {EMPLOYMENT_LABELS[job.employmentType]}
            </span>
            {salary ? (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                {salary}
              </span>
            ) : null}
            {job.qualification ? (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600">
                {job.qualification}
              </span>
            ) : null}
          </div>

          <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-400">
            <span>{timeAgo(job.postedAt)}</span>
            {left !== null ? (
              <span
                className={
                  left < 0
                    ? "text-slate-400"
                    : left <= 7
                      ? "font-medium text-rose-600"
                      : "text-slate-500"
                }
              >
                {left < 0
                  ? "Closed"
                  : left === 0
                    ? "Last day to apply"
                    : `${left} day${left === 1 ? "" : "s"} left`}
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}
