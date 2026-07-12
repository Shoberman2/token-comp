import { NextResponse } from "next/server";
import { getAuthenticatedRequest, isSupabaseConfigured } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Join an organization with its invite code. */
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

  const { data, error } = await supabase.rpc("join_organization", { invite_code: code });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ org: data });
}
