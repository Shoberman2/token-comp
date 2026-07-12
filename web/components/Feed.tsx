"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { UserPlus } from "lucide-react";
import { BurnCard } from "./BurnCard";
import { Avatar } from "./Avatar";
import { FollowButton } from "./FollowButton";
import { TokenMark } from "./Logo";
import { compact } from "@/lib/format";
import type { Burn, Suggestion } from "@/lib/types";

export function Feed() {
  const [burns, setBurns] = useState<Burn[] | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);

  useEffect(() => {
    fetch("/api/feed")
      .then((r) => r.json())
      .then((d) => setBurns(d.burns as Burn[]))
      .catch(() => setBurns([]));
    fetch("/api/discover")
      .then((r) => r.json())
      .then((d) => setSuggestions((d.suggestions as Suggestion[]).slice(0, 12)))
      .catch(() => {});
  }, []);

  if (burns === null) {
    return (
      <div className="flex flex-col gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-[420px] animate-pulse rounded-card bg-ash" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {suggestions.length > 0 && <DiscoverRail suggestions={suggestions} />}

      {burns.length === 0 ? (
        <div className="glass flex flex-col items-center gap-4 rounded-card px-6 py-16 text-center">
          <TokenMark size={40} className="opacity-60" />
          <div>
            <p className="font-display text-lg font-bold">No burns yet</p>
            <p className="mt-1 text-sm text-fog">Be the first to post today&apos;s usage.</p>
          </div>
          <Link
            href="/post"
            className="rounded-(--radius-control) bg-bone px-4 py-2 text-sm font-bold text-ink transition hover:opacity-90"
          >
            Post a burn
          </Link>
        </div>
      ) : (
        burns.map((b, i) => <BurnCard key={b.id} burn={b} index={i} />)
      )}
    </div>
  );
}

function DiscoverRail({ suggestions }: { suggestions: Suggestion[] }) {
  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center gap-2 px-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-dim">
        <UserPlus size={13} /> People to follow
      </div>
      <div className="hide-scroll -mx-5 flex gap-3 overflow-x-auto px-5 pb-1">
        {suggestions.map((s) => (
          <div
            key={s.handle}
            className="glass card-hover flex w-40 shrink-0 flex-col items-center gap-2 rounded-card p-4 text-center"
          >
            <Link href={`/u/${s.handle}`} className="flex flex-col items-center gap-2">
              <Avatar name={s.displayName} handle={s.handle} src={s.avatarUrl} size={48} />
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-bone">{s.displayName}</div>
                <div className="truncate text-xs text-fog">@{s.handle}</div>
              </div>
            </Link>
            <div className="text-[11px] text-dim">
              {s.posts > 0 ? `${compact(s.totalTokens)} burned` : "new here"}
            </div>
            <FollowButton handle={s.handle} size="sm" />
          </div>
        ))}
      </div>
    </div>
  );
}
