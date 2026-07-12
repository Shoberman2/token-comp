"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { createClient, isBrowserSupabaseConfigured } from "@/lib/supabase/client";

export function ResetPasswordForm() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const configured = isBrowserSupabaseConfigured();
  const canSubmit = configured && password.length >= 6 && password === confirm && !busy;

  async function submit() {
    if (!canSubmit) return;
    setBusy(true);
    setError(null);
    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      setDone(true);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not update your password.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-5">
      <div>
        <h1 className="font-display text-2xl font-bold">Choose a new password</h1>
        <p className="mt-1 text-sm text-fog">Use at least 6 characters.</p>
      </div>

      {done ? (
        <div className="glass flex flex-col gap-4 rounded-card p-5">
          <p className="text-sm text-fog">Your password has been updated.</p>
          <Link href="/profile" className="inline-flex w-fit rounded-(--radius-control) bg-bone px-4 py-2.5 text-sm font-bold text-ink">
            Continue to your profile
          </Link>
        </div>
      ) : (
        <div className="glass flex flex-col gap-3 rounded-card p-5">
          <PasswordField label="New password" value={password} onChange={setPassword} />
          <PasswordField label="Confirm password" value={confirm} onChange={setConfirm} />
          {confirm && password !== confirm ? (
            <p className="text-sm text-fog">Passwords do not match.</p>
          ) : null}
          {error ? <p className="rounded-(--radius-control) bg-bone/10 px-3 py-2 text-sm">{error}</p> : null}
          <button
            type="button"
            disabled={!canSubmit}
            onClick={submit}
            className="inline-flex items-center justify-center gap-2 rounded-(--radius-control) bg-bone px-4 py-3 text-sm font-bold text-ink disabled:opacity-40"
          >
            {busy ? <Loader2 size={16} className="animate-spin" /> : null}
            Save new password
          </button>
        </div>
      )}
    </div>
  );
}

function PasswordField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold uppercase tracking-wide text-dim">{label}</span>
      <input
        type="password"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        autoComplete="new-password"
        className="lit w-full rounded-(--radius-control) bg-ink/70 px-3 py-3 text-sm outline-none"
      />
    </label>
  );
}
