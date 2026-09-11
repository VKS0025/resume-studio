"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { MaterialKind, StudyCategory, StudyMaterial } from "@/lib/portal";
import { MATERIAL_LABELS, formatFileSize, timeAgo } from "@/lib/portal";
import { listCategories, listMaterials } from "@/lib/api/study";
import { BLANK_MATERIAL, deleteMaterial, saveMaterial, type MaterialDraft } from "@/lib/api/admin";
import AdminGuard from "@/components/admin/AdminGuard";
import { Button, Field, TextArea, TextInput } from "@/components/ui/controls";

export default function AdminStudyPage() {
  return (
    <AdminGuard>
      <Suspense fallback={<p className="text-sm text-slate-500">Loading…</p>}>
        <StudyAdmin />
      </Suspense>
    </AdminGuard>
  );
}

function StudyAdmin() {
  const params = useSearchParams();
  const fileRef = useRef<HTMLInputElement>(null);
  const [categories, setCategories] = useState<StudyCategory[]>([]);
  const [materials, setMaterials] = useState<StudyMaterial[] | null>(null);
  const [draft, setDraft] = useState<MaterialDraft | null>(
    params.get("new") ? { ...BLANK_MATERIAL } : null
  );
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setMaterials(await listMaterials({ limit: 200 }));
  }, []);

  useEffect(() => {
    listCategories().then(setCategories);
    listMaterials({ limit: 200 }).then(setMaterials);
  }, []);

  const set = (changes: Partial<MaterialDraft>) =>
    setDraft((current) => (current ? { ...current, ...changes } : current));

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!draft) return;
    setSaving(true);
    setError(null);

    const slug = categories.find((c) => c.id === draft.categoryId)?.slug ?? "misc";
    const result = await saveMaterial(draft, file, slug);
    setSaving(false);
    if (!result.ok) {
      setError(result.error ?? "Could not save.");
      return;
    }
    setFlash("Uploaded — it is live in the library now.");
    setDraft(null);
    setFile(null);
    if (fileRef.current) fileRef.current.value = "";
    refresh();
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-slate-600">
          {materials ? `${materials.length} item${materials.length === 1 ? "" : "s"}` : "Loading…"}
        </p>
        <Button onClick={() => { setDraft({ ...BLANK_MATERIAL }); setFlash(null); }}>
          + Add material
        </Button>
      </div>

      {flash ? (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-700">{flash}</p>
      ) : null}

      {draft ? (
        <form onSubmit={submit} className="rounded-xl border border-indigo-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-slate-900">New study material</h2>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Field label="Title *">
              <TextInput value={draft.title} onChange={(e) => set({ title: e.target.value })} />
            </Field>
            <Field label="Category">
              <select
                value={draft.categoryId}
                onChange={(e) => set({ categoryId: e.target.value })}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
              >
                <option value="">Uncategorised</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </Field>
            <Field label="Type">
              <select
                value={draft.kind}
                onChange={(e) => set({ kind: e.target.value as MaterialKind })}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
              >
                {(Object.keys(MATERIAL_LABELS) as MaterialKind[]).map((k) => (
                  <option key={k} value={k}>{MATERIAL_LABELS[k]}</option>
                ))}
              </select>
            </Field>
            <Field label="Exam">
              <TextInput value={draft.exam} onChange={(e) => set({ exam: e.target.value })} placeholder="SSC CGL" />
            </Field>
            <Field label="Subject">
              <TextInput value={draft.subject} onChange={(e) => set({ subject: e.target.value })} placeholder="Quantitative Aptitude" />
            </Field>
            <Field label="Year">
              <TextInput value={draft.year} onChange={(e) => set({ year: e.target.value })} placeholder="2025" />
            </Field>
          </div>

          <div className="mt-3">
            <Field label="Description">
              <TextArea value={draft.description} onChange={(e) => set({ description: e.target.value })} />
            </Field>
          </div>

          <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50/60 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Attach a file, or link to one
            </p>
            <input
              ref={fileRef}
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,.ppt,.pptx,.txt,.zip"
              className="mt-2 block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-600 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-indigo-700"
            />
            {file ? (
              <p className="mt-1.5 text-xs text-slate-500">
                {file.name} · {formatFileSize(file.size)}
              </p>
            ) : null}
            <p className="mt-3 text-xs text-slate-400">or</p>
            <div className="mt-1">
              <TextInput
                value={draft.externalUrl}
                onChange={(e) => set({ externalUrl: e.target.value })}
                placeholder="https://ssc.gov.in/notification.pdf"
                aria-label="External link"
              />
            </div>
            <p className="mt-2 text-[11px] leading-relaxed text-slate-400">
              Uploads go to a private bucket and are served through short-lived signed links.
              Only upload material you have the right to share.
            </p>
          </div>

          {error ? (
            <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">{error}</p>
          ) : null}

          <div className="mt-4 flex gap-2 border-t border-slate-100 pt-4">
            <Button type="submit" disabled={saving}>
              {saving ? "Uploading…" : "Add material"}
            </Button>
            <Button type="button" variant="secondary" onClick={() => { setDraft(null); setError(null); }}>
              Cancel
            </Button>
          </div>
        </form>
      ) : null}

      {materials && materials.length > 0 ? (
        <ul className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 bg-white">
          {materials.map((material) => (
            <li key={material.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
              <span className="shrink-0 rounded-md bg-indigo-50 px-2 py-0.5 text-[11px] font-medium text-indigo-700">
                {MATERIAL_LABELS[material.kind]}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-900">{material.title}</p>
                <p className="truncate text-xs text-slate-500">
                  {[
                    material.exam || null,
                    material.subject || null,
                    material.externalUrl ? "link" : "uploaded file",
                    formatFileSize(material.fileSize) || null,
                    timeAgo(material.createdAt),
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>
              <Button
                variant="danger"
                onClick={async () => {
                  if (!confirm(`Delete "${material.title}"? The file is removed too.`)) return;
                  await deleteMaterial(material);
                  refresh();
                }}
              >
                Delete
              </Button>
            </li>
          ))}
        </ul>
      ) : materials ? (
        <p className="rounded-xl border border-dashed border-slate-300 bg-white/60 px-4 py-10 text-center text-sm text-slate-500">
          Nothing in the library yet.
        </p>
      ) : null}
    </div>
  );
}
