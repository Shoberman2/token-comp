import { type EmailOtpType } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const next = url.searchParams.get("next") || "/profile";
  const redirectTo = new URL(next.startsWith("/") ? next : "/profile", url.origin);
  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    return NextResponse.redirect(new URL("/login?error=supabase-not-configured", url.origin));
  }

  const code = url.searchParams.get("code");
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(redirectTo);
  }

  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;
  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) return NextResponse.redirect(redirectTo);
  }

  return NextResponse.redirect(new URL("/login?error=auth-confirmation-failed", url.origin));
}
