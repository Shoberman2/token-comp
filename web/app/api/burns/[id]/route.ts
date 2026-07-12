import { NextResponse } from "next/server";
import { getBurn } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const burn = await getBurn(id);
    if (!burn) return NextResponse.json({ error: "Burn not found." }, { status: 404 });
    return NextResponse.json({ burn });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not load this burn.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
