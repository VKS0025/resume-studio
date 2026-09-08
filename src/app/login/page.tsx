"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { migrateLocalToCloud } from "@/lib/store";
import { Button, Field, TextInput } from "@/components/ui/controls";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") ?? "/dashboard";
  const reason = params.get("reason");

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(
    reason === "expired" ? "Your session expired. Please sign in again." : null
  );
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const supabase = getSupabaseBrowser();
    if (!supabase) {
      setError("No Supabase project is configured, so accounts are unavailable.");
      return;
    }

    setBusy(true);
    setError(null);
    setMessage(null);

    try {
      if (mode === "signup") {
        const { data, error: signUpError } = await supabase.auth.signUp({ email, password });
        if (signUpError) throw signUpError;
        // With email confirmation on, Supabase returns a user but no session.
        if (!data.session) {
          setMessage("Check your inbox to confirm the address, then sign in.");
          setMode("signin");
          return;
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
      }

      const moved = await migrateLocalToCloud();
      if (moved > 0) {
        setMessage(`Moved ${moved} local resume${moved === 1 ? "" : "s"} into your account.`);
      }
      router.push(next);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <Link href="/" className="text-sm font-medium text-slate-500 hover:text-slate-800">
          ← Resume Studio
        </Link>

        <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-900">
          {mode === "signin" ? "Sign in" : "Create an account"}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Your resumes sync across devices. You can also skip this and work locally.
        </p>

        {!isSupabaseConfigured ? (
          <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            No Supabase project is configured yet. Add <code>NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
            <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to <code>.env.local</code> to turn on
            accounts. Everything else works without it.
          </p>
        ) : null}

        <form onSubmit={submit} className="mt-6 space-y-3">
          <Field label="Email">
            <TextInput
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </Field>
          <Field label="Password" hint="At least 6 characters.">
            <TextInput
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
            />
          </Field>

          {error ? (
            <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">{error}</p>
          ) : null}
          {message ? (
            <p className="rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-700">{message}</p>
          ) : null}

          <Button type="submit" className="w-full" disabled={busy || !isSupabaseConfigured}>
            {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
          </Button>
        </form>

        <button
          type="button"
          onClick={() => {
            setMode(mode === "signin" ? "signup" : "signin");
            setError(null);
          }}
          className="mt-4 w-full text-center text-sm text-slate-500 hover:text-slate-800"
        >
          {mode === "signin"
            ? "No account yet? Create one"
            : "Already have an account? Sign in"}
        </button>

        <Link
          href="/editor/new"
          className="mt-6 block text-center text-sm font-medium text-indigo-600 hover:text-indigo-700"
        >
          Skip — build a resume without an account →
        </Link>
      </div>
    </div>
  );
}
