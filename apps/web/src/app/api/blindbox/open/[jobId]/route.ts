import { NextRequest, NextResponse } from "next/server";
import { getOpenJob } from "@/lib/open-job-store";
import type { OpenJobPollResponse } from "@/types";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ jobId: string }> },
) {
  const { jobId } = await context.params;
  const job = getOpenJob(jobId);

  if (!job) {
    return NextResponse.json({ error: "任务不存在或已过期" }, { status: 404 });
  }

  const payload: OpenJobPollResponse = {
    status: job.status,
    stage: job.stage,
    progress: job.progress,
    error: job.error,
    result: job.result,
  };

  return NextResponse.json(payload);
}
