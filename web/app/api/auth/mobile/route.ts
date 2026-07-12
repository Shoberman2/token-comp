import { NextResponse } from "next/server";
import { normalizeHandle } from "@/lib/social";
import {
  createPublicSupabaseClient,
  isSupabaseConfigured,
} from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AuthAction = "sign-in" | "sign-up" | "refresh";

function sessionPayload(session: {
  access_token: string;
  refresh_token: string;
  expires_at?: number;
} | null) {
  if (!session) return null;
  return {
    accessToken: session.access_token,
    refreshToken: session.refresh_token,
    expiresAt: session.expires_at ?? null,
  };
}

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Accounts are not configured." }, { status: 501 });
  }

  const supabase = createPublicSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: "Accounts are not configured." }, { status: 501 });
  }

  const body = await request.json().catch(() => ({}));
  const action = String(body.action || "") as AuthAction;

  try {
    if (action === "refresh") {
      const refreshToken = String(body.refreshToken || "");
      if (!refreshToken) {
        return NextResponse.json({ error: "A refresh token is required." }, { status: 400 });
      }

      const { data, error } = await supabase.auth.refreshSession({
        refresh_token: refreshToken,
      });
      if (error) throw error;
      return NextResponse.json({ session: sessionPayload(data.session) });
    }

    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    if (!email || password.length < 6) {
      return NextResponse.json(
        { error: "Enter a valid email and a password with at least 6 characters." },
        { status: 400 }
      );
    }

    if (action === "sign-in") {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      return NextResponse.json({ session: sessionPayload(data.session) });
    }

    if (action === "sign-up") {
      const handle = normalizeHandle(String(body.handle || ""));
      const displayName = String(body.displayName || "").trim().slice(0, 80);
      if (handle.length < 3) {
        return NextResponse.json(
          { error: "Choose a handle with at least 3 characters." },
          { status: 400 }
        );
      }

      const origin = new URL(request.url).origin;
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${origin}/auth/confirm?next=/profile`,
          data: {
            handle,
            display_name: displayName || handle,
            company: String(body.company || "").trim().slice(0, 120) || undefined,
            join_code: String(body.joinCode || "").trim() || undefined,
          },
        },
      });
      if (error) throw error;

      return NextResponse.json({
        session: sessionPayload(data.session),
        requiresEmailConfirmation: !data.session,
      });
    }

    return NextResponse.json({ error: "Unsupported authentication action." }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not authenticate.";
    const friendly = message.includes("Database error")
      ? "Could not create the profile. The handle may already be taken."
      : message;
    return NextResponse.json({ error: friendly }, { status: 400 });
  }
}
