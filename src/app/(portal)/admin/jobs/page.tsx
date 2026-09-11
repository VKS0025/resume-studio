"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { EmploymentType, Sector } from "@/lib/portal";
import { EMPLOYMENT_LABELS, SECTOR_LABELS, timeAgo } from "@/lib/portal";
import {
  BLANK_JOB,
  deleteJob,
  listAllJobs,
  saveJob,
  setJobActive,
  type JobDraft,
} from "@/lib/api/admin";
import AdminGuard from "@/components/admin/AdminGuard";
import { Button, Field, TextArea, TextInput } from "@/components/ui/controls";

type Row = Record<string, unknown> & { is_active: boolean };

export default function AdminJobsPage() {
  return (
    <AdminGuard>
      <Suspense fallback={<p className="text-sm text-slate-500">Loading…</p>}>
        <JobsAdmin />
      </Suspense>
    </AdminGuard>
  );
}

function JobsAdmin() {
  const params = useSearchParams();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [draft, setDraft] = useState<JobDraft | null>(params.get("new") ? { ...BLANK_JOB } : null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setRows((await listAllJobs()) as Row[]);
  }, []);

  // setState inside the promise callback, not the effect body: the effect is
  // subscribing to an external system, which is what the rule asks for.
  useEffect(() => {
    listAllJobs().then((data) => setRows(data as Row[]));
  }, []);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!draft) return;
    setSaving(true);
    setError(null);
    const result = await saveJob(draft);
    setSaving(false);
    if (!result.ok) {
      setError(result.error ?? "Could not save.");
      return;
    }
    setFlash(draft.id ? "Job updated." : "Job posted — it is live on /jobs now.");
    setDraft(null);
    refresh();
  }

  const set = (changes: Partial<JobDraft>) =>
    setDraft((current) => (current ? { ...current, ...changes } : current));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-slate-600">
          {rows ? `${rows.length} job${rows.length === 1 ? "" : "s"}` : "Loading…"}
        </p>
        <Button onClick={() => { setDraft({ ...BLANK_JOB }); setFlash(null); }}>
          + Post a job
        </Button>
      </div>

      {flash ? (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-700">{flash}</p>
      ) : null}

      {draft ? (
        <form onSubmit={submit} className="rounded-xl border border-indigo-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-slate-900">
            {draft.id ? "Edit job" : "New job"}
          </h2>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Field label="Title *">
              <TextInput value={draft.title} onChange={(e) => set({ title: e.target.value })} />
            </Field>
            <Field label="Company / department">
              <TextInput value={draft.company} onChange={(e) => set({ company: e.target.value })} />
            </Field>
            <Field label="Location">
              <TextInput
                value={draft.location}
                onChange={(e) => set({ location: e.target.value })}
                placeholder="All India"
              />
            </Field>
            <Field label="Category">
              <TextInput
                value={draft.category}
                onChange={(e) => set({ category: e.target.value })}
                placeholder="Banking"
              />
            </Field>
            <Field label="Sector">
              <select
                value={draft.sector}
                onChange={(e) => set({ sector: e.target.value as Sector })}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
              >
                {(Object.keys(SECTOR_LABELS) as Sector[]).map((s) => (
                  <option key={s} value={s}>{SECTOR_LABELS[s]}</option>
                ))}
              </select>
            </Field>
            <Field label="Employment type">
              <select
                value={draft.employmentType}
                onChange={(e) => set({ employmentType: e.target.value as EmploymentType })}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
              >
                {(Object.keys(EMPLOYMENT_LABELS) as EmploymentType[]).map((t) => (
                  <option key={t} value={t}>{EMPLOYMENT_LABELS[t]}</option>
                ))}
              </select>
            </Field>
            <Field label="Qualification">
              <TextInput
                value={draft.qualification}
                onChange={(e) => set({ qualification: e.target.value })}
                placeholder="Graduate in any discipline"
              />
            </Field>
            <Field label="Experience">
              <TextInput
                value={draft.experience}
                onChange={(e) => set({ experience: e.target.value })}
                placeholder="Fresher"
              />
            </Field>
            <Field label="Salary from">
              <TextInput value={draft.salaryMin} onChange={(e) => set({ salaryMin: e.target.value })} placeholder="25500" />
            </Field>
            <Field label="Salary to">
              <TextInput value={draft.salaryMax} onChange={(e) => set({ salaryMax: e.target.value })} placeholder="81100" />
            </Field>
            <Field label="Salary period">
              <select
                value={draft.salaryPeriod}
                onChange={(e) => set({ salaryPeriod: e.target.value as JobDraft["salaryPeriod"] })}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
              >
                <option value="month">Per month</option>
                <option value="year">Per year</option>
                <option value="hour">Per hour</option>
              </select>
            </Field>
            <Field label="Apply by" hint="Leave blank if there is no closing date.">
              <TextInput type="date" value={draft.deadline} onChange={(e) => set({ deadline: e.target.value })} />
            </Field>
          </div>

          <div className="mt-3">
            <Field label="Official application link">
              <TextInput
                value={draft.applyUrl}
                onChange={(e) => set({ applyUrl: e.target.value })}
                placeholder="https://ssc.gov.in/..."
              />
            </Field>
          </div>

          <div className="mt-3">
            <Field label="Description" hint="Plain text. Blank lines become paragraphs.">
              <TextArea
                value={draft.description}
                onChange={(e) => set({ description: e.target.value })}
                className="min-h-[140px]"
              />
            </Field>
          </div>

          <div className="mt-3 flex flex-wrap gap-4">
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={draft.isRemote} onChange={(e) => set({ isRemote: e.target.checked })} className="h-4 w-4 accent-indigo-600" />
              Remote
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={draft.isActive} onChange={(e) => set({ isActive: e.target.checked })} className="h-4 w-4 accent-indigo-600" />
              Visible on the job board
            </label>
          </div>

          {error ? (
            <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">{error}</p>
          ) : null}

          <div className="mt-4 flex gap-2 border-t border-slate-100 pt-4">
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : draft.id ? "Save changes" : "Post job"}
            </Button>
            <Button type="button" variant="secondary" onClick={() => { setDraft(null); setError(null); }}>
              Cancel
            </Button>
          </div>
        </form>
      ) : null}

      {rows && rows.length > 0 ? (
        <ul className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 bg-white">
          {rows.map((row) => (
            <li key={row.id as string} className="flex flex-wrap items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-900">
                  {row.title as string}
                  {!row.is_active ? (
                    <span className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-slate-500">
                      Hidden
                    </span>
                  ) : null}
                </p>
                <p className="truncate text-xs text-slate-500">
                  {[row.company, row.location, SECTOR_LABELS[row.sector as Sector]]
                    .filter(Boolean)
                    .join(" · ")}
                  {" · "}
                  <span className="text-slate-400">
                    {row.source as string} · {timeAgo(row.posted_at as string)}
                  </span>
                </p>
              </div>
              <div className="flex shrink-0 gap-1">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setFlash(null);
                    setDraft({
                      id: row.id as string,
                      title: (row.title as string) ?? "",
                      company: (row.company as string) ?? "",
                      location: (row.location as string) ?? "",
                      isRemote: Boolean(row.is_remote),
                      sector: row.sector as Sector,
                      employmentType: row.employment_type as EmploymentType,
                      category: (row.category as string) ?? "",
                      description: (row.description as string) ?? "",
                      applyUrl: (row.apply_url as string) ?? "",
                      salaryMin: row.salary_min ? String(row.salary_min) : "",
                      salaryMax: row.salary_max ? String(row.salary_max) : "",
                      salaryPeriod: (row.salary_period as JobDraft["salaryPeriod"]) ?? "month",
                      qualification: (row.qualification as string) ?? "",
                      experience: (row.experience as string) ?? "",
                      deadline: (row.deadline as string) ?? "",
                      isActive: row.is_active,
                    });
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                >
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  onClick={async () => {
                    await setJobActive(row.id as string, !row.is_active);
                    refresh();
                  }}
                >
                  {row.is_active ? "Hide" : "Show"}
                </Button>
                <Button
                  variant="danger"
                  onClick={async () => {
                    if (!confirm(`Delete "${row.title as string}" permanently?`)) return;
                    await deleteJob(row.id as string);
                    refresh();
                  }}
                >
                  Delete
                </Button>
              </div>
            </li>
          ))}
        </ul>
      ) : rows ? (
        <p className="rounded-xl border border-dashed border-slate-300 bg-white/60 px-4 py-10 text-center text-sm text-slate-500">
          No jobs yet. Post one above.
        </p>
      ) : null}
    </div>
  );
}
