export async function extractImageAccentColors(
  dataUrl: string,
): Promise<[string, string, string]> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const size = 48;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(defaultColors());
          return;
        }
        ctx.drawImage(img, 0, 0, size, size);
        const { data } = ctx.getImageData(0, 0, size, size);

        let r = 0;
        let g = 0;
        let b = 0;
        let count = 0;

        for (let i = 0; i < data.length; i += 4) {
          const alpha = data[i + 3];
          if (alpha < 40) continue;
          r += data[i];
          g += data[i + 1];
          b += data[i + 2];
          count += 1;
        }

        if (!count) {
          resolve(defaultColors());
          return;
        }

        r = Math.round(r / count);
        g = Math.round(g / count);
        b = Math.round(b / count);

        const primary = `rgb(${r}, ${g}, ${b})`;
        const secondary = `rgb(${Math.min(255, r + 30)}, ${Math.min(255, g + 20)}, ${Math.min(255, b + 40)})`;
        const tertiary = `rgb(${Math.max(0, r - 20)}, ${Math.max(0, g - 10)}, ${Math.max(0, b + 10)})`;
        resolve([primary, secondary, tertiary]);
      } catch {
        resolve(defaultColors());
      }
    };
    img.onerror = () => resolve(defaultColors());
    img.src = dataUrl;
  });
}

function defaultColors(): [string, string, string] {
  return ["#a78bfa", "#c4b5fd", "#e9d5ff"];
}
