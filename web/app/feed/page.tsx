import { Feed } from "@/components/Feed";
import { NudgeBanner } from "@/components/NudgeBanner";
import { PageHeader } from "@/components/PageHeader";
import { ProductHuntBadge } from "@/components/ProductHuntBadge";

export const metadata = {
  title: "Feed — Burnt",
  description: "See daily AI token usage from the people you follow.",
};

export default function FeedPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Feed" sub="Burns from people you follow" />
      <NudgeBanner />
      <Feed />
      <ProductHuntBadge />
    </div>
  );
}
