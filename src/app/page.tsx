import Link from "next/link";
import TemplateGallery from "@/components/TemplateGallery";

export default function HomePage() {
  return (
    <main>
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <span className="text-base font-bold tracking-tight text-slate-900">
          Resume<span className="text-indigo-600">Studio</span>
        </span>
        <div className="flex items-center gap-2 text-sm">
          <Link
            href="/dashboard"
            className="rounded-lg px-3 py-2 font-medium text-slate-600 hover:bg-white hover:text-slate-900"
          >
            My resumes
          </Link>
          <Link
            href="/editor/new"
            className="rounded-lg bg-slate-900 px-4 py-2 font-medium text-white shadow-sm transition hover:bg-slate-800"
          >
            Build a resume
          </Link>
        </div>
      </nav>

      <section className="mx-auto max-w-3xl px-6 pb-12 pt-12 text-center sm:pt-20">
        <span className="inline-block rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
          Free · no watermark · nothing to install
        </span>
        <h1 className="mt-5 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
          A resume that looks the way you want,
          <br className="hidden sm:block" /> downloaded in one click.
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-slate-600">
          Fill in your details once, then switch between seven layouts, colours and type
          settings live. When it looks right, download it as a{" "}
          <strong className="font-semibold text-slate-800">PDF</strong>,{" "}
          <strong className="font-semibold text-slate-800">PNG</strong> or{" "}
          <strong className="font-semibold text-slate-800">JPEG</strong>.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/editor/new"
            className="rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
          >
            Start building — it takes 5 minutes
          </Link>
          <Link
            href="/dashboard"
            className="rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Open a saved resume
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-10">
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            {
              title: "Edit and see it instantly",
              body: "Every keystroke, colour and spacing change lands on the A4 sheet as you make it. Dashed markers show exactly where page two begins.",
            },
            {
              title: "Three download formats",
              body: "A multi-page A4 PDF for applications, a high-resolution PNG for portfolios, and a JPEG when a file size limit is in the way.",
            },
            {
              title: "Yours, wherever you are",
              body: "Work signed out and it stays in this browser. Sign in and everything you already made moves into your account automatically.",
            },
          ].map((feature) => (
            <div key={feature.title} className="rounded-2xl border border-slate-200 bg-white p-5">
              <h2 className="text-sm font-semibold text-slate-900">{feature.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{feature.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Seven templates, one set of details
          </h2>
          <p className="mx-auto mt-2 max-w-lg text-sm text-slate-600">
            Switch layouts any time — your content never has to be retyped.
          </p>
        </div>
        <TemplateGallery />
      </section>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-8 text-xs text-slate-500">
          <span>Resume Studio — built with Next.js, Tailwind CSS and Supabase.</span>
          <Link href="/editor/new" className="font-medium text-indigo-600 hover:text-indigo-700">
            Build a resume →
          </Link>
        </div>
      </footer>
    </main>
  );
}
