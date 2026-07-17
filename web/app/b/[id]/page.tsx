import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BurnCard } from "@/components/BurnCard";
import { ShareButton } from "@/components/ShareButton";
import { compact } from "@/lib/format";
import { getBurn } from "@/lib/store";

type BurnPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ posted?: string }>;
};

export async function generateMetadata({ params }: BurnPageProps): Promise<Metadata> {
  const { id } = await params;
  const burn = await getBurn(id);
  if (!burn) return { title: "Burn not found — Burnt" };

  const title = `${burn.displayName}'s daily burn — Burnt`;
  const description = `@${burn.handle} burned ${compact(burn.tokens)} AI tokens today${burn.model ? ` with ${burn.model}` : ""}.`;
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      images: [{ url: `/b/${id}/opengraph-image`, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`/b/${id}/opengraph-image`],
    },
  };
}

export default async function BurnPage({ params, searchParams }: BurnPageProps) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const burn = await getBurn(id);
  if (!burn) notFound();

  const shareText = `@${burn.handle} burned ${compact(burn.tokens)} AI tokens today.`;

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-5">
      {query.posted === "1" ? (
        <section className="glass lit flex flex-col gap-3 rounded-card p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-display text-lg font-bold">Your daily burn is live.</p>
            <p className="mt-1 text-sm text-fog">Share it with your people and keep the ritual going.</p>
          </div>
          <ShareButton
            path={`/b/${burn.id}`}
            title={`${burn.displayName}'s daily burn`}
            text={shareText}
            label="Share now"
            className="shrink-0 bg-bone !text-ink hover:opacity-90"
          />
        </section>
      ) : null}

      <header className="flex items-end justify-between gap-4 pt-1">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-dim">Daily burn</p>
          <h1 className="mt-1 font-display text-2xl font-bold">Shared by @{burn.handle}</h1>
        </div>
        <Link href="/feed" className="text-xs font-semibold text-fog underline underline-offset-4">
          See the feed
        </Link>
      </header>

      <BurnCard burn={burn} />

      <section className="glass flex flex-col items-center gap-3 rounded-card px-6 py-8 text-center">
        <p className="font-display text-lg font-bold">Your turn.</p>
        <p className="max-w-sm text-sm leading-6 text-fog">
          Post today&apos;s AI usage, show your friends what you shipped, and keep your streak alive.
        </p>
        <Link href="/post" className="rounded-(--radius-control) bg-bone px-5 py-2.5 text-sm font-bold text-ink">
          Post your burn
        </Link>
      </section>
    </div>
  );
}
