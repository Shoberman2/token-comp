import { initials } from "@/lib/format";

export function Avatar({
  name,
  handle,
  src,
  size = 40,
  className,
}: {
  name?: string;
  handle?: string;
  src?: string | null;
  size?: number;
  className?: string;
}) {
  const text = initials(name || handle || "?");
  const isImage = !!src && (src.startsWith("http") || src.startsWith("/") || src.startsWith("data:"));

  if (isImage) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt=""
        className={`shrink-0 rounded-full object-cover lit ${className ?? ""}`}
        style={{ width: size, height: size }}
        aria-hidden
      />
    );
  }

  return (
    <div
      className={`grid shrink-0 place-items-center rounded-full font-display font-semibold text-bone lit ${className ?? ""}`}
      style={{
        width: size,
        height: size,
        fontSize: Math.round(size * 0.36),
        background: "linear-gradient(160deg, var(--smoke), var(--panel))",
      }}
      aria-hidden
    >
      {text}
    </div>
  );
}
