"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { compact, usd, timeAgo, estimateCost } from "@/lib/format";
import { Avatar } from "./Avatar";
import type { Burn } from "@/lib/types";

export function BurnCard({ burn, index = 0 }: { burn: Burn; index?: number }) {
  const cost = burn.cost ?? estimateCost(burn.tokens);
  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ delay: Math.min(index, 6) * 0.04, ease: [0.22, 1, 0.36, 1] }}
      className="glass overflow-hidden rounded-lg"
    >
      <Link href={`/u/${burn.handle}`} className="flex items-center gap-3 px-4 py-3">
        <Avatar name={burn.displayName} handle={burn.handle} src={burn.avatarUrl} size={36} />
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-bone">{burn.displayName}</div>
          <div className="truncate text-xs text-fog">@{burn.handle}</div>
        </div>
        <div className="text-xs text-dim">{timeAgo(burn.createdAt)}</div>
      </Link>

      {/* The screenshot is the hero */}
      <div className="relative overflow-hidden border-y border-line bg-ink">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={burn.imageUrl}
          alt={`${burn.displayName}'s token usage`}
          className="aspect-[4/5] w-full object-cover"
          loading="lazy"
        />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-4">
          <div>
            <div className="font-display text-[36px] font-bold leading-none silver drop-shadow">
              {compact(burn.tokens)}
            </div>
            <div className="mt-1 text-xs text-white/60">tokens · {usd(cost)}</div>
          </div>
          {burn.model ? (
            <span className="max-w-[42%] truncate text-right text-[11px] font-medium text-white/65">
              {burn.model}
            </span>
          ) : null}
        </div>
      </div>

      {burn.caption ? (
        <p className="px-4 py-3 text-sm">
          <span className="font-semibold text-bone">@{burn.handle}</span>{" "}
          <span className="text-fog">{burn.caption}</span>
        </p>
      ) : (
        <div className="h-3" />
      )}
    </motion.article>
  );
}
