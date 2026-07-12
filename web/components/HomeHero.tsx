"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { TokenMark } from "./Logo";
import { PageHeader } from "./PageHeader";

/**
 * Renders the landing hero for signed-out visitors, or the regular
 * feed header once a session exists. Resolves auth once via /api/me.
 */
export function HomeHero() {
  const [signedIn, setSignedIn] = useState<boolean | null>(null);

  useEffect(() => {
    let alive = true;
    fetch("/api/me")
      .then((r) => r.json())
      .then((d) => {
        if (alive) setSignedIn(Boolean(d?.handle));
      })
      .catch(() => {
        if (alive) setSignedIn(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  if (signedIn === null) {
    return <div className="h-16" aria-hidden />;
  }

  if (signedIn) {
    return <PageHeader title="Feed" sub="Burns from people you follow" />;
  }

  return (
    <section className="rise flex flex-col items-center gap-6 pb-4 pt-10 text-center md:pt-16">
      <TokenMark size={56} />
      <h1 className="max-w-[17ch] font-display text-[40px] font-bold leading-[1.05] tracking-tight md:text-[52px]">
        How many tokens did you burn today?
      </h1>
      <p className="max-w-md text-[15px] leading-relaxed text-fog">
        The daily leaderboard for AI builders. Post your usage screenshot, keep your streak, and
        out-burn your friends.
      </p>
      <div className="flex items-center gap-3">
        <Link
          href="/login"
          className="rounded-(--radius-control) bg-bone px-5 py-2.5 text-sm font-bold text-ink transition hover:opacity-90 active:scale-[0.98]"
        >
          Start burning
        </Link>
        <Link
          href="/leaderboard"
          className="rounded-(--radius-control) border border-line px-5 py-2.5 text-sm font-semibold text-fog transition hover:border-smoke hover:text-bone"
        >
          See the ranks
        </Link>
      </div>
    </section>
  );
}
