import Link from "next/link";
import { TokenMark } from "./Logo";

export function HomeHero() {
  return (
    <section className="rise flex flex-col items-center gap-6 pb-4 pt-10 text-center md:pt-16">
      <TokenMark size={56} />
      <h1 className="max-w-[17ch] font-display text-[40px] font-bold leading-[1.05] tracking-tight md:text-[52px]">
        BeReal for your daily AI tokens.
      </h1>
      <p className="max-w-md text-[15px] leading-relaxed text-fog">
        Post your usage screenshot, keep your streak, follow friends, and see who burns the most.
      </p>
      <div className="flex items-center gap-3">
        <Link
          href="/login"
          className="rounded-(--radius-control) bg-bone px-5 py-2.5 text-sm font-bold text-ink transition hover:opacity-90 active:scale-[0.98]"
        >
          Start burning
        </Link>
        <Link
          href="/feed"
          className="rounded-(--radius-control) border border-line px-5 py-2.5 text-sm font-semibold text-fog transition hover:border-smoke hover:text-bone"
        >
          Browse the feed
        </Link>
      </div>
    </section>
  );
}
