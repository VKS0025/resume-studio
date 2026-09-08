import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * Keeps the Supabase session cookie fresh on every navigation.
 *
 * It deliberately does *not* gate /dashboard or /editor behind a login: the
 * app is designed to work signed out, storing resumes in localStorage, and
 * only moves them into an account when someone actually signs in. Redirecting
 * anonymous visitors here would break that path entirely.
 */
export async function proxy(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const response = NextResponse.next({ request });
  if (!url || !anonKey) return response;

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  try {
    // Calling getUser() is what triggers the refresh-token round trip.
    await supabase.auth.getUser();
  } catch {
    // An unreachable Supabase project must not take the whole page down.
  }

  return response;
}

export const config = {
  matcher: ["/dashboard/:path*", "/editor/:path*", "/login"],
};
