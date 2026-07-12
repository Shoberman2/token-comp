"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, UserPlus } from "lucide-react";
import { AuthForm } from "./AuthForm";

/**
 * Friend invite landing: signed-out visitors sign up (mutual follow happens
 * at signup), signed-in users accept with one click.
 */
export function FriendClaim({ code }: { code: string }) {
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [friend, setFriend] = useState<{ handle: string; displayName: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/me")
      .then((r) => r.json())
      .then((d) => setSignedIn(Boolean(d?.handle)))
      .catch(() => setSignedIn(false));
  }, []);

  async function accept() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/friends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not accept the invite.");
      setFriend(data.friend);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not accept the invite.");
    } finally {
      setBusy(false);
    }
  }

  if (signedIn === null) {
    return <div className="mx-auto h-40 w-full max-w-md animate-pulse rounded-card bg-ash" />;
  }

  if (!signedIn) {
    return <AuthForm joinCode={code} next="/profile" />;
  }

  return (
    <div className="glass mx-auto mt-6 flex w-full max-w-md flex-col items-center gap-4 rounded-card px-6 py-12 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-full border border-line text-fog">
        <UserPlus size={20} />
      </span>

      {friend ? (
        <>
          <div>
            <h1 className="font-display text-xl font-bold">You&apos;re connected</h1>
            <p className="mt-1 text-sm text-fog">
              You and <span className="font-semibold text-bone">{friend.displayName}</span> now
              follow each other.
            </p>
          </div>
          <Link
            href={`/u/${friend.handle}`}
            className="rounded-(--radius-control) bg-bone px-5 py-2.5 text-sm font-bold text-ink transition hover:opacity-90"
          >
            View @{friend.handle}
          </Link>
        </>
      ) : (
        <>
          <div>
            <h1 className="font-display text-xl font-bold">Friend invite</h1>
            <p className="mt-1 text-sm text-fog">
              Accept to follow each other and share your daily burns.
            </p>
          </div>
          <button
            type="button"
            disabled={busy}
            onClick={accept}
            className="inline-flex items-center gap-2 rounded-(--radius-control) bg-bone px-5 py-2.5 text-sm font-bold text-ink transition hover:opacity-90 disabled:opacity-40"
          >
            {busy ? <Loader2 size={14} className="animate-spin" /> : null} Accept invite
          </button>
        </>
      )}

      {error ? <p className="rounded-(--radius-control) bg-bone/10 px-3 py-2 text-sm text-bone">{error}</p> : null}
    </div>
  );
}
