"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { createClient, isBrowserSupabaseConfigured } from "@/lib/supabase/client";

function cleanHandle(value: string) {
  return value.replace(/^@+/, "").replace(/[^a-zA-Z0-9_]/g, "").toLowerCase().slice(0, 24);
}

export function AuthForm({
  joinCode,
  next = "/profile",
}: {
  joinCode?: string;
  next?: string;
}) {
  const [mode, setMode] = useState<"sign-up" | "sign-in">("sign-up");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [handle, setHandle] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [company, setCompany] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const configured = isBrowserSupabaseConfigured();
  const isSignUp = mode === "sign-up";
  const canSubmit = configured && email.trim() && password.length >= 6 && (!isSignUp || handle.length >= 3) && !busy;
  const title = isSignUp ? "Create your account" : "Sign in";
  const cleanedNext = useMemo(() => (next.startsWith("/") ? next : "/profile"), [next]);

  async function submit() {
    if (!canSubmit) return;
    setBusy(true);
    setError(null);
    setNotice(null);

    try {
      const supabase = createClient();

      if (isSignUp) {
        const origin = window.location.origin;
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: `${origin}/auth/confirm?next=${encodeURIComponent(cleanedNext)}`,
            data: {
              handle,
              display_name: displayName.trim() || handle,
              company: company.trim() || undefined,
              join_code: joinCode || undefined,
            },
          },
        });

        if (signUpError) throw signUpError;

        if (data.session) {
          window.location.href = cleanedNext;
          return;
        }

        setNotice("Check your email to finish creating the account.");
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (signInError) throw signInError;
        window.location.href = cleanedNext;
        return;
      }
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Could not continue.";
      setError(message.includes("Database error") ? "Could not create the profile. The handle may already be taken." : message);
    } finally {
      setBusy(false);
    }
  }

  if (!configured) {
    return (
      <div className="glass mx-auto flex max-w-md flex-col gap-3 rounded-lg p-5 text-sm text-fog">
        <h1 className="font-display text-2xl font-bold text-bone">Supabase setup needed</h1>
        <p>Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` to enable real accounts.</p>
        <p>Then apply the migration in `supabase/migrations` to create profiles, storage, follows, and model tracking.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-5">
      <div>
        <h1 className="font-display text-2xl font-bold">{title}</h1>
        <p className="mt-1 text-sm text-fog">
          {isSignUp ? "Use a real account so your profile and best-token day stay yours." : "Welcome back."}
        </p>
      </div>

      {joinCode ? (
        <div className="glass rounded-lg px-4 py-3 text-sm text-fog">
          You are joining from invite code <span className="font-mono text-bone">{joinCode}</span>.
        </div>
      ) : null}

      <div className="glass flex flex-col gap-3 rounded-lg p-4">
        <Field label="Email">
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            className="lit w-full rounded-lg bg-ink/70 px-3 py-3 text-sm outline-none"
          />
        </Field>

        <Field label="Password">
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete={isSignUp ? "new-password" : "current-password"}
            className="lit w-full rounded-lg bg-ink/70 px-3 py-3 text-sm outline-none"
          />
        </Field>

        {isSignUp ? (
          <>
            <Field label="Handle">
              <div className="lit flex items-center rounded-lg bg-ink/70 px-3 py-3">
                <span className="text-fog">@</span>
                <input
                  value={handle}
                  onChange={(event) => setHandle(cleanHandle(event.target.value))}
                  autoComplete="username"
                  className="w-full bg-transparent text-sm outline-none placeholder:text-smoke"
                  placeholder="your_handle"
                />
              </div>
            </Field>

            <Field label="Display name">
              <input
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                autoComplete="name"
                className="lit w-full rounded-lg bg-ink/70 px-3 py-3 text-sm outline-none"
              />
            </Field>

            <Field label="Company">
              <input
                value={company}
                onChange={(event) => setCompany(event.target.value)}
                autoComplete="organization"
                className="lit w-full rounded-lg bg-ink/70 px-3 py-3 text-sm outline-none"
              />
            </Field>
          </>
        ) : null}

        {error ? <p className="rounded-lg bg-white/10 px-3 py-2 text-sm text-bone">{error}</p> : null}
        {notice ? <p className="rounded-lg bg-white/10 px-3 py-2 text-sm text-bone">{notice}</p> : null}

        <button
          type="button"
          disabled={!canSubmit}
          onClick={submit}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-bone px-4 py-3 text-sm font-bold text-ink transition active:scale-[0.99] disabled:opacity-40"
        >
          {busy ? <Loader2 size={16} className="animate-spin" /> : null}
          {isSignUp ? "Create account" : "Sign in"}
        </button>
      </div>

      <button
        type="button"
        onClick={() => {
          setMode(isSignUp ? "sign-in" : "sign-up");
          setError(null);
          setNotice(null);
        }}
        className="text-left text-sm font-semibold text-bone underline underline-offset-4"
      >
        {isSignUp ? "Already have an account? Sign in" : "Need an account? Create one"}
      </button>

      <Link href="/" className="text-sm text-fog underline underline-offset-4">
        Back to feed
      </Link>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold uppercase tracking-wide text-dim">{label}</span>
      {children}
    </label>
  );
}
