import { generateBoxCopies, generateBoxSongTitles } from "@/lib/mood-engine";
import { assignTimbresForBoxes } from "@/lib/timbre-roll";
import { getSongsByStrategy } from "@/lib/songs";
import type { BlindBox, DrawResult, MomentAnalysis, Strategy } from "@/types";
import { v4 as uuidv4 } from "uuid";

function tokenize(tags: string[]): Set<string> {
  return new Set(tags.map((tag) => tag.toLowerCase()));
}

function scoreSong(
  analysis: MomentAnalysis,
  songTags: string[],
  sceneTags: string[],
): number {
  const moodSet = tokenize(analysis.mood_tags);
  const sceneSet = tokenize(analysis.scene_tags);
  const songMood = tokenize(songTags);
  const songScene = tokenize(sceneTags);

  let score = 0;
  for (const tag of moodSet) {
    if (songMood.has(tag)) score += 2;
  }
  for (const tag of sceneSet) {
    if (songScene.has(tag)) score += 3;
  }
  if (analysis.tempo_hint && songTags.includes(analysis.tempo_hint)) {
    score += 1;
  }
  for (const keyword of analysis.imagery) {
    if (songTags.some((tag) => tag.includes(keyword) || keyword.includes(tag))) {
      score += 1;
    }
  }
  return score;
}

export function drawBlindBoxes(analysis: MomentAnalysis): DrawResult {
  const copies = generateBoxCopies(analysis);
  const songTitles = generateBoxSongTitles(analysis);
  const timbres = assignTimbresForBoxes(analysis);
  const strategies: Strategy[] = ["sync", "transition", "serendipity"];

  const boxes: BlindBox[] = strategies.map((strategy) => {
    const candidates = getSongsByStrategy(strategy)
      .map((song) => ({
        song,
        score: scoreSong(analysis, song.mood_tags, song.scene_tags),
      }))
      .sort((a, b) => b.score - a.score);

    const best = candidates[0]?.song ?? getSongsByStrategy(strategy)[0];
    const matchScore = candidates[0]?.score ?? 0;
    const timbre = timbres[strategy];

    return {
      id: uuidv4(),
      copy: copies[strategy],
      songTitle: songTitles[strategy],
      atmosphereHint: timbre.atmosphereHint,
      timbre,
      strategy,
      songId: best.id,
      matchScore,
    };
  });

  return {
    momentId: analysis.momentId,
    boxes,
    analysis,
  };
}
