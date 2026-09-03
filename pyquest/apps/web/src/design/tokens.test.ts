/**
 * @vitest-environment node
 *
 * The palette is written in two languages, and this is what stops them disagreeing.
 *
 * `design/tokens.ts` holds the hex because things like `MapScreen`'s `shade()` do arithmetic on
 * it. `src/index.css` holds the same values as custom properties because that is the only form a
 * browser can use to theme its own widgets. CSS cannot import a TypeScript module, so the values
 * exist twice — and two copies of anything drift unless something reads both.
 *
 * This is the same shape as `apps/api/tests/journal-path.test.ts`: a seam between two files that
 * are each internally consistent and could quietly stop agreeing. That one cost a feature its XP
 * for two days before anybody noticed. This one would cost a screen its colours, which is louder,
 * but only if somebody happens to look at the right screen.
 *
 * Node environment, not jsdom: this reads files rather than rendering anything.
 */

import { readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { color, font, metric, palette } from './tokens.ts';

const css = readFileSync(fileURLToPath(new URL('../index.css', import.meta.url)), 'utf8');
const srcRoot = fileURLToPath(new URL('..', import.meta.url));

function filesUnder(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) return filesUnder(full);
    return /\.tsx?$/.test(entry.name) ? [full] : [];
  });
}

/** `--rail-bg: #0d1014;` → `{ 'rail-bg': '#0d1014' }`, for every custom property declared. */
const declared = (): Record<string, string> =>
  Object.fromEntries(
    [...css.matchAll(/^\s*--([a-z-]+):\s*(#[0-9a-fA-F]{6});/gm)].map((m) => [m[1] as string, m[2] as string]),
  );

/** `fgBright` → `fg-bright`. The one convention that spans the two files. */
const kebab = (name: string): string => name.replace(/([A-Z])/g, (c) => `-${c.toLowerCase()}`);

/**
 * The artboards are the specification (`docs/design/pyquest/*.dc.html`). These are the values
 * they actually carry, read out of the markup rather than rounded to a grid.
 *
 * **These read `palette` rather than `color`, which is all the CSS-variable conversion changed
 * here.** `color.bg` is `var(--bg)` now; the hex it points at is `palette.bg`, and hex is what
 * an artboard can be compared against.
 */
describe('design tokens are lifted from the artboards', () => {
  it('carries the surface palette verbatim', () => {
    expect(palette.bg).toBe('#12151c');
    expect(palette.fg).toBe('#e8ecf2');
    expect(palette.railBg).toBe('#0d1014');
    expect(palette.panel).toBe('#161a22');
    expect(palette.crumbBar).toBe('#1a1f28');
  });

  it('carries the line palette verbatim', () => {
    expect(palette.border).toBe('#232a35');
    expect(palette.borderStrong).toBe('#333c4a');
    expect(palette.crumbRule).toBe('#3d4757');
  });

  it('carries the green ramp, all four steps', () => {
    expect(palette.accent).toBe('#5aa860');
    expect(palette.accentHover).toBe('#7cc182');
    expect(palette.accentMid).toBe('#3f7844');
    expect(palette.accentDark).toBe('#2d5731');
  });

  it('carries the text ramp and the badge amber', () => {
    expect(palette.muted).toBe('#5d6878');
    expect(palette.secondary).toBe('#98a3b3');
    expect(palette.badge).toBe('#d9a441');
  });

  it('names Archivo Black for display and IBM Plex for the rest', () => {
    expect(font.display).toContain('Archivo Black');
    expect(font.sans).toContain('IBM Plex Sans');
    expect(font.mono).toContain('IBM Plex Mono');
  });

  it('carries the two metrics the shell is built on', () => {
    // The rail is 72px in every one of the nine artboards, and the crumb bar 46px in every
    // artboard that has one. Neither is a round number and neither should become one.
    expect(metric.railWidth).toBe(72);
    expect(metric.crumbBarHeight).toBe(46);
  });
});

describe('the palette and the stylesheet', () => {
  it('finds both files, so a silent miss cannot pass as agreement', () => {
    expect(Object.keys(palette).length).toBeGreaterThan(15);
    expect(Object.keys(declared()).length).toBeGreaterThan(15);
  });

  it('declares every palette colour as a custom property, with the same value', () => {
    const vars = declared();
    const wrong = Object.entries(palette)
      .filter(([name, hex]) => vars[kebab(name)] !== hex)
      .map(([name, hex]) => `--${kebab(name)}: expected ${hex}, css has ${vars[kebab(name)] ?? 'nothing'}`);

    expect(wrong).toEqual([]);
  });

  /**
   * The other direction. A custom property nobody has a token for is a colour a component cannot
   * reference, which means it is either dead or about to be used by a hand-written `var()` that
   * bypasses the palette entirely.
   */
  it('declares no custom property the palette does not have', () => {
    const names = new Set(Object.keys(palette).map(kebab));
    expect(Object.keys(declared()).filter((v) => !names.has(v))).toEqual([]);
  });

  /**
   * `color` is what components render with, and every entry must point at a real property.
   *
   * A typo here — `var(--acent)` — is invisible: CSS resolves an unknown custom property to
   * nothing, the declaration is dropped, and the element inherits whatever its parent had. It
   * does not throw and it does not warn. It just quietly renders the wrong colour.
   */
  it('points every component token at a property that exists', () => {
    const vars = declared();
    const broken = Object.entries(color)
      .map(([name, ref]) => [name, /^var\(--([a-z-]+)\)$/.exec(ref)?.[1]] as const)
      .filter(([, prop]) => prop === undefined || vars[prop] === undefined);

    expect(broken).toEqual([]);
  });

  /**
   * The rule that has now been broken twice, made checkable.
   *
   * `color` resolves through CSS. Anything handed to an API that parses a colour string itself —
   * a canvas context, `parseInt` on hex — needs `palette`, because `var(--bg)` means nothing to
   * it. **Neither failure is loud.** `ctx.fillStyle = 'var(--bg)'` is not an error; the canvas
   * API rejects what it cannot parse and silently keeps the previous value, which on a fresh
   * context is black. `parseInt('var(--accent)', 16)` is `NaN` and paints nothing.
   *
   * Both slipped through the conversion — `MapScreen`'s `shade()` was caught by reading the code,
   * `TurtleCanvas`'s fill was caught by reading it a second time. A third would not be found by
   * reading it a third time, so it is grepped for instead. `gateway/boundary.test.ts` guards its
   * own rule the same way and for the same reason.
   */
  it('keeps component tokens out of canvas contexts, which cannot resolve them', () => {
    const offenders = filesUnder(srcRoot)
      .flatMap((file) => {
        const text = readFileSync(file, 'utf8');
        return [...text.matchAll(/ctx\.\w*(?:Style|Color)\s*=\s*color\.(\w+)/g)].map(
          (m) => `${relative(srcRoot, file)} sets a canvas colour from color.${m[1]} (use palette.${m[1]})`,
        );
      });

    expect(offenders).toEqual([]);
  });

  /**
   * `color-scheme: dark` is the one line that themes the browser's own widgets — the caret,
   * autofill, scrollbars, the focus ring. It is why this file is CSS rather than a component,
   * and deleting it looks harmless right up until an input renders white on a dark page.
   */
  it('keeps color-scheme: dark, which no inline style can express', () => {
    expect(css).toMatch(/color-scheme:\s*dark/);
  });
});
