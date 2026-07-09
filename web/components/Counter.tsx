"use client";

import { useEffect, useRef } from "react";
import { animate, useInView } from "motion/react";
import { compact, withCommas } from "@/lib/format";

export function Counter({
  value,
  format = "compact",
  className,
  duration = 1.1,
}: {
  value: number;
  format?: "compact" | "full";
  className?: string;
  duration?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const fmt = format === "full" ? withCommas : compact;

  useEffect(() => {
    if (!inView) return;
    const node = ref.current;
    if (!node) return;
    const controls = animate(0, value, {
      duration,
      ease: [0.22, 1, 0.36, 1],
      onUpdate(v) {
        node.textContent = fmt(v);
      },
    });
    return () => controls.stop();
  }, [inView, value, duration]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <span ref={ref} className={`tabular ${className ?? ""}`}>
      {fmt(0)}
    </span>
  );
}
