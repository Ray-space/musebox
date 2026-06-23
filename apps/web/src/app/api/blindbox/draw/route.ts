import { NextRequest, NextResponse } from "next/server";
import { drawBlindBoxes } from "@/lib/blindbox-match";
import type { MomentAnalysis } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const analysis = body.analysis as MomentAnalysis;
    if (!analysis?.momentId) {
      return NextResponse.json({ error: "缺少 analysis" }, { status: 400 });
    }
    const result = drawBlindBoxes(analysis);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "抽取失败" },
      { status: 500 },
    );
  }
}
