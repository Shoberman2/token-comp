"use client";

import { useEffect, useState } from "react";
import { Counter } from "./Counter";

type Stats = { burned: number; posts: number; burners: number };

export function StatsStrip() {
  const [s, setS] = useState<Stats | null>(null);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then(setS)
      .catch(() => {});
  }, []);

  const items: [string, number][] = [
    ["tokens burned", s?.burned ?? 0],
    ["burners", s?.burners ?? 0],
    ["burns posted", s?.posts ?? 0],
  ];

  return (
    <div className="glass grid grid-cols-3 divide-x divide-line rounded-card py-4">
      {items.map(([label, value]) => (
        <div key={label} className="flex flex-col items-center gap-1 px-1">
          <div className="font-display text-[22px] font-bold leading-none tabular">
            <Counter className="silver" value={value} />
          </div>
          <div className="text-[10px] uppercase tracking-[0.14em] text-dim">{label}</div>
        </div>
      ))}
    </div>
  );
}
