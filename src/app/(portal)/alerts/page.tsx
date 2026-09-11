"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { EmploymentType, JobAlert, Sector } from "@/lib/portal";
import { EMPLOYMENT_LABELS, SECTOR_LABELS } from "@/lib/portal";
import {
  createAlert,
  deleteAlert,
  listAlerts,
  updateAlert,
} from "@/lib/api/jobs";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { Button, Field, TextInput } from "@/components/ui/controls";

const BLANK = {
  label: "",
  keywords: "",
  location: "",
  sector: null as Sector | null,
  employmentType: null as EmploymentType | null,
  emailDigest: true,
  isActive: true,
};

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<JobAlert[] | null>(null);
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [draft, setDraft] = useState({ ...BLANK });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const supabase = getSupabaseBrowser();
      const { data } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
      if (cancelled) return;
      const isIn = Boolean(data.user);
      setSignedIn(isIn);
      setAlerts(isIn ? await listAlerts() : []);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!draft.keywords.trim() && !draft.location.trim() && !draft.sector) {
      setError("Give the alert at least a keyword, a location or a sector to match on.");
      return;
    }
    setSaving(true);
    setError(null);

    const created = await createAlert({
      ...draft,
      label: draft.label.trim() || draft.keywords.trim() || "My alert",
    });
    setSaving(false);
    if (!created) {
      setError("Could not save that alert. Please try again.");
      return;
    }
    setAlerts((current) => [created, ...(current ?? [])]);
    setDraft({ ...BLANK });
  }

  async function toggle(alert: JobAlert) {
    await updateAlert(alert.id, { isActive: !alert.isActive });
    setAlerts((current) =>
      (current ?? []).map((entry) =>
        entry.id === alert.id ? { ...entry, isActive: !entry.isActive } : entry
      )
    );
  }

  async function remove(id: string) {
    await deleteAlert(id);
    setAlerts((current) => (current ?? []).filter((entry) => entry.id !== id));
  }

  if (signedIn === false) {
    return (
      <div className="mx-auto max-w-md px-6 py-20 text-center">
        <h1 className="text-xl font-bold text-slate-900">Job alerts need an account</h1>
        <p className="mt-2 text-sm text-slate-600">
          Alerts are tied to you, so we know where to send the match. Signing in takes a moment.
        </p>
        <Link href="/login?next=/alerts" className="mt-5 inline-block">
          <Button>Sign in</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">Job alerts</h1>
      <p className="mt-1 text-sm text-slate-600">
        Tell us what you are looking for. When a matching opening arrives you get a notification
        here, and a digest email if you want one.
      </p>

      <form onSubmit={submit} className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-slate-900">Create an alert</h2>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Field label="Keywords" hint="Job title, skill or exam name.">
            <TextInput
              value={draft.keywords}
              onChange={(event) => setDraft({ ...draft, keywords: event.target.value })}
              placeholder="data analyst, SSC CGL"
            />
          </Field>
          <Field label="Location" hint="Leave blank for anywhere.">
            <TextInput
              value={draft.location}
              onChange={(event) => setDraft({ ...draft, location: event.target.value })}
              placeholder="Bengaluru"
            />
          </Field>
          <Field label="Sector">
            <select
              value={draft.sector ?? ""}
              onChange={(event) =>
                setDraft({ ...draft, sector: (event.target.value || null) as Sector | null })
              }
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
            >
              <option value="">Any sector</option>
              {(Object.keys(SECTOR_LABELS) as Sector[]).map((sector) => (
                <option key={sector} value={sector}>
                  {SECTOR_LABELS[sector]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Employment type">
            <select
              value={draft.employmentType ?? ""}
              onChange={(event) =>
                setDraft({
                  ...draft,
                  employmentType: (event.target.value || null) as EmploymentType | null,
                })
              }
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
            >
              <option value="">Any type</option>
              {(Object.keys(EMPLOYMENT_LABELS) as EmploymentType[]).map((type) => (
                <option key={type} value={type}>
                  {EMPLOYMENT_LABELS[type]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Name this alert" hint="Optional — defaults to the keywords.">
            <TextInput
              value={draft.label}
              onChange={(event) => setDraft({ ...draft, label: event.target.value })}
              placeholder="Analyst roles in Bengaluru"
            />
          </Field>
        </div>

        <label className="mt-3 flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={draft.emailDigest}
            onChange={(event) => setDraft({ ...draft, emailDigest: event.target.checked })}
            className="h-4 w-4 rounded border-slate-300 accent-indigo-600"
          />
          Also email me a digest of matches
        </label>

        {error ? (
          <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">{error}</p>
        ) : null}

        <Button type="submit" className="mt-4" disabled={saving}>
          {saving ? "Saving…" : "Create alert"}
        </Button>
      </form>

      <section className="mt-8">
        <h2 className="mb-3 text-sm font-semibold text-slate-900">
          Your alerts {alerts && alerts.length > 0 ? `(${alerts.length})` : ""}
        </h2>

        {alerts === null ? (
          <p className="text-sm text-slate-500">Loading…</p>
        ) : alerts.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-300 bg-white/60 px-4 py-8 text-center text-sm text-slate-500">
            No alerts yet. Create one above and we will watch the feed for you.
          </p>
        ) : (
          <ul className="space-y-2">
            {alerts.map((alert) => (
              <li
                key={alert.id}
                className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-4"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-900">{alert.label}</p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {[
                      alert.keywords || null,
                      alert.location || null,
                      alert.sector ? SECTOR_LABELS[alert.sector] : null,
                      alert.employmentType ? EMPLOYMENT_LABELS[alert.employmentType] : null,
                      alert.emailDigest ? "email on" : null,
                    ]
                      .filter(Boolean)
                      .join("  ·  ")}
                  </p>
                </div>
                <label className="flex shrink-0 items-center gap-1.5 text-xs text-slate-600">
                  <input
                    type="checkbox"
                    checked={alert.isActive}
                    onChange={() => toggle(alert)}
                    className="h-4 w-4 rounded border-slate-300 accent-indigo-600"
                  />
                  Active
                </label>
                <Button variant="danger" onClick={() => remove(alert.id)}>
                  Delete
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
