/**
 * jsdom normalises an inline colour to `rgb(r, g, b)`, so a test comparing against an artboard
 * hex fails on formatting rather than on value. Converting the expected token keeps the
 * assertion pointed at the colour instead of loosening it to a substring match.
 */
export function rgb(hex: string): string {
  const m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);
  if (m === null) throw new Error(`not a six-digit hex colour: ${hex}`);

  const [r, g, b] = [m[1], m[2], m[3]].map((pair) => parseInt(pair as string, 16));
  return `rgb(${r}, ${g}, ${b})`;
}
