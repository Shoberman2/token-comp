import { NextResponse } from "next/server";
import { normalizeHandle, updateProfileForUser } from "@/lib/social";
import { createServerSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 501 });
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error: userError,
  } = supabase ? await supabase.auth.getUser() : { data: { user: null }, error: null };

  if (userError || !user) {
    return NextResponse.json({ error: "Sign in before editing your profile." }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const handle = normalizeHandle(String(body.handle || ""));
  const displayName = String(body.displayName || "").trim();
  if (!handle) return NextResponse.json({ error: "handle required" }, { status: 400 });
  const profile = await updateProfileForUser(user.id, { handle, displayName: displayName || handle });
  return NextResponse.json({ user: profile });
}
