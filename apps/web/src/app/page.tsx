"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { MomentInput } from "@/components/MomentInput";
import { clearSession, savePendingMoment } from "@/lib/storage";

export default function HomePage() {
  const router = useRouter();
  const [text, setText] = useState("");
  const [caption, setCaption] = useState("");
  const [imageDataUrl, setImageDataUrl] = useState<string>();

  const canSubmit = text.trim() || imageDataUrl;

  const handleDraw = () => {
    if (!canSubmit) return;
    clearSession();
    savePendingMoment({ source: "free", text, caption, imageDataUrl });
    router.push("/draw");
  };

  return (
    <AppShell variant="home">
      <div className="home-stage">
        <MomentInput
          text={text}
          caption={caption}
          imageDataUrl={imageDataUrl}
          onTextChange={setText}
          onCaptionChange={setCaption}
          onImageChange={setImageDataUrl}
        />

        <p className="home-tagline">将生活瞬间，变成可以听见的音乐</p>

        <div className="home-cta">
          <button
            type="button"
            disabled={!canSubmit}
            onClick={handleDraw}
            className="dream-btn home-cta-btn disabled:cursor-not-allowed"
          >
            ✨ 开启 MuseBox灵感音匣
          </button>
        </div>
      </div>
    </AppShell>
  );
}
