import { NextResponse } from "next/server";
import { profile } from "@/lib/store";
import {
  getUserById,
  isFollowingUserId,
  normalizeHandle,
  updateProfileForUser,
} from "@/lib/social";
import {
  getAuthenticatedRequest,
  isSupabaseConfigured,
  type ServerSupabaseClient,
} from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  let handle = normalizeHandle(url.searchParams.get("handle") || "");
  let viewerId: string | null = null;
  let requestClient: ServerSupabaseClient | null = null;

  if (isSupabaseConfigured()) {
    const { supabase, user } = await getAuthenticatedRequest(req);
    requestClient = supabase;
    viewerId = user?.id ?? null;

    if (!handle && user?.id) {
      const self = await getUserById(user.id, supabase);
      handle = self?.handle ?? "";
    }
  }

  if (!handle) {
    return NextResponse.json({ profile: null, isFollowing: false, isSelf: false, requiresAuth: true });
  }

  const p = await profile(handle);
  if (!p.id && p.posts === 0) return NextResponse.json({ error: "Profile not found." }, { status: 404 });

  const following = viewerId
    ? await isFollowingUserId(viewerId, handle, requestClient)
    : false;
  return NextResponse.json({ profile: p, isFollowing: following, isSelf: viewerId === p.id });
}

export async function PATCH(req: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase is not configured. Add the Supabase env vars before editing profiles." },
      { status: 501 }
    );
  }

  const { supabase, user } = await getAuthenticatedRequest(req);

  if (!supabase || !user) {
    return NextResponse.json({ error: "Sign in before editing your profile." }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const handle = normalizeHandle(String(body.handle || ""));
  const displayName = String(body.displayName || "").trim();

  if (handle.length < 3) {
    return NextResponse.json({ error: "Handle must be at least 3 characters." }, { status: 400 });
  }

  if (!displayName) {
    return NextResponse.json({ error: "Display name is required." }, { status: 400 });
  }

  try {
    const userProfile = await updateProfileForUser(
      user.id,
      {
        handle,
        displayName,
        company: String(body.company || ""),
        avatarUrl: String(body.avatarUrl || ""),
        bio: String(body.bio || ""),
        website: String(body.website || ""),
        defaultModel: String(body.defaultModel || ""),
      },
      supabase
    );
    return NextResponse.json({ profile: userProfile });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not save profile.";
    const conflict = message.includes("duplicate") || message.includes("profiles_handle");
    return NextResponse.json({ error: conflict ? "That handle is already taken." : message }, { status: conflict ? 409 : 400 });
  }
}
