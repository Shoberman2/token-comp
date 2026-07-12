import Link from "next/link";

export default function NotFound() {
  return (
    <div className="glass flex flex-col items-start gap-4 rounded-card p-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-dim">404</p>
        <h1 className="mt-1 font-display text-2xl font-bold">Nothing burning here</h1>
        <p className="mt-1 text-sm text-fog">This page may have moved or the profile no longer exists.</p>
      </div>
      <Link href="/" className="rounded-(--radius-control) bg-bone px-4 py-2.5 text-sm font-bold text-ink">
        Back to the feed
      </Link>
    </div>
  );
}
