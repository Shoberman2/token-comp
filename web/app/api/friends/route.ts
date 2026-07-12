import { NextResponse } from "next/server";
import { getAuthenticatedRequest, isSupabaseConfigured } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Claim a friend invite link while signed in: creates a mutual follow. */
export async function POST(req: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 501 });
  }

  const { supabase, user } = await getAuthenticatedRequest(req);
  if (!supabase || !user) {
    return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const code = String(body.code || "").trim();
  if (!code) return NextResponse.json({ error: "Invite code required." }, { status: 400 });

  const { data, error } = await supabase.rpc("befriend_with_code", { invite_code: code });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({
    friend: data ? { handle: data.handle, displayName: data.display_name } : null,
  });
}
