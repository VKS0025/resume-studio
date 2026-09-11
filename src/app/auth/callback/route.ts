import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Where every email link lands: confirmation, magic link, password reset.
 *
 * @supabase/ssr pins the auth flow to PKCE, so Supabase sends the user back
 * with a `code` that only the server can trade for a session. Without this
 * route the link simply drops the user on a page that ignores the code, which
 * looks exactly like "the link doesn't work".
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  // Only ever redirect within this site — an open redirect here would let a
  // crafted link bounce a freshly-authenticated user off to another origin.
  const requested = searchParams.get("next") ?? "/dashboard";
  const next = requested.startsWith("/") && !requested.startsWith("//")
    ? requested
    : "/dashboard";

  // Supabase reports a rejected link (expired, already used) on the query
  // string rather than by omitting the code.
  const errorDescription = searchParams.get("error_description");
  if (errorDescription) {
    return NextResponse.redirect(
      `${siteOrigin(request, origin)}/login?reason=${encodeURIComponent(errorDescription)}`
    );
  }

  if (!code) {
    return NextResponse.redirect(`${siteOrigin(request, origin)}/login?reason=link_invalid`);
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return NextResponse.redirect(`${siteOrigin(request, origin)}/login?reason=not_configured`);
  }

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(`${siteOrigin(request, origin)}/login?reason=link_expired`);
  }

  return NextResponse.redirect(`${siteOrigin(request, origin)}${next}`);
}

/**
 * Behind Vercel's proxy `request.url` carries the internal host, so redirecting
 * to it would send the user somewhere that is not the site they came from.
 */
function siteOrigin(request: NextRequest, fallback: string): string {
  const forwardedHost = request.headers.get("x-forwarded-host");
  if (!forwardedHost) return fallback;
  const proto = request.headers.get("x-forwarded-proto") ?? "https";
  return `${proto}://${forwardedHost}`;
}
