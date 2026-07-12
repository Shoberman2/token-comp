"use client";

import { motion } from "motion/react";
import { RANGES, type Range } from "@/lib/types";

export function RangeTabs({
  value,
  onChange,
}: {
  value: Range;
  onChange: (r: Range) => void;
}) {
  return (
    <div className="glass flex rounded-(--radius-card) p-1">
      {RANGES.map((r) => {
        const active = r.key === value;
        return (
          <button
            key={r.key}
            onClick={() => onChange(r.key)}
            className={`relative flex-1 rounded-[12px] px-2 py-2 text-center text-[13px] font-semibold transition-colors ${
              active ? "text-ink" : "text-fog hover:text-bone"
            }`}
          >
            {active && (
              <motion.span
                layoutId="range-pill"
                className="absolute inset-0 rounded-[12px] bg-bone"
                transition={{ type: "spring", stiffness: 380, damping: 32 }}
              />
            )}
            <span className="relative z-10">{r.label}</span>
          </button>
        );
      })}
    </div>
  );
}
