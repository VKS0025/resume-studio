"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ResumeRecord } from "@/lib/resume";
import { deleteResume, duplicateResume, listResumes } from "@/lib/store";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getTemplate } from "@/components/templates";
import { Button } from "@/components/ui/controls";

export default function DashboardPage() {
  const router = useRouter();
  const [resumes, setResumes] = useState<ResumeRecord[] | null>(null);
  const [email, setEmail] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setResumes(await listResumes());
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const supabase = getSupabaseBrowser();
      const [session, rows] = await Promise.all([
        supabase ? supabase.auth.getUser() : Promise.resolve(null),
        listResumes(),
      ]);
      if (cancelled) return;
      setEmail(session?.data.user?.email ?? null);
      setResumes(rows);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  async function signOut() {
    await getSupabaseBrowser()?.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link href="/" className="text-sm font-medium text-slate-500 hover:text-slate-800">
            Resume Studio
          </Link>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">My resumes</h1>
          <p className="mt-1 text-sm text-slate-500">
            {email
              ? `Signed in as ${email} — saved to your account.`
              : isSupabaseConfigured
                ? "Saved in this browser. Sign in to sync across devices."
                : "Saved in this browser."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {email ? (
            <Button variant="secondary" onClick={signOut}>
              Sign out
            </Button>
          ) : isSupabaseConfigured ? (
            <Link href="/login">
              <Button variant="secondary">Sign in</Button>
            </Link>
          ) : null}
          <Link href="/editor/new">
            <Button>+ New resume</Button>
          </Link>
        </div>
      </header>

      {resumes === null ? (
        <p className="text-sm text-slate-500">Loading…</p>
      ) : resumes.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 px-6 py-16 text-center">
          <p className="text-base font-semibold text-slate-800">No resumes yet</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
            Start from a filled-in example and edit it down — faster than facing a blank page.
          </p>
          <Link href="/editor/new" className="mt-5 inline-block">
            <Button>Create my first resume</Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {resumes.map((resume) => (
            <article
              key={resume.id}
              className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white transition hover:border-slate-300 hover:shadow-sm"
            >
              <Link href={`/editor/${resume.id}`} className="block p-4">
                <span
                  className="inline-block rounded-full px-2 py-0.5 text-[11px] font-medium"
                  style={{
                    backgroundColor: `${resume.data.settings.accent}15`,
                    color: resume.data.settings.accent,
                  }}
                >
                  {getTemplate(resume.data.settings.template).name}
                </span>
                <h2 className="mt-2 truncate text-sm font-semibold text-slate-900">
                  {resume.title}
                </h2>
                <p className="mt-0.5 truncate text-xs text-slate-500">
                  {resume.data.basics.fullName || "No name yet"}
                </p>
                <p className="mt-3 text-[11px] text-slate-400">
                  Updated {formatDate(resume.updatedAt)}
                </p>
              </Link>
              <div className="mt-auto flex items-center gap-1 border-t border-slate-100 px-2 py-1.5">
                <Link href={`/editor/${resume.id}`} className="flex-1">
                  <Button variant="ghost" className="w-full justify-start">
                    Edit
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  onClick={async () => {
                    await duplicateResume(resume.id);
                    refresh();
                  }}
                >
                  Duplicate
                </Button>
                <Button
                  variant="danger"
                  onClick={async () => {
                    if (!confirm(`Delete "${resume.title}"? This cannot be undone.`)) return;
                    await deleteResume(resume.id);
                    refresh();
                  }}
                >
                  Delete
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "just now";
  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
