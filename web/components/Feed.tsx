"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { UserPlus } from "lucide-react";
import { BurnCard } from "./BurnCard";
import { Avatar } from "./Avatar";
import { FollowButton } from "./FollowButton";
import { compact } from "@/lib/format";
import type { Burn, Suggestion } from "@/lib/types";

export function Feed() {
  const [burns, setBurns] = useState<Burn[] | null>(null);
  const [discover, setDiscover] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);

  useEffect(() => {
    fetch("/api/feed")
      .then((r) => r.json())
      .then((d) => {
        setBurns(d.burns as Burn[]);
        setDiscover(!!d.discover);
      })
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
          <div key={i} className="h-[420px] animate-pulse rounded-lg bg-ash" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {discover && (
        <div className="glass rounded-lg px-4 py-3 text-sm text-fog">
          <span className="font-semibold text-bone">Public feed.</span> Sign in and follow people to tailor it.
        </div>
      )}

      {suggestions.length > 0 && <DiscoverRail suggestions={suggestions} />}

      {burns.length === 0 ? (
        <div className="glass flex flex-col items-center gap-3 rounded-lg px-6 py-12 text-center">
          <p className="text-sm text-fog">No burns yet. Be the first.</p>
          <Link href="/post" className="font-display text-sm font-bold text-bone underline underline-offset-4">
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
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 px-1 text-xs font-semibold uppercase tracking-wide text-dim">
        <UserPlus size={13} /> People to follow
      </div>
      <div className="hide-scroll -mx-4 flex gap-3 overflow-x-auto px-4 pb-1">
        {suggestions.map((s) => (
          <div
            key={s.handle}
            className="glass flex w-40 shrink-0 flex-col items-center gap-2 rounded-lg p-4 text-center"
          >
            <Link href={`/u/${s.handle}`} className="flex flex-col items-center gap-2">
              <Avatar name={s.displayName} handle={s.handle} src={s.imageUrl} size={48} />
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
