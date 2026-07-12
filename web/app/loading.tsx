export default function Loading() {
  return (
    <div className="flex flex-col gap-4" aria-label="Loading">
      <div className="h-10 w-48 animate-pulse rounded-card bg-ash" />
      <div className="h-72 animate-pulse rounded-card bg-ash" />
      <div className="h-32 animate-pulse rounded-card bg-ash" />
    </div>
  );
}
