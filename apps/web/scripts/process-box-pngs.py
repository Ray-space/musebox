"""Process blind-box PNGs: remove matte backgrounds and soften alpha edges."""

from __future__ import annotations

import os
import shutil
from collections import deque

from PIL import Image, ImageFilter

BOX_DIR = os.path.join(os.path.dirname(__file__), "..", "public", "assets", "boxes")
ASSETS_DIR = os.path.join(
    os.path.dirname(__file__),
    "..",
    "..",
    "..",
    "..",
    ".cursor",
    "projects",
    "e",
    "assets",
)

# Fallback: Cursor workspace assets path (Windows)
CURSOR_ASSETS = os.path.normpath(
    r"C:\Users\ZhuanZ（无密码）\.cursor\projects\e\assets",
)

SOURCE_FILES: dict[str, str] = {
    "sync.png": "c__Users_ZhuanZ______AppData_Roaming_Cursor_User_workspaceStorage_84f70d49639323d2a0bf8bc9501149f6_images_ChatGPT_Image_2026_6_22__19_46_02__3_-24606b18-9f56-43ff-9156-9ab4bb9e4794.png",
    "transition.png": "c__Users_ZhuanZ______AppData_Roaming_Cursor_User_workspaceStorage_84f70d49639323d2a0bf8bc9501149f6_images_ChatGPT_Image_2026_6_22__19_49_37__2_-9332d6d5-1842-4a0b-93e5-53bbf0abc9fe.png",
    "serendipity.png": "c__Users_ZhuanZ______AppData_Roaming_Cursor_User_workspaceStorage_84f70d49639323d2a0bf8bc9501149f6_images_ChatGPT_Image_2026_6_22__19_49_37__3_-d873570a-f76c-49a1-a421-d7c0f93a82eb.png",
}

NAMES = tuple(SOURCE_FILES.keys())


def saturation(r: int, g: int, b: int) -> int:
    return max(r, g, b) - min(r, g, b)


def bg_likeness(r: int, g: int, b: int) -> float:
    """0 = foreground, 1 = background."""
    avg = (r + g + b) / 3
    sat = saturation(r, g, b)
    score = 0.0

    if avg <= 52:
        score = max(score, 1.0 - avg / 52.0)

    # Neutral gray / checkerboard cells
    if sat <= 22:
        if 110 <= avg <= 255:
            mid = abs(avg - 210) / 45
            score = max(score, 0.88 - mid * 0.2)
        if 80 <= avg < 110:
            score = max(score, 0.72)

    if sat <= 18 and avg >= 188:
        t = min(1.0, (avg - 188) / 68)
        score = max(score, 0.78 + t * 0.22)

    return min(1.0, score)


def is_strong_bg(r: int, g: int, b: int) -> bool:
    return bg_likeness(r, g, b) >= 0.82


def flood_exterior_bg(rgb: Image.Image) -> list[list[bool]]:
    w, h = rgb.size
    px = rgb.load()
    exterior = [[False] * w for _ in range(h)]
    queue: deque[tuple[int, int]] = deque()

    def push(x: int, y: int) -> None:
        if 0 <= x < w and 0 <= y < h and not exterior[y][x]:
            r, g, b = px[x, y]
            if is_strong_bg(r, g, b):
                exterior[y][x] = True
                queue.append((x, y))

    for x in range(w):
        push(x, 0)
        push(x, h - 1)
    for y in range(h):
        push(0, y)
        push(w - 1, y)

    while queue:
        x, y = queue.popleft()
        for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
            if 0 <= nx < w and 0 <= ny < h and not exterior[ny][nx]:
                r, g, b = px[nx, ny]
                if is_strong_bg(r, g, b):
                    exterior[ny][nx] = True
                    queue.append((nx, ny))

    return exterior


def build_soft_alpha(rgb: Image.Image, exterior: list[list[bool]]) -> Image.Image:
    w, h = rgb.size
    px = rgb.load()
    alpha = Image.new("L", (w, h), 0)
    apx = alpha.load()

    for y in range(h):
        for x in range(w):
            r, g, b = px[x, y]
            if exterior[y][x]:
                apx[x, y] = 0
                continue

            likeness = bg_likeness(r, g, b)
            # Smoothstep for natural fringe
            t = max(0.0, min(1.0, (likeness - 0.08) / 0.55))
            t = t * t * (3 - 2 * t)
            a = int((1.0 - t) * 255)
            apx[x, y] = max(0, min(255, a))

    return alpha


def despill_black(rgb: Image.Image, alpha: Image.Image) -> Image.Image:
    out = rgb.copy()
    rpx = out.load()
    apx = alpha.load()
    w, h = out.size

    for y in range(h):
        for x in range(w):
            a = apx[x, y] / 255.0
            if a < 0.04:
                continue
            r, g, b = rpx[x, y]
            # Un-premultiply from black matte
            r = min(255, int(r / a))
            g = min(255, int(g / a))
            b = min(255, int(b / a))
            # Clamp dark fringe on low-alpha edges
            if a < 0.65:
                lift = (0.65 - a) * 0.35
                r = int(r + (255 - r) * lift * 0.15)
                g = int(g + (255 - g) * lift * 0.15)
                b = int(b + (255 - b) * lift * 0.15)
            rpx[x, y] = (r, g, b)

    return out


def feather_alpha(alpha: Image.Image, radius: float) -> Image.Image:
    return alpha.filter(ImageFilter.GaussianBlur(radius=radius))


def cleanup_edge_fringe(
    rgb: Image.Image, alpha: Image.Image
) -> Image.Image:
    """Reduce neutral gray fringing on soft edges."""
    out = alpha.copy()
    rpx = rgb.load()
    apx = out.load()
    w, h = out.size

    for y in range(h):
        for x in range(w):
            a = apx[x, y]
            if a == 0 or a == 255:
                continue
            r, g, b = rpx[x, y]
            sat = saturation(r, g, b)
            avg = (r + g + b) / 3
            if sat <= 24 and 90 <= avg <= 245:
                apx[x, y] = int(a * 0.55)
            elif sat <= 32 and avg < 70:
                apx[x, y] = int(a * 0.75)

    return out


def process_image(im: Image.Image, feather: float = 2.0) -> Image.Image:
    rgb = im.convert("RGB")
    exterior = flood_exterior_bg(rgb)
    alpha = build_soft_alpha(rgb, exterior)
    alpha = cleanup_edge_fringe(rgb, alpha)
    alpha = feather_alpha(alpha, radius=feather)

    rgb = despill_black(rgb, alpha)

    rgba = rgb.convert("RGBA")
    rgba.putalpha(alpha)
    return rgba


def trim_transparent(im: Image.Image, pad: int = 32) -> Image.Image:
    bbox = im.getbbox()
    if not bbox:
        return im
    left, top, right, bottom = bbox
    left = max(0, left - pad)
    top = max(0, top - pad)
    right = min(im.width, right + pad)
    bottom = min(im.height, bottom + pad)
    return im.crop((left, top, right, bottom))


def resolve_source(name: str) -> str | None:
    src_name = SOURCE_FILES[name]
    for base in (CURSOR_ASSETS, ASSETS_DIR):
        path = os.path.join(base, src_name)
        if os.path.isfile(path):
            return path
    return None


def sync_sources() -> None:
    os.makedirs(BOX_DIR, exist_ok=True)
    for name in NAMES:
        src = resolve_source(name)
        if not src:
            print(f"[skip source] {name}: source not found")
            continue
        shutil.copy2(src, os.path.join(BOX_DIR, name))
        print(f"[copied] {name} <- {os.path.basename(src)}")


def main() -> None:
    sync_sources()

    for name in NAMES:
        path = os.path.join(BOX_DIR, name)
        if not os.path.isfile(path):
            print(f"[skip] {name}: missing")
            continue

        im = Image.open(path)
        out = process_image(im, feather=2.6)
        out = trim_transparent(out, pad=36)
        out.save(path, "PNG", optimize=True)

        alpha = out.split()[-1]
        data = list(alpha.getdata())
        transparent = sum(1 for p in data if p < 20)
        semi = sum(1 for p in data if 20 <= p < 235)
        corners = [
            alpha.getpixel((0, 0)),
            alpha.getpixel((out.width - 1, out.height - 1)),
        ]
        print(
            f"{name}: {out.size} transparent={transparent/len(data):.1%} "
            f"semi={semi/len(data):.1%} corners={corners}",
        )


if __name__ == "__main__":
    main()
