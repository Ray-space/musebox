"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { NoteParticles } from "@/components/NoteParticles";
import { extractImageAccentColors } from "@/lib/image-colors";
import { compressImageDataUrl } from "@/lib/image";
import { PLACEHOLDERS } from "@/types";

interface MomentInputProps {
  text: string;
  caption: string;
  imageDataUrl?: string;
  onTextChange: (value: string) => void;
  onCaptionChange: (value: string) => void;
  onImageChange: (value?: string) => void;
}

export function MomentInput({
  text,
  caption,
  imageDataUrl,
  onTextChange,
  onCaptionChange,
  onImageChange,
}: MomentInputProps) {
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [particleBurst, setParticleBurst] = useState(0);
  const [photoBorder, setPhotoBorder] = useState<string>();
  const fileRef = useRef<HTMLInputElement>(null);
  const lastLengthRef = useRef(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % PLACEHOLDERS.length);
    }, 3500);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!imageDataUrl) {
      setPhotoBorder(undefined);
      return;
    }

    let cancelled = false;
    extractImageAccentColors(imageDataUrl).then((colors) => {
      if (cancelled) return;
      setPhotoBorder(
        `linear-gradient(135deg, ${colors[0]}, ${colors[1]}, ${colors[2]}, ${colors[0]})`,
      );
    });

    return () => {
      cancelled = true;
    };
  }, [imageDataUrl]);

  const handleFile = async (file?: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const compressed = await compressImageDataUrl(reader.result as string);
        onImageChange(compressed);
      } catch {
        onImageChange(reader.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleTextChange = (value: string) => {
    if (value.length > lastLengthRef.current) {
      setParticleBurst((key) => key + 1);
    }
    lastLengthRef.current = value.length;
    onTextChange(value);
  };

  const shellClass = [
    "inspiration-input-shell",
    text.trim() ? "has-text" : "",
    imageDataUrl ? "has-photo" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <section className="inspiration-stage">
      <div className="inspiration-header">
        <p className="inspiration-eyebrow">灵感源于生活瞬间</p>
        <h1 className="inspiration-title">将此刻交给音乐</h1>
      </div>

      <div
        className={shellClass}
        style={
          photoBorder
            ? ({ "--photo-border": photoBorder } as CSSProperties)
            : undefined
        }
      >
        {imageDataUrl && <div className="inspiration-photo-border" aria-hidden />}

        <NoteParticles active={Boolean(text.trim())} burstKey={particleBurst} />

        <div className="inspiration-input-glow" aria-hidden />
        <textarea
          value={text}
          onChange={(e) => handleTextChange(e.target.value)}
          placeholder={PLACEHOLDERS[placeholderIndex]}
          rows={7}
          className="inspiration-textarea"
        />

        {imageDataUrl && (
          <div className="inspiration-photo-chip">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageDataUrl} alt="已选照片" />
            <button
              type="button"
              onClick={() => onImageChange(undefined)}
              className="inspiration-photo-remove"
              aria-label="移除照片"
            >
              ×
            </button>
          </div>
        )}

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />

        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className={`inspiration-photo-btn ${imageDataUrl ? "is-active" : ""}`}
          aria-label="添加照片"
          title="添加照片（可选）"
        >
          <span className="inspiration-photo-icon" aria-hidden>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 7.5A2.5 2.5 0 0 1 6.5 5h2.2l1.1-1.5A1.5 1.5 0 0 1 11 3h2a1.5 1.5 0 0 1 1.2.5L15.3 5H18a2.5 2.5 0 0 1 2.5 2.5v9A2.5 2.5 0 0 1 18 19H6.5A2.5 2.5 0 0 1 4 16.5v-9Z"
              />
              <circle cx="12" cy="12.5" r="3.2" />
            </svg>
          </span>
          <span>{imageDataUrl ? "已附照片" : "照片"}</span>
        </button>

        {imageDataUrl && (
          <input
            value={caption}
            onChange={(e) => onCaptionChange(e.target.value)}
            placeholder="给照片加一句补充（可选）"
            className="inspiration-caption"
          />
        )}
      </div>
    </section>
  );
}
