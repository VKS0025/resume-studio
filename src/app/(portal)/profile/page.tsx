"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Profile } from "@/lib/portal";
import { getMyProfile, profileFromResume, saveProfile } from "@/lib/api/profile";
import { listResumes } from "@/lib/store";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { Button, Field, TextArea, TextInput } from "@/components/ui/controls";

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [imported, setImported] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const supabase = getSupabaseBrowser();
      const { data } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
      if (cancelled) return;
      if (!data.user) {
        setSignedIn(false);
        return;
      }
      setSignedIn(true);
      setProfile(await getMyProfile());
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  function patch(changes: Partial<Profile>) {
    setStatus("idle");
    setProfile((current) => (current ? { ...current, ...changes } : current));
  }

  async function save() {
    if (!profile) return;
    setStatus("saving");
    setStatus((await saveProfile(profile)) ? "saved" : "error");
  }

  /** Pull the details the student already typed into Resume Studio. */
  async function importFromResume() {
    const resumes = await listResumes();
    if (resumes.length === 0) {
      setImported("No resume found — build one first and the details will come across.");
      return;
    }
    const newest = resumes[0];
    patch(profileFromResume(newest.data));
    setImported(`Filled in from "${newest.title}". Review it, then save.`);
  }

  if (signedIn === false) {
    return (
      <div className="mx-auto max-w-md px-6 py-20 text-center">
        <h1 className="text-xl font-bold text-slate-900">Your profile needs an account</h1>
        <p className="mt-2 text-sm text-slate-600">
          Sign in to build a profile recruiters can find, reusing what is already in your resume.
        </p>
        <Link href="/login?next=/profile" className="mt-5 inline-block">
          <Button>Sign in</Button>
        </Link>
      </div>
    );
  }

  if (!profile) {
    return <div className="mx-auto max-w-3xl px-6 py-12 text-sm text-slate-500">Loading…</div>;
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">My profile</h1>
          <p className="mt-1 text-sm text-slate-600">
            Used across the portal and shown to recruiters when you make it public.
          </p>
        </div>
        <Button variant="secondary" onClick={importFromResume}>
          Import from my resume
        </Button>
      </div>

      {imported ? (
        <p className="mt-4 rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-700">{imported}</p>
      ) : null}

      <div className="mt-6 space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Full name">
            <TextInput
              value={profile.fullName}
              onChange={(event) => patch({ fullName: event.target.value })}
            />
          </Field>
          <Field label="Headline">
            <TextInput
              value={profile.headline}
              onChange={(event) => patch({ headline: event.target.value })}
              placeholder="Final-year CSE student · Aspiring data analyst"
            />
          </Field>
          <Field label="Location">
            <TextInput
              value={profile.location}
              onChange={(event) => patch({ location: event.target.value })}
            />
          </Field>
          <Field label="Skills" hint="Separate with commas.">
            <TextInput
              value={profile.skills.join(", ")}
              onChange={(event) =>
                patch({
                  skills: event.target.value
                    .split(",")
                    .map((skill) => skill.trim())
                    .filter(Boolean),
                })
              }
            />
          </Field>
        </div>

        <Field label="About">
          <TextArea
            value={profile.about}
            onChange={(event) => patch({ about: event.target.value })}
            placeholder="A few lines on what you are studying and what you are looking for."
          />
        </Field>

        <div className="grid gap-3 sm:grid-cols-3">
          {(["website", "linkedin", "github"] as const).map((key) => (
            <Field key={key} label={key[0].toUpperCase() + key.slice(1)}>
              <TextInput
                value={profile.links[key] ?? ""}
                onChange={(event) =>
                  patch({ links: { ...profile.links, [key]: event.target.value } })
                }
              />
            </Field>
          ))}
        </div>

        <label className="flex items-start gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={profile.isPublic}
            onChange={(event) => patch({ isPublic: event.target.checked })}
            className="mt-0.5 h-4 w-4 rounded border-slate-300 accent-indigo-600"
          />
          <span>
            Make my profile visible to others
            <span className="block text-xs text-slate-500">
              Off by default. While off, only you can see this.
            </span>
          </span>
        </label>

        <div className="flex items-center gap-3 border-t border-slate-100 pt-4">
          <Button onClick={save} disabled={status === "saving"}>
            {status === "saving" ? "Saving…" : "Save profile"}
          </Button>
          {status === "saved" ? (
            <span className="text-xs text-emerald-600">Saved</span>
          ) : status === "error" ? (
            <span className="text-xs text-rose-600">Could not save — try again.</span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
