"use client";

import { motion } from "framer-motion";
import {
  buildLyricCardContext,
  buildMomentAnnotation,
} from "@/lib/lyric-card-context";
import type { OpenResult } from "@/types";

interface SongResultMetaProps {
  data: OpenResult;
  boxCopy: string;
  visible?: boolean;
}

export function SongResultMeta({
  data,
  boxCopy,
  visible = true,
}: SongResultMetaProps) {
  const { song, timbre, momentText } = data;

  const visual = buildLyricCardContext({
    strategy: song.strategy,
    momentText,
    userText: momentText,
    songTitle: song.title,
    lyrics: [],
    boxCopy,
    genre: song.genre,
    tempo: song.tempo,
    moodTags: song.mood_tags,
    imagery: song.imagery_keywords,
    timbre,
  });

  const annotation = buildMomentAnnotation({
    strategy: song.strategy,
    momentText,
    boxCopy,
    timbre,
    genre: song.genre,
  });

  const genreLabel =
    timbre?.genreHint ||
    visual.musicStyle ||
    song.genre;

  if (!visible) return null;

  return (
    <motion.div
      className="result-meta"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.85, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
    >
      <section className="result-meta-block">
        <p className="result-meta-label">歌曲信息</p>
        <h2 className="result-meta-title">{song.title}</h2>
        <p className="result-meta-core">「{boxCopy}」</p>
        <span className="result-meta-tag">{genreLabel}</span>
      </section>

      {timbre && (
        <section className="result-meta-block">
          <p className="result-meta-label">音乐说明书</p>
          <p className="result-meta-spec-name">{timbre.label}</p>
          <div className="result-meta-spec-grid">
            <div className="result-meta-spec-item">
              <span>音色</span>
              <p>{timbre.layers.join(" · ") || visual.soundKeywords.join(" · ")}</p>
            </div>
            <div className="result-meta-spec-item">
              <span>节奏</span>
              <p>{timbre.beatStyle || visual.rhythm}</p>
            </div>
            <div className="result-meta-spec-item">
              <span>灵感走向</span>
              <p>{visual.emotionArc}</p>
            </div>
            <div className="result-meta-spec-item">
              <span>适合状态</span>
              <p>{timbre.atmosphereHint || timbre.listeningFeel}</p>
            </div>
          </div>
        </section>
      )}

      <section className="result-meta-block result-meta-annotation">
        <p className="result-meta-label">此刻注解</p>
        <p className="result-meta-annotation-text">{annotation}</p>
      </section>
    </motion.div>
  );
}
