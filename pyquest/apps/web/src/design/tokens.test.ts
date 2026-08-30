import { describe, expect, it } from 'vitest';
import { color, font, metric } from './tokens';

/**
 * The artboards are the specification (`docs/design/pyquest/*.dc.html`). These are the values
 * they actually carry, read out of the markup rather than rounded to a grid or replaced with a
 * framework's nearest equivalent. A palette that drifts toward Tailwind's defaults is the
 * failure this file exists to catch.
 */
describe('design tokens are lifted from the artboards', () => {
  it('carries the surface palette verbatim', () => {
    expect(color.bg).toBe('#12151c');
    expect(color.fg).toBe('#e8ecf2');
    expect(color.railBg).toBe('#0d1014');
    expect(color.panel).toBe('#161a22');
    expect(color.crumbBar).toBe('#1a1f28');
  });

  it('carries the line palette verbatim', () => {
    expect(color.border).toBe('#232a35');
    expect(color.borderStrong).toBe('#333c4a');
    expect(color.crumbRule).toBe('#3d4757');
  });

  it('carries the green ramp, all four steps', () => {
    expect(color.accent).toBe('#5aa860');
    expect(color.accentHover).toBe('#7cc182');
    expect(color.accentMid).toBe('#3f7844');
    expect(color.accentDark).toBe('#2d5731');
  });

  it('carries the text ramp and the badge amber', () => {
    expect(color.muted).toBe('#5d6878');
    expect(color.secondary).toBe('#98a3b3');
    expect(color.badge).toBe('#d9a441');
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
