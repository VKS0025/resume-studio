"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Job } from "@/lib/portal";
import { listSavedJobs, toggleSavedJob } from "@/lib/api/jobs";
import JobCard from "@/components/jobs/JobCard";

export default function SavedJobsPage() {
  const [jobs, setJobs] = useState<Job[] | null>(null);

  useEffect(() => {
    listSavedJobs().then(setJobs);
  }, []);

  async function unsave(job: Job) {
    await toggleSavedJob(job.id, true);
    setJobs((current) => (current ?? []).filter((entry) => entry.id !== job.id));
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">Saved jobs</h1>
      <p className="mt-1 text-sm text-slate-600">Openings you bookmarked to come back to.</p>

      <div className="mt-6">
        {jobs === null ? (
          <p className="text-sm text-slate-500">Loading…</p>
        ) : jobs.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 px-6 py-14 text-center">
            <p className="text-base font-semibold text-slate-800">Nothing saved yet</p>
            <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
              Tap the bookmark on any opening and it will wait for you here.
            </p>
            <Link href="/jobs" className="mt-4 inline-block text-sm font-medium text-indigo-600">
              Browse jobs →
            </Link>
          </div>
        ) : (
          <ul className="space-y-3">
            {jobs.map((job) => (
              <li key={job.id}>
                <JobCard job={job} saved onToggleSave={unsave} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
