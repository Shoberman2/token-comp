"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Flame } from "lucide-react";

type Nudge = { handle: string; displayName: string };

/** Shows on the home feed when friends nudged you to post today. */
export function NudgeBanner() {
  const [nudges, setNudges] = useState<Nudge[]>([]);

  useEffect(() => {
    let alive = true;
    fetch("/api/nudges")
      .then((r) => r.json())
      .then((d) => {
        if (alive && Array.isArray(d?.nudges)) setNudges(d.nudges);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  if (nudges.length === 0) return null;

  const first = nudges[0].displayName;
  const label =
    nudges.length === 1
      ? `${first} nudged you to post today's usage.`
      : `${first} and ${nudges.length - 1} other${nudges.length > 2 ? "s" : ""} nudged you to post today.`;

  return (
    <div className="glass rise flex items-center justify-between gap-3 rounded-card px-4 py-3">
      <div className="flex min-w-0 items-center gap-2.5 text-sm">
        <Flame size={16} className="shrink-0 text-fog" />
        <span className="truncate text-fog">
          <span className="font-semibold text-bone">{label}</span>
        </span>
      </div>
      <Link
        href="/post"
        className="shrink-0 rounded-(--radius-control) bg-bone px-3.5 py-1.5 text-sm font-bold text-ink transition hover:opacity-90"
      >
        Post now
      </Link>
    </div>
  );
}
