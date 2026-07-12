import { NextResponse } from "next/server";
import { friendsFeed } from "@/lib/store";
import { getUserById } from "@/lib/social";
import { getAuthenticatedRequest, isSupabaseConfigured } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  let handle = new URL(req.url).searchParams.get("handle") || "";

  if (!handle && isSupabaseConfigured()) {
    const { supabase, user } = await getAuthenticatedRequest(req);
    if (user?.id) {
      handle = (await getUserById(user.id, supabase))?.handle ?? "";
    }
  }

  const { burns, discover } = await friendsFeed(handle);
  return NextResponse.json({ burns, discover });
}
