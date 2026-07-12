import { NextResponse } from "next/server";
import { normalizeHandle } from "@/lib/social";
import { getAuthenticatedRequest, isSupabaseConfigured } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function todayUTC() {
  return new Date().toISOString().slice(0, 10);
}

/** Today's nudges for the signed-in user, with sender names. */
export async function GET(req: Request) {
  if (!isSupabaseConfigured()) return NextResponse.json({ nudges: [] });

  const { supabase, user } = await getAuthenticatedRequest(req);
  if (!supabase || !user) return NextResponse.json({ nudges: [] });

  const { data, error } = await supabase
    .from("nudges")
    .select("from_id, created_at")
    .eq("to_id", user.id)
    .eq("day", todayUTC())
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const senderIds = [...new Set((data ?? []).map((n) => n.from_id))];
  let senders: { id: string; handle: string; display_name: string }[] = [];
  if (senderIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, handle, display_name")
      .in("id", senderIds);
    senders = profiles ?? [];
  }

  return NextResponse.json({
    nudges: senders.map((s) => ({ handle: s.handle, displayName: s.display_name })),
  });
}

/** Nudge someone you follow to post today's usage. */
export async function POST(req: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 501 });
  }

  const { supabase, user } = await getAuthenticatedRequest(req);
  if (!supabase || !user) {
    return NextResponse.json({ error: "Sign in to nudge friends." }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const handle = normalizeHandle(String(body.handle || ""));
  if (!handle) return NextResponse.json({ error: "handle required" }, { status: 400 });

  const { data: target } = await supabase
    .from("profiles")
    .select("id")
    .eq("handle", handle)
    .maybeSingle();

  if (!target) return NextResponse.json({ error: "No such user." }, { status: 404 });

  const { error } = await supabase.from("nudges").insert({ from_id: user.id, to_id: target.id });

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ ok: true, already: true });
    }
    if (error.code === "42501") {
      return NextResponse.json({ error: "You can only nudge people you follow." }, { status: 403 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
