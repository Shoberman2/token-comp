import { Feed } from "@/components/Feed";

export default function Home() {
  return (
    <div className="flex flex-col gap-5">
      <div className="rise flex items-end justify-between pt-2">
        <div>
          <h1 className="font-display text-2xl font-bold">Feed</h1>
          <p className="text-sm text-fog">Burns from people you follow</p>
        </div>
      </div>
      <Feed />
    </div>
  );
}
