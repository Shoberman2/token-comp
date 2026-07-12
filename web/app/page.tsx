import { Feed } from "@/components/Feed";
import { HomeHero } from "@/components/HomeHero";
import { NudgeBanner } from "@/components/NudgeBanner";

export default function Home() {
  return (
    <div className="flex flex-col gap-6">
      <HomeHero />
      <NudgeBanner />
      <Feed />
    </div>
  );
}
