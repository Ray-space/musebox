import { toPng } from "html-to-image";

export const LYRIC_CARD_WIDTH = 420;
export const LYRIC_CARD_HEIGHT = Math.round((LYRIC_CARD_WIDTH * 4) / 3);

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

export async function captureLyricCard(
  element: HTMLElement,
  options?: { pixelRatio?: number; forShare?: boolean },
): Promise<string> {
  const pixelRatio = options?.pixelRatio ?? (options?.forShare ? 3 : 2);

  element.classList.add("art-lyric-card--capture");
  element.setAttribute("data-capturing", "true");

  try {
    await waitForFonts();
    await waitForImages(element);
    await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));
    await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));

    return await toPng(element, {
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
  } finally {
    element.classList.remove("art-lyric-card--capture");
    element.removeAttribute("data-capturing");
  }
}

export function downloadDataUrl(dataUrl: string, filename: string) {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;
  link.click();
}
