"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { countUnread } from "@/lib/api/notifications";
import { isCurrentUserAdmin } from "@/lib/api/admin";

const LINKS = [
  { href: "/jobs", label: "Jobs" },
  { href: "/study", label: "Study material" },
  { href: "/dashboard", label: "Resume" },
  { href: "/alerts", label: "Alerts" },
];

export default function PortalNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [unread, setUnread] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // Every setState here runs inside a promise callback rather than the effect
  // body: the header is subscribing to an external system (the auth session),
  // which is exactly what effects are for.
  useEffect(() => {
    const supabase = getSupabaseBrowser();
    if (!supabase) return;
    let cancelled = false;

    const load = () => {
      supabase.auth.getUser().then(async ({ data }) => {
        if (cancelled) return;
        setEmail(data.user?.email ?? null);
        const [count, admin] = data.user
          ? await Promise.all([countUnread(), isCurrentUserAdmin()])
          : [0, false];
        if (cancelled) return;
        setUnread(count);
        setIsAdmin(admin);
      });
    };

    load();
    // Sign-in and sign-out happen on other pages; the header has to hear about
    // them rather than waiting for a hard reload. Re-running on pathname also
    // settles the badge after someone leaves /notifications.
    const { data } = supabase.auth.onAuthStateChange(load);
    return () => {
      cancelled = true;
      data.subscription.unsubscribe();
    };
  }, [pathname]);

  async function signOut() {
    await getSupabaseBrowser()?.auth.signOut();
    setMenuOpen(false);
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/85 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-3 sm:px-6">
        <Link href="/" className="mr-2 shrink-0 text-base font-bold tracking-tight text-slate-900">
          Career<span className="text-indigo-600">Setu</span>
        </Link>

        <div className="hidden items-center gap-0.5 md:flex">
          {LINKS.map((link) => {
            const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                  active
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        <div className="ml-auto flex items-center gap-1.5">
          {email ? (
            <>
              <Link
                href="/notifications"
                aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}
                className="relative rounded-lg px-2.5 py-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
              >
                <BellIcon />
                {unread > 0 ? (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                    {unread > 9 ? "9+" : unread}
                  </span>
                ) : null}
              </Link>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setMenuOpen((open) => !open)}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white"
                  aria-label="Account menu"
                  aria-expanded={menuOpen}
                >
                  {email.slice(0, 2).toUpperCase()}
                </button>
                {menuOpen ? (
                  <div className="absolute right-0 top-11 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
                    <p className="truncate border-b border-slate-100 px-3 py-2.5 text-xs text-slate-500">
                      {email}
                    </p>
                    <Link href="/profile" onClick={() => setMenuOpen(false)}
                      className="block px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
                      My profile
                    </Link>
                    <Link href="/saved" onClick={() => setMenuOpen(false)}
                      className="block px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
                      Saved jobs
                    </Link>
                    <Link href="/dashboard" onClick={() => setMenuOpen(false)}
                      className="block px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
                      My resumes
                    </Link>
                    {isAdmin ? (
                      <Link href="/admin" onClick={() => setMenuOpen(false)}
                        className="block border-t border-slate-100 px-3 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-50">
                        Admin panel
                      </Link>
                    ) : null}
                    <button
                      type="button"
                      onClick={signOut}
                      className="w-full border-t border-slate-100 px-3 py-2 text-left text-sm text-rose-600 hover:bg-rose-50"
                    >
                      Sign out
                    </button>
                  </div>
                ) : null}
              </div>
            </>
          ) : (
            <Link
              href="/login"
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              {isSupabaseConfigured ? "Sign in" : "Get started"}
            </Link>
          )}
        </div>
      </nav>

      {/* The links matter more than the logo on a phone, so they get their own row. */}
      <div className="thin-scroll flex gap-0.5 overflow-x-auto border-t border-slate-100 px-3 py-1.5 md:hidden">
        {LINKS.map((link) => {
          const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium ${
                active ? "bg-indigo-50 text-indigo-700" : "text-slate-600"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </div>
    </header>
  );
}

function BellIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  );
}
