import { ImageResponse } from "next/og";
import { getBurn } from "@/lib/store";

export const runtime = "nodejs";
export const alt = "A daily AI usage post shared on Burnt";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

function compactTokens(value: number) {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1).replace(".0", "")}B`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1).replace(".0", "")}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1).replace(".0", "")}K`;
  return String(value);
}

export default async function OpenGraphImage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const burn = await getBurn(id);

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        position: "relative",
        overflow: "hidden",
        color: "#f4f1e8",
        background: "#09090b",
        fontFamily: "sans-serif",
        padding: 58,
      }}
    >
      <div
        style={{
          position: "absolute",
          width: 620,
          height: 620,
          left: -180,
          top: -320,
          borderRadius: 999,
          background: "radial-gradient(circle, rgba(255,255,255,.18), rgba(255,255,255,0) 70%)",
        }}
      />
      <div style={{ display: "flex", flexDirection: "column", width: "100%", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", fontSize: 34, fontWeight: 800 }}>
            <span
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 42,
                height: 42,
                marginRight: 14,
                border: "2px solid #8d8d94",
                borderRadius: 12,
                fontSize: 24,
              }}
            >
              B
            </span>
            Burnt
          </div>
          <div style={{ color: "#8d8d94", fontSize: 22, letterSpacing: 3 }}>DAILY AI USAGE</div>
        </div>

        {burn ? (
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
            <div style={{ display: "flex", flexDirection: "column", maxWidth: 680 }}>
              <div style={{ color: "#a7a7ad", fontSize: 27, marginBottom: 16 }}>
                {`@${burn.handle} shared today's burn`}
              </div>
              <div
                style={{
                  fontSize: 116,
                  fontWeight: 900,
                  lineHeight: 0.9,
                  letterSpacing: -7,
                  background: "linear-gradient(110deg, #ffffff, #85858b)",
                  backgroundClip: "text",
                  color: "transparent",
                }}
              >
                {compactTokens(burn.tokens)}
              </div>
              <div style={{ color: "#a7a7ad", fontSize: 30, marginTop: 18 }}>tokens burned</div>
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                width: 320,
                minHeight: 200,
                padding: 28,
                border: "1px solid #34343a",
                borderRadius: 30,
                background: "linear-gradient(145deg, rgba(255,255,255,.1), rgba(255,255,255,.02))",
              }}
            >
              <div style={{ color: "#8d8d94", fontSize: 18, letterSpacing: 2 }}>BUILT WITH</div>
              <div style={{ fontSize: 30, fontWeight: 700, marginTop: 12 }}>{burn.model || "AI"}</div>
              <div style={{ color: "#a7a7ad", fontSize: 20, lineHeight: 1.35, marginTop: 28 }}>
                {burn.caption || "What did you ship today?"}
              </div>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", fontSize: 64, fontWeight: 800 }}>This burn has gone cold.</div>
        )}
      </div>
    </div>,
    size
  );
}
