"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { Flame } from "lucide-react";
import { RangeTabs } from "./RangeTabs";
import { Counter } from "./Counter";
import { Avatar } from "./Avatar";
import { timeAgo } from "@/lib/format";
import type { Range, RankEntry } from "@/lib/types";

export function Leaderboard() {
  const [range, setRange] = useState<Range>("day");
  const [entriesByRange, setEntriesByRange] = useState<Partial<Record<Range, RankEntry[]>>>({});
  const entries = entriesByRange[range] ?? null;

  useEffect(() => {
    let alive = true;
    fetch(`/api/leaderboard?range=${range}`)
      .then((r) => r.json())
      .then((d) => {
        if (!alive) return;
        setEntriesByRange((current) => ({ ...current, [range]: d.entries as RankEntry[] }));
      })
      .catch(() => {
        if (!alive) return;
        setEntriesByRange((current) => ({ ...current, [range]: [] }));
      });
    return () => {
      alive = false;
    };
  }, [range]);

  const top3 = entries?.slice(0, 3) ?? [];
  const rest = entries?.slice(3) ?? [];
  const leaderTotal = entries?.[0]?.totalTokens ?? 1;

  return (
    <section className="flex flex-col gap-5">
      <RangeTabs value={range} onChange={setRange} />

      {entries === null ? (
        <LoadingState />
      ) : entries.length === 0 ? (
        <EmptyState />
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={range}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="flex flex-col gap-3"
          >
            <Podium top3={top3} />
            <ol className="flex flex-col gap-2">
              {rest.map((e, i) => (
                <Row key={e.handle} e={e} pct={(e.totalTokens / leaderTotal) * 100} delay={i * 0.03} />
              ))}
            </ol>
          </motion.div>
        </AnimatePresence>
      )}
    </section>
  );
}

function StreakBadge({ n, className }: { n: number; className?: string }) {
  if (n <= 0) return null;
  return (
    <span className={`inline-flex items-center gap-1 text-fog ${className ?? ""}`}>
      <Flame size={12} />
      <span className="tabular font-semibold">{n}</span>
    </span>
  );
}

function RankBadge({ rank }: { rank: number }) {
  const top = rank === 1;
  return (
    <span
      className={`grid h-7 w-7 place-items-center rounded-full font-display text-sm font-bold ${
        top ? "bg-bone text-ink" : "bg-ash text-bone lit"
      }`}
    >
      {rank}
    </span>
  );
}

function Podium({ top3 }: { top3: RankEntry[] }) {
  const order = [top3[1], top3[0], top3[2]].filter(Boolean);
  const heights = new Map<string, string>([
    [top3[0]?.handle ?? "", "h-60"],
    [top3[1]?.handle ?? "", "h-52"],
    [top3[2]?.handle ?? "", "h-48"],
  ]);

  return (
    <div className="grid grid-cols-3 items-end gap-2.5">
      {order.map((e, i) => (
        <motion.div
          key={e.handle}
          initial={{ opacity: 0, y: 22, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.05 + i * 0.08, type: "spring", stiffness: 260, damping: 22 }}
        >
          <div
            className={`card-hover relative w-full overflow-hidden rounded-card lit ${heights.get(e.handle) ?? "h-48"}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={e.imageUrl}
              alt={`${e.displayName}'s usage`}
              className="absolute inset-0 h-full w-full object-cover opacity-90"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/70 to-ink/10" />
            <div className="absolute left-2.5 top-2.5">
              <RankBadge rank={e.rank} />
            </div>
            <Link href={`/u/${e.handle}`} className="absolute inset-x-0 bottom-0 flex flex-col items-start gap-0.5 p-3">
              <div className="flex items-center gap-1.5">
                <Avatar name={e.displayName} handle={e.handle} src={e.avatar} size={20} />
                <span className="truncate text-[13px] font-semibold text-bone">{e.displayName}</span>
              </div>
              <div className="truncate text-[11px] text-fog">@{e.handle}</div>
              <div className="mt-0.5 font-display text-xl font-bold">
                <Counter className="silver" value={e.totalTokens} />
              </div>
              <StreakBadge n={e.streak} className="text-[11px]" />
            </Link>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function Row({ e, pct, delay }: { e: RankEntry; pct: number; delay: number }) {
  return (
    <motion.li
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay }}
      className="glass card-hover relative overflow-hidden rounded-card"
    >
      <div
        className="absolute inset-y-0 left-0 bg-bone/[0.05]"
        style={{ width: `${Math.max(6, pct)}%` }}
      />
      <Link href={`/u/${e.handle}`} className="relative flex items-center gap-3 p-2.5">
        <div className="w-5 text-center font-display text-sm font-bold text-dim tabular">{e.rank}</div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={e.imageUrl}
          alt=""
          className="h-12 w-10 shrink-0 rounded-[10px] object-cover lit"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <Avatar name={e.displayName} handle={e.handle} src={e.avatar} size={18} />
            <span className="truncate text-sm font-semibold text-bone">{e.displayName}</span>
          </div>
          <div className="flex items-center gap-2 truncate text-xs text-fog">
            <span className="truncate">@{e.handle}</span>
            <StreakBadge n={e.streak} className="text-[11px]" />
          </div>
        </div>
        <div className="pr-1 text-right">
          <div className="font-display text-base font-bold">
            <Counter className="silver" value={e.totalTokens} />
          </div>
          <div className="text-[10px] text-dim">
            {e.posts > 1 ? `${e.posts} burns · ` : ""}
            {timeAgo(e.lastBurnAt)}
          </div>
        </div>
      </Link>
    </motion.li>
  );
}

function LoadingState() {
  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-3 items-end gap-2.5">
        <div className="h-52 animate-pulse rounded-card bg-ash" />
        <div className="h-60 animate-pulse rounded-card bg-ash" />
        <div className="h-48 animate-pulse rounded-card bg-ash" />
      </div>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-[68px] animate-pulse rounded-card bg-ash" />
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="glass flex flex-col items-center gap-3 rounded-card px-6 py-16 text-center">
      <p className="text-sm text-fog">Nobody&apos;s posted a burn in this window yet.</p>
      <Link href="/post" className="font-display text-sm font-bold text-bone underline underline-offset-4">
        Be the first
      </Link>
    </div>
  );
}
