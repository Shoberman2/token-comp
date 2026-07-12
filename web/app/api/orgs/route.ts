import { NextResponse } from "next/server";
import { getAuthenticatedRequest, isSupabaseConfigured } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** The signed-in user's organization memberships. */
export async function GET(req: Request) {
  if (!isSupabaseConfigured()) return NextResponse.json({ orgs: [] });

  const { supabase, user } = await getAuthenticatedRequest(req);
  if (!supabase || !user) return NextResponse.json({ orgs: [] });

  const { data, error } = await supabase
    .from("organization_members")
    .select("role, organizations(id, name, slug, visibility, join_code)")
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    orgs: (data ?? [])
      .filter((m) => m.organizations)
      .map((m) => ({
        role: m.role,
        id: m.organizations!.id,
        name: m.organizations!.name,
        slug: m.organizations!.slug,
        visibility: m.organizations!.visibility,
        joinCode: m.organizations!.join_code,
      })),
  });
}

/** Create an organization (creator becomes owner). */
export async function POST(req: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 501 });
  }

  const { supabase, user } = await getAuthenticatedRequest(req);
  if (!supabase || !user) {
    return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const name = String(body.name || "").trim();
  const visibility = body.visibility === "private" ? "private" : "public";
  if (!name) return NextResponse.json({ error: "Organization name is required." }, { status: 400 });

  const { data, error } = await supabase.rpc("create_organization", {
    org_name: name,
    org_visibility: visibility,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ org: data });
}
