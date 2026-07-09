"use client";

import { useState } from "react";
import { Check, Plus } from "lucide-react";

export function FollowButton({
  handle,
  initialFollowing = false,
  size = "md",
  onChange,
}: {
  handle: string;
  initialFollowing?: boolean;
  size?: "sm" | "md";
  onChange?: (following: boolean) => void;
}) {
  const [following, setFollowing] = useState(initialFollowing);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    const next = !following;
    setFollowing(next);
    setBusy(true);
    try {
      const res = await fetch("/api/follow", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ following: handle, on: next }),
      });
      if (res.status === 401) {
        window.location.href = `/login?next=${encodeURIComponent(`/u/${handle}`)}`;
        return;
      }
      if (!res.ok) throw new Error("Could not update follow.");
      onChange?.(next);
    } catch {
      setFollowing(!next);
    } finally {
      setBusy(false);
    }
  }

  const pad = size === "sm" ? "px-3 py-1 text-xs" : "px-4 py-1.5 text-sm";

  return (
    <button
      onClick={toggle}
      disabled={busy}
      className={`inline-flex items-center gap-1 rounded-lg font-semibold transition ${pad} ${
        following ? "glass text-fog" : "bg-bone text-ink"
      }`}
    >
      {following ? (
        <>
          <Check size={size === "sm" ? 12 : 14} /> Following
        </>
      ) : (
        <>
          <Plus size={size === "sm" ? 12 : 14} strokeWidth={2.6} /> Follow
        </>
      )}
    </button>
  );
}
