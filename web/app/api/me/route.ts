import { NextResponse } from "next/server";
import { me } from "@/lib/store";
import { getUserById } from "@/lib/social";
import { createServerSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  let handle = new URL(req.url).searchParams.get("handle") || "";

  if (!handle && isSupabaseConfigured()) {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
    if (user?.id) {
      handle = (await getUserById(user.id))?.handle ?? "";
    }
  }

  if (!handle) {
    return NextResponse.json({
      handle: "",
      streak: 0,
      postedToday: false,
      posts: 0,
      totalTokens: 0,
      bestDayTokens: 0,
    });
  }
  return NextResponse.json(await me(handle));
}
