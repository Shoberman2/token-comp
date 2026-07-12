import { NextResponse } from "next/server";
import { setFollowByUserId } from "@/lib/social";
import { getAuthenticatedRequest, isSupabaseConfigured } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 501 });
  }

  const { supabase, user } = await getAuthenticatedRequest(req);

  if (!supabase || !user) {
    return NextResponse.json({ error: "Sign in before following people." }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const following = String(body.following || "").trim();
  const on = body.on !== false;
  if (!following) {
    return NextResponse.json({ error: "following required" }, { status: 400 });
  }

  await setFollowByUserId(user.id, following, on, supabase);
  return NextResponse.json({ ok: true, following: on });
}
