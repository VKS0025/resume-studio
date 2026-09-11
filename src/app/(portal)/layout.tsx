import Link from "next/link";
import PortalNav from "@/components/shell/PortalNav";

/**
 * Chrome for every page except the resume editor, which is a full-screen tool
 * and lives outside this route group on purpose.
 */
export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <PortalNav />
      <main className="flex-1">{children}</main>
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-8 text-xs text-slate-500">
          <span>CareerSetu — jobs, study material and resumes for students.</span>
          <span className="flex gap-4">
            <Link href="/jobs" className="hover:text-slate-800">Jobs</Link>
            <Link href="/study" className="hover:text-slate-800">Study material</Link>
            <Link href="/dashboard" className="hover:text-slate-800">Resume builder</Link>
          </span>
        </div>
      </footer>
    </div>
  );
}
