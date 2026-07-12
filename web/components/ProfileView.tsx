"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Copy, ExternalLink, Trophy } from "lucide-react";
import { Avatar } from "./Avatar";
import { FollowButton } from "./FollowButton";
import { NudgeButton } from "./NudgeButton";
import { Counter } from "./Counter";
import { compact } from "@/lib/format";
import type { Profile } from "@/lib/types";

export function ProfileView({ handle }: { handle?: string }) {
  const [data, setData] = useState<{ profile: Profile; isFollowing: boolean; isSelf: boolean } | null>(null);
  const [missing, setMissing] = useState(false);
  const [copied, setCopied] = useState(false);

  const target = handle ?? "";

  const load = useCallback(() => {
    if (!target) return;
    fetch(`/api/profile?handle=${encodeURIComponent(target)}`)
      .then(async (res) => {
        if (res.status === 404) {
          setMissing(true);
          return null;
        }
        if (!res.ok) throw new Error("Could not load profile.");
        return res.json();
      })
      .then((next) => {
        if (next) setData(next);
      })
      .catch(() => {});
  }, [target]);

  useEffect(() => {
    load();
  }, [load]);

  async function copyProfile() {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  }

  if (!target) {
    return (
      <div className="glass rounded-card p-5">
        <Link href="/login?next=/profile" className="font-semibold text-bone underline underline-offset-4">
          Sign in to view your profile
        </Link>
      </div>
    );
  }

  if (missing) {
    return <div className="glass rounded-card p-5 text-sm text-fog">Profile not found.</div>;
  }

  if (!data) return <div className="h-64 animate-pulse rounded-card bg-ash" />;

  const p = data.profile;

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-4 pt-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <Avatar name={p.displayName} handle={p.handle} src={p.avatarUrl} size={84} />
          <div className="min-w-0 pt-1">
            <h1 className="truncate font-display text-2xl font-bold">{p.displayName}</h1>
            <div className="truncate text-sm text-fog">@{p.handle}</div>
            {p.company ? <div className="mt-1 truncate text-sm text-fog">{p.company}</div> : null}
            {p.website ? (
              <a
                href={p.website}
                target="_blank"
                rel="noreferrer"
                className="mt-1 inline-flex items-center gap-1 text-sm text-bone underline underline-offset-4"
              >
                Website <ExternalLink size={13} />
              </a>
            ) : null}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {data.isSelf ? (
            <Link href="/profile" className="rounded-(--radius-control) bg-bone px-4 py-2 text-sm font-bold text-ink">
              Edit profile
            </Link>
          ) : (
            <>
              <FollowButton handle={p.handle} initialFollowing={data.isFollowing} onChange={load} />
              {data.isFollowing && !p.postedToday ? <NudgeButton handle={p.handle} /> : null}
            </>
          )}
          <button
            type="button"
            onClick={copyProfile}
            className="grid h-9 w-9 place-items-center rounded-(--radius-control) border border-line text-fog"
            aria-label="Copy profile link"
          >
            <Copy size={15} />
          </button>
        </div>
      </section>

      {p.bio ? <p className="text-sm leading-6 text-fog">{p.bio}</p> : null}
      {copied ? <div className="text-xs text-fog">Profile link copied.</div> : null}

      {p.rank ? (
        <div className="glass inline-flex w-fit items-center gap-1.5 rounded-(--radius-control) px-3 py-1.5 text-xs font-semibold text-bone">
          <Trophy size={13} /> #{p.rank} all-time
        </div>
      ) : null}

      <div className="glass grid grid-cols-2 divide-x divide-y divide-line rounded-card py-4 sm:grid-cols-4 sm:divide-y-0">
        <Stat label="streak" value={p.streak} />
        <Stat label="burned" value={p.totalTokens} />
        <Stat label="burns" value={p.posts} />
        <Stat label="best day" value={p.bestDayTokens} />
      </div>

      <div className="flex justify-center gap-8 text-center">
        <div>
          <div className="font-display text-lg font-bold">{p.followers}</div>
          <div className="text-xs text-dim">followers</div>
        </div>
        <div>
          <div className="font-display text-lg font-bold">{p.following}</div>
          <div className="text-xs text-dim">following</div>
        </div>
      </div>

      <div>
        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-dim">
          {p.posts > 0 ? "Burns" : "No burns yet"}
        </div>
        {p.burns.length === 0 ? (
          <div className="glass rounded-card px-6 py-12 text-center text-sm text-fog">
            {data.isSelf ? (
              <Link href="/post" className="font-semibold text-bone underline underline-offset-4">
                Post your first burn
              </Link>
            ) : (
              "Nothing posted yet."
            )}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {p.burns.map((b) => (
              <Link key={b.id} href={`/b/${b.id}`} className="relative aspect-square overflow-hidden rounded-[10px] lit">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={b.imageUrl} alt="" className="h-full w-full object-cover" />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent px-2 py-1.5">
                  <div className="font-display text-sm font-bold silver">{compact(b.tokens)}</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col items-center gap-0.5 px-1 py-2">
      <div className="font-display text-lg font-bold">
        <Counter value={value} />
      </div>
      <div className="text-[10px] uppercase tracking-wide text-dim">{label}</div>
    </div>
  );
}
