import { NextResponse } from "next/server";
import { leaderboard } from "@/lib/store";
import type { Range } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID: Range[] = ["day", "week", "month", "all"];

export async function GET(req: Request) {
  const url = new URL(req.url);
  const raw = (url.searchParams.get("range") || "day") as Range;
  const range: Range = VALID.includes(raw) ? raw : "day";
  const entries = await leaderboard(range);
  return NextResponse.json({ range, entries });
}
