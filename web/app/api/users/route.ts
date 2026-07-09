import { NextResponse } from "next/server";
import { searchUsers } from "@/lib/social";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q") || "";
  return NextResponse.json({ users: await searchUsers(q) });
}
