"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { EmploymentType, Job, Sector } from "@/lib/portal";
import { EMPLOYMENT_LABELS, SECTOR_LABELS } from "@/lib/portal";
import {
  listJobLocations,
  listJobs,
  listSavedJobIds,
  toggleSavedJob,
  type JobFilters,
} from "@/lib/api/jobs";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import JobCard from "@/components/jobs/JobCard";
import { Button, TextInput } from "@/components/ui/controls";

const PER_PAGE = 20;

export default function JobsPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-6xl px-6 py-10 text-sm text-slate-500">Loading jobs…</div>}>
      <JobsBrowser />
    </Suspense>
  );
}

function JobsBrowser() {
  const router = useRouter();
  const params = useSearchParams();

  // The URL is the state, so a filtered search is a shareable link.
  const filters: JobFilters = useMemo(
    () => ({
      q: params.get("q") ?? "",
      sector: (params.get("sector") as Sector | null) ?? "",
      employmentType: (params.get("type") as EmploymentType | null) ?? "",
      location: params.get("location") ?? "",
      remoteOnly: params.get("remote") === "1",
      page: Number(params.get("page") ?? 1),
      perPage: PER_PAGE,
    }),
    [params]
  );

  const [jobs, setJobs] = useState<Job[] | null>(null);
  const [total, setTotal] = useState(0);
  const [locations, setLocations] = useState<string[]>([]);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [result, saved] = await Promise.all([listJobs(filters), listSavedJobIds()]);
      if (cancelled) return;
      setJobs(result.jobs);
      setTotal(result.total);
      setSavedIds(saved);
    })();
    return () => {
      cancelled = true;
    };
  }, [filters]);

  useEffect(() => {
    listJobLocations().then(setLocations);
  }, []);

  const setParam = useCallback(
    (updates: Record<string, string | null>) => {
      const next = new URLSearchParams(params.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === "") next.delete(key);
        else next.set(key, value);
      }
      // Any filter change invalidates the current page number.
      if (!("page" in updates)) next.delete("page");
      router.push(`/jobs?${next.toString()}`);
    },
    [params, router]
  );

  async function onToggleSave(job: Job) {
    const wasSaved = savedIds.has(job.id);
    const nowSaved = await toggleSavedJob(job.id, wasSaved);
    setSavedIds((current) => {
      const next = new Set(current);
      if (nowSaved) next.add(job.id);
      else next.delete(job.id);
      return next;
    });
  }

  const pages = Math.max(1, Math.ceil(total / PER_PAGE));
  const page = filters.page ?? 1;
  const activeFilters =
    Boolean(filters.q || filters.sector || filters.employmentType || filters.location || filters.remoteOnly);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Jobs & notifications</h1>
        <p className="mt-1 text-sm text-slate-600">
          Government notifications, private openings and internships in one place.
        </p>
      </header>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          const entered = new FormData(event.currentTarget).get("q");
          setParam({ q: typeof entered === "string" ? entered : "" });
        }}
        className="mb-4 flex flex-wrap gap-2"
      >
        <div className="min-w-[220px] flex-1">
          {/* Uncontrolled, keyed on the URL: the query string is the state, so
              mirroring it into React state as well only creates a second copy
              to keep in sync. */}
          <TextInput
            key={filters.q}
            name="q"
            defaultValue={filters.q}
            placeholder="Job title, company or keyword"
            aria-label="Search jobs"
          />
        </div>
        <select
          value={filters.location ?? ""}
          onChange={(event) => setParam({ location: event.target.value })}
          aria-label="Location"
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
        >
          <option value="">All locations</option>
          {locations.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
        <Button type="submit">Search</Button>
      </form>

      <div className="mb-5 flex flex-wrap items-center gap-1.5">
        <FilterChip label="All" active={!filters.sector} onClick={() => setParam({ sector: null })} />
        {(Object.keys(SECTOR_LABELS) as Sector[]).map((sector) => (
          <FilterChip
            key={sector}
            label={SECTOR_LABELS[sector]}
            active={filters.sector === sector}
            onClick={() => setParam({ sector })}
          />
        ))}
        <span className="mx-1 h-5 w-px bg-slate-200" />
        <select
          value={filters.employmentType ?? ""}
          onChange={(event) => setParam({ type: event.target.value })}
          aria-label="Employment type"
          className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700"
        >
          <option value="">Any type</option>
          {(Object.keys(EMPLOYMENT_LABELS) as EmploymentType[]).map((type) => (
            <option key={type} value={type}>
              {EMPLOYMENT_LABELS[type]}
            </option>
          ))}
        </select>
        <FilterChip
          label="Remote only"
          active={Boolean(filters.remoteOnly)}
          onClick={() => setParam({ remote: filters.remoteOnly ? null : "1" })}
        />
        {activeFilters ? (
          <button
            type="button"
            onClick={() => router.push("/jobs")}
            className="ml-1 text-xs font-medium text-slate-500 underline underline-offset-2 hover:text-slate-800"
          >
            Clear all
          </button>
        ) : null}
      </div>

      {jobs === null ? (
        <ul className="space-y-3">
          {[0, 1, 2, 3, 4].map((key) => (
            <li key={key} className="h-[104px] animate-pulse rounded-xl bg-white" />
          ))}
        </ul>
      ) : jobs.length === 0 ? (
        <EmptyState configured={isSupabaseConfigured} filtered={activeFilters} />
      ) : (
        <>
          <p className="mb-3 text-xs text-slate-500">
            {total.toLocaleString("en-IN")} {total === 1 ? "opening" : "openings"}
            {activeFilters ? " matching your filters" : ""}
          </p>
          <ul className="space-y-3">
            {jobs.map((job) => (
              <li key={job.id}>
                <JobCard job={job} saved={savedIds.has(job.id)} onToggleSave={onToggleSave} />
              </li>
            ))}
          </ul>

          {pages > 1 ? (
            <nav className="mt-6 flex items-center justify-center gap-2" aria-label="Pagination">
              <Button
                variant="secondary"
                disabled={page <= 1}
                onClick={() => setParam({ page: String(page - 1) })}
              >
                Previous
              </Button>
              <span className="px-2 text-sm text-slate-500">
                Page {page} of {pages}
              </span>
              <Button
                variant="secondary"
                disabled={page >= pages}
                onClick={() => setParam({ page: String(page + 1) })}
              >
                Next
              </Button>
            </nav>
          ) : null}
        </>
      )}
    </div>
  );
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
        active
          ? "bg-slate-900 text-white"
          : "border border-slate-200 bg-white text-slate-600 hover:border-slate-300"
      }`}
    >
      {label}
    </button>
  );
}

function EmptyState({ configured, filtered }: { configured: boolean; filtered: boolean }) {
  if (!configured) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-6 py-12 text-center">
        <p className="font-semibold text-amber-900">The job board needs a database</p>
        <p className="mx-auto mt-1 max-w-md text-sm text-amber-800">
          Add your Supabase keys to <code>.env.local</code> and run the migrations in{" "}
          <code>supabase/migrations/</code>.
        </p>
      </div>
    );
  }
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 px-6 py-14 text-center">
      <p className="text-base font-semibold text-slate-800">
        {filtered ? "No openings match those filters" : "No openings posted yet"}
      </p>
      <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
        {filtered
          ? "Try widening the location or clearing a filter."
          : "Once the job feed runs, openings will appear here automatically."}
      </p>
      {filtered ? (
        <Link href="/jobs" className="mt-4 inline-block text-sm font-medium text-indigo-600 hover:text-indigo-700">
          Clear filters →
        </Link>
      ) : null}
    </div>
  );
}
