"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Job, StudyCategory } from "@/lib/portal";
import { listJobs } from "@/lib/api/jobs";
import { listCategories } from "@/lib/api/study";
import JobCard from "@/components/jobs/JobCard";
import { Button, TextInput } from "@/components/ui/controls";

const MODULES = [
  {
    href: "/jobs",
    title: "Jobs & notifications",
    body: "Government notifications, private openings and internships, filtered the way you actually search.",
  },
  {
    href: "/alerts",
    title: "Job alerts",
    body: "Say what you want once. Get told the moment a matching opening is posted.",
  },
  {
    href: "/study",
    title: "Study material",
    body: "Notes, syllabi and previous years' papers, sorted by the exam you are preparing for.",
  },
  {
    href: "/dashboard",
    title: "Resume builder",
    body: "Seven templates, live preview, and a PDF, PNG or JPEG download in one click.",
  },
];

export default function HomePage() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [latest, setLatest] = useState<Job[]>([]);
  const [categories, setCategories] = useState<StudyCategory[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [jobs, cats] = await Promise.all([
        listJobs({ perPage: 4 }),
        listCategories(),
      ]);
      if (cancelled) return;
      setLatest(jobs.jobs);
      setCategories(cats.slice(0, 6));
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div>
      <section className="mx-auto max-w-3xl px-6 pb-10 pt-14 text-center sm:pt-20">
        <span className="inline-block rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
          Free for students · no watermark · nothing to install
        </span>
        <h1 className="mt-5 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
          Every job, every notification,
          <br className="hidden sm:block" /> one place.
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-slate-600">
          Search government and private openings, get alerted the day they are posted, study from
          organised material, and build the resume you apply with — without leaving the site.
        </p>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            router.push(q.trim() ? `/jobs?q=${encodeURIComponent(q.trim())}` : "/jobs");
          }}
          className="mx-auto mt-8 flex max-w-lg gap-2"
        >
          <div className="flex-1">
            <TextInput
              value={q}
              onChange={(event) => setQ(event.target.value)}
              placeholder="Try “SSC CGL”, “data analyst”, “internship”"
              aria-label="Search jobs"
            />
          </div>
          <Button type="submit">Search jobs</Button>
        </form>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {MODULES.map((module) => (
            <Link
              key={module.href}
              href={module.href}
              className="group rounded-2xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
            >
              <h2 className="text-sm font-semibold text-slate-900">{module.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{module.body}</p>
              <span className="mt-3 inline-block text-xs font-medium text-indigo-600 opacity-0 transition group-hover:opacity-100">
                Open →
              </span>
            </Link>
          ))}
        </div>
      </section>

      {latest.length > 0 ? (
        <section className="mx-auto max-w-6xl px-6 py-8">
          <div className="mb-4 flex items-end justify-between gap-3">
            <h2 className="text-lg font-bold tracking-tight text-slate-900">Latest openings</h2>
            <Link href="/jobs" className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
              See all →
            </Link>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2">
            {latest.map((job) => (
              <li key={job.id}>
                <JobCard job={job} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {categories.length > 0 ? (
        <section className="mx-auto max-w-6xl px-6 py-8 pb-14">
          <div className="mb-4 flex items-end justify-between gap-3">
            <h2 className="text-lg font-bold tracking-tight text-slate-900">Study by exam</h2>
            <Link href="/study" className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
              See all →
            </Link>
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/study/${category.slug}`}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
              >
                {category.name}
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
