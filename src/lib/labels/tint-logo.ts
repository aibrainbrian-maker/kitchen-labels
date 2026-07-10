import { PNG } from "pngjs";

/**
 * Recolours a PNG logo to a target colour, LabelLogic-style: every visibly
 * coloured pixel takes the label's category colour while white (and
 * near-white) detail inside the logo is preserved — e.g. the eatlunch heart
 * prints orange on Chicken labels but keeps its white lettering.
 *
 * Runs server-side only (used when assembling label content, so the screen
 * preview, PDF and snapshots all see the already-tinted image).
 */
const cache = new Map<string, string>();

export function tintPngDataUrl(dataUrl: string, hexColor: string): string {
  const key = `${hexColor}:${dataUrl.length}:${dataUrl.slice(-40)}`;
  const hit = cache.get(key);
  if (hit) return hit;

  const m = /^data:image\/png;base64,(.+)$/.exec(dataUrl);
  if (!m) return dataUrl; // not a PNG data URL — leave untouched

  const rgb = hexToRgb(hexColor);
  if (!rgb) return dataUrl;

  const png = PNG.sync.read(Buffer.from(m[1], "base64"));
  const { data } = png;
  for (let i = 0; i < data.length; i += 4) {
    const a = data[i + 3];
    if (a === 0) continue;
    const r = data[i], g = data[i + 1], b = data[i + 2];
    // keep white/near-white detail (logo text, highlights)
    if (r > 235 && g > 235 && b > 235) continue;
    data[i] = rgb.r;
    data[i + 1] = rgb.g;
    data[i + 2] = rgb.b;
  }
  const out = `data:image/png;base64,${PNG.sync.write(png).toString("base64")}`;
  cache.set(key, out);
  return out;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}
