"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AdminGuard from "@/components/admin/AdminGuard";
import { getAdminStats, type AdminStats } from "@/lib/api/admin";

export default function AdminOverviewPage() {
  return (
    <AdminGuard>
      <Overview />
    </AdminGuard>
  );
}

function Overview() {
  const [stats, setStats] = useState<AdminStats | null>(null);

  useEffect(() => {
    getAdminStats().then(setStats);
  }, []);

  const cards = [
    { label: "Live openings", value: stats?.jobsActive, href: "/admin/jobs" },
    { label: "Jobs total", value: stats?.jobsTotal, href: "/admin/jobs" },
    { label: "Study material", value: stats?.materials, href: "/admin/study" },
    { label: "Categories", value: stats?.categories, href: "/study" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="rounded-xl border border-slate-200 bg-white p-4 transition hover:border-slate-300"
          >
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              {card.label}
            </p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900">
              {card.value ?? "—"}
            </p>
          </Link>
        ))}
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-slate-900">Common tasks</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link
            href="/admin/jobs?new=1"
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            + Post a job
          </Link>
          <Link
            href="/admin/study?new=1"
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            + Upload study material
          </Link>
        </div>
        <p className="mt-4 text-xs leading-relaxed text-slate-500">
          The automated feed runs once a day and writes jobs with{" "}
          <code className="rounded bg-slate-100 px-1">source = adzuna</code>. Anything you post
          here is <code className="rounded bg-slate-100 px-1">source = manual</code> and is never
          overwritten by it.
        </p>
      </section>
    </div>
  );
}
