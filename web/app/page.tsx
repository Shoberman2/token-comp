import { HomeHero } from "@/components/HomeHero";
import { ProductHuntBadge } from "@/components/ProductHuntBadge";

const features = [
  {
    title: "Post the proof",
    body: "Upload your usage screenshot, choose the model, and share what you shipped.",
  },
  {
    title: "Keep your streak",
    body: "Turn AI usage into a daily ritual and track your best token days.",
  },
  {
    title: "Burn together",
    body: "Follow friends, compare daily burns, and climb the leaderboard.",
  },
];

export default function Home() {
  return (
    <div className="flex flex-col gap-10 pb-4">
      <HomeHero />
      <section className="grid gap-3 md:grid-cols-3" aria-label="Burnt features">
        {features.map((feature) => (
          <div key={feature.title} className="glass rounded-card p-5">
            <h2 className="font-display text-base font-bold">{feature.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-fog">{feature.body}</p>
          </div>
        ))}
      </section>
      <ProductHuntBadge />
    </div>
  );
}
