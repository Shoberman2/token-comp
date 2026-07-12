import { NextResponse } from "next/server";
import { getAuthenticatedRequest, isSupabaseConfigured } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Owner: change org visibility (public/private). */
export async function PATCH(req: Request, ctx: { params: Promise<{ slug: string }> }) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 501 });
  }

  const { slug } = await ctx.params;
  const { supabase, user } = await getAuthenticatedRequest(req);
  if (!supabase || !user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const visibility = body.visibility === "private" ? "private" : "public";

  const { data, error } = await supabase
    .from("organizations")
    .update({ visibility })
    .eq("slug", slug)
    .select("slug, visibility")
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  if (!data) {
    return NextResponse.json({ error: "Only the owner can change visibility." }, { status: 403 });
  }
  return NextResponse.json({ org: data });
}

/** Member: leave the organization. */
export async function DELETE(req: Request, ctx: { params: Promise<{ slug: string }> }) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 501 });
  }

  const { slug } = await ctx.params;
  const { supabase, user } = await getAuthenticatedRequest(req);
  if (!supabase || !user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });

  const { data: org } = await supabase
    .from("organizations")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  if (!org) return NextResponse.json({ error: "Organization not found." }, { status: 404 });

  const { error } = await supabase
    .from("organization_members")
    .delete()
    .eq("org_id", org.id)
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
