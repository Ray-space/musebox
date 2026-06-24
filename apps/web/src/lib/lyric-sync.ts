export type LyricSection = "verse" | "chorus";

export interface ParsedLyrics {
  lines: string[];
  sections: LyricSection[];
}

const SECTION_TAG = /^\[(verse|chorus)\]$/i;

export function parseLyricText(raw: string): ParsedLyrics {
  const lines: string[] = [];
  const sections: LyricSection[] = [];
  let current: LyricSection = "verse";

  for (const row of raw.split("\n")) {
    const line = row.trim();
    if (!line) continue;

    const tagMatch = line.match(SECTION_TAG);
    if (tagMatch) {
      current = tagMatch[1].toLowerCase() as LyricSection;
      continue;
    }

    lines.push(line.replace(/^「\s*|\s*」$/g, ""));
    sections.push(current);
  }

  return { lines, sections };
}

export function assignDefaultSections(lineCount: number): LyricSection[] {
  if (lineCount <= 0) return [];
  const sections: LyricSection[] = [];
  for (let i = 0; i < lineCount; i += 1) {
    if (lineCount <= 4) {
      sections.push(i < 2 ? "verse" : "chorus");
    } else if (i < 2) {
      sections.push("verse");
    } else if (i < 4) {
      sections.push("chorus");
    } else if (i < 5) {
      sections.push("verse");
    } else {
      sections.push("chorus");
    }
  }
  return sections;
}

export function toMiniMaxLyrics(lines: string[], sections: LyricSection[]): string {
  const parts: string[] = [];
  let lastSection: LyricSection | null = null;

  for (let i = 0; i < lines.length; i += 1) {
    const section = sections[i] ?? "verse";
    if (section !== lastSection) {
      parts.push(section === "chorus" ? "[Chorus]" : "[Verse]");
      lastSection = section;
    }
    parts.push(lines[i]);
  }

  return parts.join("\n");
}

/** 每行起始进度（0~1），Chorus 行停留更久 */
export function buildLyricStartFractions(sections: LyricSection[]): number[] {
  if (sections.length === 0) return [];

  const introPad = 0.05;
  const outroPad = 0.03;
  const usable = 1 - introPad - outroPad;

  const weights = sections.map((section) => (section === "chorus" ? 1.4 : 1));
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);

  const fractions: number[] = [];
  let cursor = introPad;

  for (const weight of weights) {
    fractions.push(cursor);
    cursor += (weight / totalWeight) * usable;
  }

  return fractions;
}

export function resolveActiveLyricIndex(
  progress: number,
  startFractions: number[],
): number {
  if (startFractions.length === 0) return 0;

  const clamped = ((progress % 1) + 1) % 1;
  let index = 0;

  for (let i = startFractions.length - 1; i >= 0; i -= 1) {
    if (clamped >= startFractions[i]) {
      index = i;
      break;
    }
  }

  return index;
}
