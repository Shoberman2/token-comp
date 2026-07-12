"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Building2, Loader2 } from "lucide-react";

/** Landing page for an organization invite link. */
export function OrgJoinClaim({ code }: { code: string }) {
  const router = useRouter();
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/me")
      .then((r) => r.json())
      .then((d) => setSignedIn(Boolean(d?.handle)))
      .catch(() => setSignedIn(false));
  }, []);

  async function join() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/orgs/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not join.");
      router.push(`/o/${data.org.slug}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not join.");
      setBusy(false);
    }
  }

  return (
    <div className="glass mx-auto mt-6 flex w-full max-w-md flex-col items-center gap-4 rounded-card px-6 py-12 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-full border border-line text-fog">
        <Building2 size={20} />
      </span>
      <div>
        <h1 className="font-display text-xl font-bold">Join an organization</h1>
        <p className="mt-1 text-sm text-fog">
          You&apos;ve been invited to an organization on Burnt.
        </p>
      </div>

      {signedIn === null ? (
        <Loader2 size={18} className="animate-spin text-fog" />
      ) : signedIn ? (
        <button
          type="button"
          disabled={busy}
          onClick={join}
          className="inline-flex items-center gap-2 rounded-(--radius-control) bg-bone px-5 py-2.5 text-sm font-bold text-ink transition hover:opacity-90 disabled:opacity-40"
        >
          {busy ? <Loader2 size={14} className="animate-spin" /> : null} Accept invite
        </button>
      ) : (
        <Link
          href={`/login?next=${encodeURIComponent(`/orgs/join/${code}`)}`}
          className="rounded-(--radius-control) bg-bone px-5 py-2.5 text-sm font-bold text-ink transition hover:opacity-90"
        >
          Sign in to join
        </Link>
      )}

      {error ? <p className="rounded-(--radius-control) bg-bone/10 px-3 py-2 text-sm text-bone">{error}</p> : null}
    </div>
  );
}
