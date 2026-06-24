import { toPng } from "html-to-image";

export const LYRIC_CARD_WIDTH = 420;
export const LYRIC_CARD_HEIGHT = Math.round((LYRIC_CARD_WIDTH * 4) / 3);

export interface AlbumLyricCardData {
  imageDataUrl?: string;
  songTitle: string;
  boxCopy: string;
  moodIntro: string;
  lyrics: string[];
}

function getSerifFont() {
  return `"Noto Serif SC", "Songti SC", "STSong", serif`;
}

function getLyricFont() {
  return `"ZCOOL XiaoWei", "Noto Serif SC", "Songti SC", serif`;
}

function wrapTextLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number,
): string[] {
  const chars = text.split("");
  const lines: string[] = [];
  let current = "";

  for (const char of chars) {
    const next = current + char;
    if (ctx.measureText(next).width > maxWidth && current) {
      lines.push(current);
      current = char;
      if (lines.length >= maxLines) break;
    } else {
      current = next;
    }
  }

  if (current && lines.length < maxLines) {
    lines.push(current);
  }

  return lines;
}

async function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("歌词卡图片加载失败"));
    img.src = src;
  });
}

export async function renderAlbumLyricCardPng(
  data: AlbumLyricCardData,
  pixelRatio = 3,
): Promise<string> {
  const width = LYRIC_CARD_WIDTH;
  const height = LYRIC_CARD_HEIGHT;
  const canvas = document.createElement("canvas");
  canvas.width = width * pixelRatio;
  canvas.height = height * pixelRatio;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("无法创建歌词卡画布");
  }

  ctx.scale(pixelRatio, pixelRatio);
  ctx.fillStyle = "#faf9fc";
  ctx.fillRect(0, 0, width, height);

  const photoHeight = height * 0.46;

  if (data.imageDataUrl) {
    const img = await loadImage(data.imageDataUrl);
    const boxAspect = width / photoHeight;
    const imgAspect = img.width / img.height;

    let sx = 0;
    let sy = 0;
    let sw = img.width;
    let sh = img.height;

    if (imgAspect > boxAspect) {
      sw = img.height * boxAspect;
      sx = (img.width - sw) / 2;
    } else {
      sh = img.width / boxAspect;
      sy = (img.height - sh) * 0.3;
    }

    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, width, photoHeight);

    const fade = ctx.createLinearGradient(0, photoHeight * 0.45, 0, photoHeight);
    fade.addColorStop(0, "rgba(250, 249, 252, 0)");
    fade.addColorStop(0.55, "rgba(250, 249, 252, 0.55)");
    fade.addColorStop(0.85, "rgba(250, 249, 252, 0.88)");
    fade.addColorStop(1, "#faf9fc");
    ctx.fillStyle = fade;
    ctx.fillRect(0, 0, width, photoHeight);
  }

  let y = photoHeight + 18;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";

  ctx.font = `400 11px ${getSerifFont()}`;
  ctx.fillStyle = "rgba(107, 95, 128, 0.48)";
  for (const line of wrapTextLines(ctx, data.moodIntro.slice(0, 48), width - 56, 2)) {
    ctx.fillText(line, width / 2, y);
    y += 14;
  }

  y += 10;
  ctx.font = `400 30px ${getLyricFont()}`;
  ctx.fillStyle = "#2d2042";
  ctx.fillText(data.songTitle, width / 2, y);
  y += 36;

  const normalizedCopy = data.boxCopy.replace(/^「\s*|\s*」$/g, "");
  if (normalizedCopy) {
    ctx.font = `400 12px ${getSerifFont()}`;
    ctx.fillStyle = "rgba(88, 62, 128, 0.55)";
    for (const line of wrapTextLines(
      ctx,
      `「${normalizedCopy}」`,
      width - 56,
      2,
    )) {
      ctx.fillText(line, width / 2, y);
      y += 16;
    }
    y += 8;
  }

  y += 6;
  for (const lyric of data.lyrics.slice(0, 6)) {
    ctx.font = `400 12px ${getSerifFont()}`;
    ctx.fillStyle = "rgba(100, 88, 122, 0.82)";
    ctx.fillText(lyric.replace(/^「\s*|\s*」$/g, ""), width / 2, y);
    y += 22;
  }

  ctx.font = `400 8px ${getSerifFont()}`;
  ctx.fillStyle = "rgba(155, 143, 176, 0.38)";
  ctx.fillText("MuseBox灵感音匣", width / 2, height - 18);

  return canvas.toDataURL("image/png");
}

async function waitForImages(root: HTMLElement) {
  const images = Array.from(root.querySelectorAll("img"));
  await Promise.all(
    images.map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete) {
            resolve();
            return;
          }
          img.onload = () => resolve();
          img.onerror = () => resolve();
        }),
    ),
  );
}

async function waitForFonts() {
  if (typeof document !== "undefined" && document.fonts?.ready) {
    await document.fonts.ready;
  }
}

const DOM_CAPTURE_TIMEOUT_MS = 15_000;

function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  message: string,
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      window.setTimeout(() => reject(new Error(message)), ms);
    }),
  ]);
}

async function captureLyricCardDom(
  element: HTMLElement,
  pixelRatio: number,
): Promise<string> {
  element.classList.add("art-lyric-card--capture");
  element.setAttribute("data-capturing", "true");

  try {
    return await withTimeout(
      (async () => {
        await waitForFonts();
        await waitForImages(element);
        await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));
        await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));

        return toPng(element, {
          pixelRatio,
          cacheBust: true,
          skipAutoScale: true,
          width: LYRIC_CARD_WIDTH,
          height: LYRIC_CARD_HEIGHT,
          style: {
            width: `${LYRIC_CARD_WIDTH}px`,
            height: `${LYRIC_CARD_HEIGHT}px`,
            margin: "0",
            transform: "none",
          },
        });
      })(),
      DOM_CAPTURE_TIMEOUT_MS,
      "歌词卡截图超时",
    );
  } finally {
    element.classList.remove("art-lyric-card--capture");
    element.removeAttribute("data-capturing");
  }
}

export async function captureLyricCard(
  element: HTMLElement,
  options?: {
    pixelRatio?: number;
    forShare?: boolean;
    album?: AlbumLyricCardData;
  },
): Promise<string> {
  const pixelRatio = options?.pixelRatio ?? (options?.forShare ? 3 : 2);

  try {
    return await captureLyricCardDom(element, pixelRatio);
  } catch (domError) {
    if (options?.album?.imageDataUrl) {
      console.warn("[lyric-card] DOM capture failed, fallback to canvas:", domError);
      await waitForFonts();
      return renderAlbumLyricCardPng(options.album, pixelRatio);
    }
    throw domError;
  }
}

export function downloadDataUrl(dataUrl: string, filename: string) {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;
  link.click();
}
