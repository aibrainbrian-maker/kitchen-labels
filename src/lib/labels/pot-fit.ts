// Auto-fit text sizing for the pot label template, replicating the supplier's
// LabelLogic output (calibrated against their sample PDFs: content column is
// 100pt wide; the ingredients block fills up to 183pt of height).
//
// Width tables are Helvetica advance widths at font size 1 for ASCII 32–126,
// generated from the standard font metrics.
import widths from "./helvetica-widths.json";

const REG = widths.regular as number[];
const BOLD = widths.bold as number[];
const AVG = 0.5; // fallback for non-ASCII

export const POT_CONTENT_W_PT = 100;
export const POT_ING_BOX_H_PT = 183;
const LINE_FACTOR = 1.25;
const MAX_SIZE = 18;
const MIN_SIZE = 6;

/** Width of `text` at font size 1. */
export function textWidth1(text: string, bold = false): number {
  const table = bold ? BOLD : REG;
  let w = 0;
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    w += code >= 32 && code <= 126 ? table[code - 32] : AVG;
  }
  return w;
}

/**
 * Product name: fits one line into the 100pt column, capped at 18pt; names
 * too long for one legible line wrap at 8.9pt (two ~9pt lines), exactly as
 * the supplier's labels do.
 */
export function potNameSizePt(name: string): number {
  const fit = POT_CONTENT_W_PT / textWidth1(name);
  if (fit >= 9) return Math.min(MAX_SIZE, fit);
  return 8.9;
}

/** Description: single-line fit, clamped 5.8–10.8pt (wraps at the floor). */
export function potDescSizePt(desc: string): number {
  const fit = POT_CONTENT_W_PT / textWidth1(desc);
  return Math.max(5.8, Math.min(10.8, fit));
}

/**
 * Sandwich-wrap description: fits two lines of the ~163pt content column,
 * capped at 9.7pt — matches the supplier's auto-shrink (e.g. Surfin's longer
 * descriptions print at 8.7pt).
 */
export function wrapDescSizePt(desc: string): number {
  return Math.max(7, Math.min(9.7, (2 * 163) / textWidth1(desc)));
}

/**
 * Ingredients block: the largest size (≤18pt) whose word-wrapped height fits
 * the box, via greedy wrap simulation with real font metrics.
 */
export function potIngredientsSizePt(
  tokens: Array<{ text: string; bold: boolean }>
): number {
  const words: Array<{ w1: number }> = [];
  for (const tok of tokens) {
    for (const word of tok.text.split(/\s+/)) {
      if (word) words.push({ w1: textWidth1(word, tok.bold) });
    }
  }
  if (words.length === 0) return MAX_SIZE;
  const space1 = textWidth1(" ");

  for (let size = MAX_SIZE; size > MIN_SIZE; size = Math.round((size - 0.1) * 10) / 10) {
    let lines = 1;
    let cur = 0;
    for (const { w1 } of words) {
      const w = w1 * size;
      if (cur > 0 && cur + space1 * size + w > POT_CONTENT_W_PT) {
        lines += 1;
        cur = w;
      } else {
        cur += (cur > 0 ? space1 * size : 0) + w;
      }
    }
    if (lines * size * LINE_FACTOR <= POT_ING_BOX_H_PT) return size;
  }
  return MIN_SIZE;
}
