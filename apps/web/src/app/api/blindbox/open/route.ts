import { NextRequest, NextResponse } from "next/server";
import { isOpenAsyncEnabled } from "@/lib/open-async-mode";
import {
  createOpenJob,
  updateOpenJob,
} from "@/lib/open-job-store";
import {
  processOpenGeneration,
  type OpenGenerationInput,
} from "@/lib/process-open-generation";
import { scheduleBackgroundTask } from "@/lib/schedule-background-task";
import { shouldTryGenerate } from "@/lib/music-mode";
import type { BlindBox, MomentAnalysis } from "@/types";
import { v4 as uuidv4 } from "uuid";

export const maxDuration = 300;

async function runOpenJob(jobId: string, input: OpenGenerationInput) {
  updateOpenJob(jobId, { status: "running", stage: "准备中…" });

  try {
    const result = await processOpenGeneration(input, (stage) => {
      updateOpenJob(jobId, { stage });
    });
    updateOpenJob(jobId, { status: "completed", result, stage: undefined });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "开盒失败";
    console.error("[blindbox/open] async job failed:", error);
    updateOpenJob(jobId, { status: "failed", error: message });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const box = body.box as BlindBox;
    const analysis = body.analysis as MomentAnalysis;
    const forceLibrary = body.forceLibrary === true;
    const scenarioId = body.scenarioId as string | undefined;

    if (!box?.songId) {
      return NextResponse.json({ error: "缺少 box" }, { status: 400 });
    }

    const input: OpenGenerationInput = {
      box,
      analysis,
      forceLibrary,
      scenarioId,
    };

    const useAsync =
      isOpenAsyncEnabled() && !forceLibrary && shouldTryGenerate();

    if (useAsync) {
      const jobId = uuidv4();
      createOpenJob(jobId);
      scheduleBackgroundTask(() => runOpenJob(jobId, input));
      return NextResponse.json({ jobId, status: "pending" });
    }

    const result = await processOpenGeneration(input);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "开盒失败" },
      { status: 500 },
    );
  }
}
