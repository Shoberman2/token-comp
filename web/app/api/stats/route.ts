import { NextResponse } from "next/server";
import { totals } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const t = await totals();
  return NextResponse.json(t);
}
