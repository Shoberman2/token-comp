"use client";

import { useState } from "react";
import { Flame } from "lucide-react";

/** Poke a friend who hasn't posted today. One nudge per friend per day. */
export function NudgeButton({ handle }: { handle: string }) {
  const [state, setState] = useState<"idle" | "busy" | "sent" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function nudge() {
    if (state === "busy" || state === "sent") return;
    setState("busy");
    try {
      const res = await fetch("/api/nudges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ handle }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not nudge.");
      setState("sent");
      setMessage(data.already ? "Already nudged today" : "Nudged");
    } catch (e) {
      setState("error");
      setMessage(e instanceof Error ? e.message : "Could not nudge.");
    }
  }

  return (
    <button
      type="button"
      onClick={nudge}
      disabled={state === "busy" || state === "sent"}
      className="inline-flex items-center gap-1.5 rounded-(--radius-control) border border-line px-3.5 py-2 text-sm font-semibold text-fog transition hover:border-smoke hover:text-bone disabled:opacity-60"
      title="Nudge them to post today's usage"
    >
      <Flame size={14} />
      {state === "sent" || state === "error" ? message : "Nudge"}
    </button>
  );
}
