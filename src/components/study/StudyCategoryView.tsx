"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { MaterialKind, StudyCategory, StudyMaterial } from "@/lib/portal";
import { MATERIAL_LABELS, formatFileSize, timeAgo } from "@/lib/portal";
import { getCategory, listMaterials, resolveDownloadUrl } from "@/lib/api/study";
import { Button, TextInput } from "@/components/ui/controls";

export default function StudyCategoryView({ slug }: { slug: string }) {
  const [category, setCategory] = useState<StudyCategory | null | "missing">(null);
  const [materials, setMaterials] = useState<StudyMaterial[] | null>(null);
  const [q, setQ] = useState("");
  const [kind, setKind] = useState<MaterialKind | "">("");
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const found = await getCategory(slug);
      if (cancelled) return;
      setCategory(found ?? "missing");
      if (found) setMaterials(await listMaterials({ categoryId: found.id }));
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  useEffect(() => {
    if (!category || category === "missing") return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      const rows = await listMaterials({ categoryId: category.id, q, kind });
      if (!cancelled) setMaterials(rows);
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [q, kind, category]);

  async function download(material: StudyMaterial) {
    setBusyId(material.id);
    const url = await resolveDownloadUrl(material);
    setBusyId(null);
    if (url) window.open(url, "_blank", "noopener,noreferrer");
  }

  if (category === null) {
    return <div className="mx-auto max-w-4xl px-6 py-12 text-sm text-slate-500">Loading…</div>;
  }

  if (category === "missing") {
    return (
      <div className="mx-auto max-w-md px-6 py-20 text-center">
        <h1 className="text-lg font-semibold text-slate-900">No such category</h1>
        <Link href="/study" className="mt-4 inline-block text-sm font-medium text-indigo-600">
          ← All study material
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <Link href="/study" className="text-sm font-medium text-slate-500 hover:text-slate-800">
        ← All study material
      </Link>

      <header className="mt-4">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">{category.name}</h1>
        <p className="mt-1 text-sm text-slate-600">{category.description}</p>
      </header>

      <div className="mt-5 flex flex-wrap gap-2">
        <div className="min-w-[200px] flex-1">
          <TextInput
            value={q}
            onChange={(event) => setQ(event.target.value)}
            placeholder="Search notes, papers, subjects"
            aria-label="Search study material"
          />
        </div>
        <select
          value={kind}
          onChange={(event) => setKind(event.target.value as MaterialKind | "")}
          aria-label="Material type"
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
        >
          <option value="">All types</option>
          {(Object.keys(MATERIAL_LABELS) as MaterialKind[]).map((value) => (
            <option key={value} value={value}>
              {MATERIAL_LABELS[value]}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-5">
        {materials === null ? (
          <p className="text-sm text-slate-500">Loading…</p>
        ) : materials.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 px-6 py-14 text-center">
            <p className="text-base font-semibold text-slate-800">Nothing here yet</p>
            <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
              {q || kind
                ? "No material matches that search."
                : "Material for this category has not been uploaded yet."}
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {materials.map((material) => (
              <li
                key={material.id}
                className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-4"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-[11px] font-medium text-indigo-700">
                      {MATERIAL_LABELS[material.kind]}
                    </span>
                    <h2 className="text-sm font-semibold text-slate-900">{material.title}</h2>
                  </div>
                  {material.description ? (
                    <p className="mt-1 text-sm text-slate-600">{material.description}</p>
                  ) : null}
                  <p className="mt-1 text-[11px] text-slate-400">
                    {[
                      material.exam || null,
                      material.subject || null,
                      material.year ? String(material.year) : null,
                      formatFileSize(material.fileSize) || null,
                      material.downloads > 0 ? `${material.downloads} downloads` : null,
                      timeAgo(material.createdAt),
                    ]
                      .filter(Boolean)
                      .join("  ·  ")}
                  </p>
                </div>
                <Button
                  variant="secondary"
                  disabled={busyId === material.id}
                  onClick={() => download(material)}
                >
                  {busyId === material.id
                    ? "Opening…"
                    : material.externalUrl
                      ? "Open ↗"
                      : "Download"}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
