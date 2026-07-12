"use client";

import { useEffect, useState } from "react";
import type { Me } from "@/lib/types";

export function StreakChip() {
  const [me, setMe] = useState<Me | null>(null);

  useEffect(() => {
    fetch("/api/me")
      .then((r) => r.json())
      .then((d) => {
        if (typeof d.streak === "number") setMe(d as Me);
      })
      .catch(() => {});
  }, []);

  if (!me || me.streak <= 0) return null;

  return (
    <span
      className={`lit flex items-center gap-1.5 rounded-full bg-panel px-3 py-1.5 text-xs font-bold text-bone ${
        me.postedToday ? "" : "opacity-80"
      }`}
      title={me.postedToday ? "Streak locked in for today" : "Post today to keep your streak"}
    >
      {me.streak} day{me.streak === 1 ? "" : "s"}
    </span>
  );
}
