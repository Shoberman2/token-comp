import { Leaderboard } from "@/components/Leaderboard";
import { StatsStrip } from "@/components/StatsStrip";

export const metadata = {
  title: "Leaderboard — Burnt",
};

export default function LeaderboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <section className="rise flex flex-col gap-1 pt-2">
        <h1 className="font-display text-2xl font-bold">Leaderboard</h1>
        <p className="text-sm text-fog">Ranked by verified token usage posts.</p>
      </section>

      <StatsStrip />

      <Leaderboard />
    </div>
  );
}
