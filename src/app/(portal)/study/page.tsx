"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { StudyCategory, StudyMaterial } from "@/lib/portal";
import { MATERIAL_LABELS, timeAgo } from "@/lib/portal";
import { countByCategory, listCategories, listMaterials } from "@/lib/api/study";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export default function StudyIndexPage() {
  const [categories, setCategories] = useState<StudyCategory[] | null>(null);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [recent, setRecent] = useState<StudyMaterial[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [cats, byCategory, latest] = await Promise.all([
        listCategories(),
        countByCategory(),
        listMaterials({ limit: 6 }),
      ]);
      if (cancelled) return;
      setCategories(cats);
      setCounts(byCategory);
      setRecent(latest);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <header className="mb-7">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Study material</h1>
        <p className="mt-1 text-sm text-slate-600">
          Notes, syllabi and previous years&apos; papers, sorted by what you are preparing for.
        </p>
      </header>

      {categories === null ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((key) => (
            <div key={key} className="h-28 animate-pulse rounded-xl bg-white" />
          ))}
        </div>
      ) : categories.length === 0 ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-6 py-12 text-center">
          <p className="font-semibold text-amber-900">
            {isSupabaseConfigured ? "No categories yet" : "The library needs a database"}
          </p>
          <p className="mx-auto mt-1 max-w-md text-sm text-amber-800">
            {isSupabaseConfigured
              ? "Run supabase/migrations/0002_portal.sql — it seeds the starter categories."
              : "Add your Supabase keys to .env.local, then run the migrations."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/study/${category.slug}`}
              className="group rounded-xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-2">
                <h2 className="text-base font-semibold text-slate-900">{category.name}</h2>
                <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                  {counts[category.id] ?? 0}
                </span>
              </div>
              <p className="mt-1.5 text-sm leading-snug text-slate-600">{category.description}</p>
              <span className="mt-3 inline-block text-xs font-medium text-indigo-600 opacity-0 transition group-hover:opacity-100">
                Open →
              </span>
            </Link>
          ))}
        </div>
      )}

      {recent.length > 0 ? (
        <section className="mt-10">
          <h2 className="mb-3 text-sm font-semibold text-slate-900">Recently added</h2>
          <ul className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 bg-white">
            {recent.map((material) => (
              <li key={material.id} className="flex items-center gap-3 px-4 py-3">
                <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                  {MATERIAL_LABELS[material.kind]}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm text-slate-800">
                  {material.title}
                </span>
                <span className="shrink-0 text-[11px] text-slate-400">
                  {timeAgo(material.createdAt)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
