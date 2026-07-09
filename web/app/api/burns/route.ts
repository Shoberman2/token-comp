import { NextResponse } from "next/server";
import { createBurn, listBurns } from "@/lib/store";
import { saveImage } from "@/lib/storage";
import { createServerSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const burns = await listBurns(100);
  return NextResponse.json({ burns });
}

export async function POST(req: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase is not configured. Add the Supabase env vars before users can post." },
      { status: 501 }
    );
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error: userError,
  } = supabase ? await supabase.auth.getUser() : { data: { user: null }, error: null };

  if (userError || !user) {
    return NextResponse.json({ error: "Sign in before posting a burn." }, { status: 401 });
  }

  const contentType = req.headers.get("content-type") || "";
  if (!contentType.includes("multipart/form-data")) {
    return NextResponse.json(
      { error: "Send multipart/form-data with an image and tokens." },
      { status: 415 }
    );
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Could not parse form data." }, { status: 400 });
  }

  const image = form.get("image");
  const tokens = Number(form.get("tokens"));

  if (!Number.isFinite(tokens) || tokens <= 0) {
    return NextResponse.json({ error: "Enter how many tokens you burned." }, { status: 400 });
  }
  if (!(image instanceof File) || image.size === 0) {
    return NextResponse.json({ error: "Attach a screenshot of your usage." }, { status: 400 });
  }
  if (image.size > 12 * 1024 * 1024) {
    return NextResponse.json({ error: "Image is too large (max 12MB)." }, { status: 413 });
  }

  const imageUrl = await saveImage(image);
  const costRaw = form.get("cost");
  const burn = await createBurn({
    userId: user.id,
    tokens,
    cost: costRaw != null && costRaw !== "" ? Number(costRaw) : undefined,
    model: String(form.get("model") || "").trim() || undefined,
    imageUrl,
    caption: String(form.get("caption") || "").trim() || undefined,
  });

  return NextResponse.json({ burn }, { status: 201 });
}
