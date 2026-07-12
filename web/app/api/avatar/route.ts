import { NextResponse } from "next/server";
import { getAuthenticatedRequest, isSupabaseConfigured } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_TYPES = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/gif", "gif"],
]);

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Accounts are not configured." }, { status: 501 });
  }

  const { supabase, user } = await getAuthenticatedRequest(request);
  if (!supabase || !user) {
    return NextResponse.json({ error: "Sign in before uploading an avatar." }, { status: 401 });
  }

  const form = await request.formData().catch(() => null);
  const image = form?.get("image");
  if (!(image instanceof File) || image.size === 0) {
    return NextResponse.json({ error: "Choose an image to upload." }, { status: 400 });
  }
  if (image.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "Avatar is too large (max 5MB)." }, { status: 413 });
  }

  const ext = ALLOWED_TYPES.get(image.type);
  if (!ext) {
    return NextResponse.json(
      { error: "Use a JPG, PNG, WebP, or GIF image." },
      { status: 415 }
    );
  }

  const path = `${user.id}/avatar.${ext}`;
  const { data, error } = await supabase.storage.from("avatars").upload(path, image, {
    cacheControl: "3600",
    contentType: image.type,
    upsert: true,
  });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const { data: publicData } = supabase.storage.from("avatars").getPublicUrl(data.path);
  return NextResponse.json({ avatarUrl: `${publicData.publicUrl}?v=${Date.now()}` });
}
