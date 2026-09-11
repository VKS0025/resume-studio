import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/server/supabaseAdmin";
import { isEmailConfigured, sendJobDigest } from "@/lib/server/email";

/**
 * Sends one sample digest so email delivery can be proved without waiting for
 * a real job match:
 *
 *   curl -H "Authorization: Bearer $INGEST_SECRET" \
 *        "https://<host>/api/ingest/test-email?to=you@example.com"
 */
export async function GET(request: NextRequest) {
  const secret = process.env.INGEST_SECRET ?? process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "Set INGEST_SECRET before using this endpoint." },
      { status: 503 }
    );
  }
  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!isEmailConfigured()) {
    return NextResponse.json(
      { error: "RESEND_API_KEY is not set, so no email can be sent." },
      { status: 503 }
    );
  }

  const to = request.nextUrl.searchParams.get("to");
  if (!to) {
    return NextResponse.json({ error: "Pass ?to=<address>" }, { status: 400 });
  }

  // Only ever send to somebody who already has an account. Otherwise a leaked
  // secret would turn this into a relay for sending mail to strangers.
  const admin = getSupabaseAdmin();
  if (!admin) {
    return NextResponse.json(
      { error: "SUPABASE_SERVICE_ROLE_KEY is not set." },
      { status: 503 }
    );
  }
  const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  const known = data.users.some(
    (user) => user.email?.toLowerCase() === to.toLowerCase()
  );
  if (!known) {
    return NextResponse.json(
      { error: "That address has no account here, so nothing was sent." },
      { status: 400 }
    );
  }

  const result = await sendJobDigest({
    to,
    alertLabel: "Test alert",
    jobs: [
      {
        id: "00000000-0000-0000-0000-000000000000",
        title: "Sample opening — this is a test",
        company: "CareerSetu",
        location: "All India",
      },
    ],
  });

  return NextResponse.json(result, { status: result.ok ? 200 : 502 });
}
