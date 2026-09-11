"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { isCurrentUserAdmin } from "@/lib/api/admin";
import { Button } from "@/components/ui/controls";

const TABS = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/jobs", label: "Jobs" },
  { href: "/admin/study", label: "Study material" },
];

/**
 * Chrome and a client-side gate for the admin area.
 *
 * The gate is a courtesy, not the security boundary — every write is checked
 * again by the is_admin() policies in the database, so a user who forced their
 * way past this screen still could not change anything.
 */
export default function AdminGuard({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    isCurrentUserAdmin().then((result) => {
      if (!cancelled) setAllowed(result);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (allowed === null) {
    return <div className="mx-auto max-w-5xl px-6 py-12 text-sm text-slate-500">Checking access…</div>;
  }

  if (!allowed) {
    return (
      <div className="mx-auto max-w-md px-6 py-20 text-center">
        <h1 className="text-xl font-bold text-slate-900">Admins only</h1>
        <p className="mt-2 text-sm text-slate-600">
          This area manages what everyone else sees. If it should be yours, set your role to
          admin in the database and reload.
        </p>
        <div className="mt-5 flex justify-center gap-2">
          <Link href="/login?next=/admin">
            <Button variant="secondary">Sign in</Button>
          </Link>
          <Link href="/">
            <Button>Back to the portal</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <header className="mb-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Admin</h1>
          <Link href="/" className="text-sm font-medium text-slate-500 hover:text-slate-800">
            View the portal →
          </Link>
        </div>
        <nav className="mt-4 flex gap-1 border-b border-slate-200">
          {TABS.map((tab) => {
            const active =
              tab.href === "/admin" ? pathname === "/admin" : pathname.startsWith(tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium transition ${
                  active
                    ? "border-indigo-600 text-indigo-700"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>
      </header>
      {children}
    </div>
  );
}
