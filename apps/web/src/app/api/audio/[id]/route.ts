import { resolveGeneratedAudio } from "@/lib/generated-audio-cache";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const buffer = await resolveGeneratedAudio(id);
  if (!buffer) {
    return NextResponse.json({ error: "音频不存在或已过期" }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "audio/mpeg",
      "Cache-Control": "private, max-age=3600",
    },
  });
}
