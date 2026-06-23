import { NextRequest, NextResponse } from "next/server";
import { drawBlindBoxes } from "@/lib/blindbox-match";
import {
  analyzeMomentWithLLM,
  generateBlindBoxCopies,
  generateBlindBoxSongTitles,
} from "@/lib/mood-engine";
import type { MomentInputPayload } from "@/types";
import { v4 as uuidv4 } from "uuid";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as MomentInputPayload;
    const momentId = uuidv4();
    let analysis = await analyzeMomentWithLLM(
      momentId,
      body.text,
      body.caption,
      body.imageDataUrl,
    );

    const needCopies = !analysis.box_copies;
    const needTitles = !analysis.box_song_titles;

    if (needCopies || needTitles) {
      const [boxCopies, boxSongTitles] = await Promise.all([
        needCopies ? generateBlindBoxCopies(analysis) : Promise.resolve(undefined),
        needTitles
          ? generateBlindBoxSongTitles(analysis)
          : Promise.resolve(undefined),
      ]);

      if (boxCopies) {
        analysis = { ...analysis, box_copies: boxCopies };
      }
      if (boxSongTitles) {
        analysis = { ...analysis, box_song_titles: boxSongTitles };
      }
    }

    const result = drawBlindBoxes(analysis);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "分析失败" },
      { status: 500 },
    );
  }
}
