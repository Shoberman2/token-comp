"use client";

import { useEffect } from "react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="glass flex flex-col items-start gap-4 rounded-card p-6">
      <div>
        <h1 className="font-display text-2xl font-bold">That didn’t load</h1>
        <p className="mt-1 text-sm text-fog">The connection may have dropped. Your account and posts are safe.</p>
      </div>
      <button
        type="button"
        onClick={reset}
        className="rounded-(--radius-control) bg-bone px-4 py-2.5 text-sm font-bold text-ink"
      >
        Try again
      </button>
    </div>
  );
}
