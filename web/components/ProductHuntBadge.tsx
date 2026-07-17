import Image from "next/image";

export function ProductHuntBadge() {
  return (
    <div className="flex justify-center py-2">
      <a
        href="https://www.producthunt.com/products/burnt-2?embed=true&utm_source=badge-featured&utm_medium=badge&utm_campaign=badge-burnt-2"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="View Burnt on Product Hunt"
        className="rounded-md transition-opacity hover:opacity-85"
      >
        <Image
          src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1199488&theme=light&t=1784331335857"
          alt="Burnt — BeReal for your daily AI token usage on Product Hunt"
          width={250}
          height={54}
          unoptimized
        />
      </a>
    </div>
  );
}
