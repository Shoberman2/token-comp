import { Leaderboard } from "@/components/Leaderboard";
import { StatsStrip } from "@/components/StatsStrip";
import { PageHeader } from "@/components/PageHeader";

export const metadata = {
  title: "Leaderboard — Burnt",
};

export default function LeaderboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Leaderboard" sub="Ranked by verified token usage posts" />
      <StatsStrip />
      <Leaderboard />
    </div>
  );
}
