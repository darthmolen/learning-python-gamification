import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import { color, metric } from '../design/tokens';
import { rgb } from '../test-support/rgb';
import { Breadcrumbs } from './Breadcrumbs';

const TRAIL = [
  { label: 'Map', to: '/map' },
  { label: 'Area 3 · Collections', to: '/area/3' },
  { label: 'Quests', to: '/area/3#quests' },
] as const;

const renderTrail = () =>
  render(
    <MemoryRouter>
      <Breadcrumbs trail={TRAIL} here="The Recipe Book" />
    </MemoryRouter>,
  );

/**
 * §6.8: "any screen reached through another screen shows the full trail, with every ancestor
 * clickable and the current page plain." The trail is not decoration — it is the only way back,
 * because browser chrome in a single-page app is unreliable and "for an 11-14-year-old is not
 * an answer at all".
 *
 * So these tests assert the target, not just the text. A crumb that renders and goes nowhere
 * is the exact failure the rule was written against, and it looks perfect in a screenshot.
 */
describe('breadcrumbs', () => {
  it('makes every ancestor clickable, and points each at its own screen', () => {
    renderTrail();

    expect(screen.getByRole('link', { name: 'Map' })).toHaveAttribute('href', '/map');
    expect(screen.getByRole('link', { name: 'Area 3 · Collections' })).toHaveAttribute('href', '/area/3');
    expect(screen.getByRole('link', { name: 'Quests' })).toHaveAttribute('href', '/area/3#quests');
  });

  it('leaves the current page plain — it is where you already are', () => {
    renderTrail();

    expect(screen.getByText('The Recipe Book')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'The Recipe Book' })).toBeNull();
  });

  /**
   * "An up-chevron sits at the head of the bar doing the same job as the second-to-last crumb,
   * deliberately: going up one level is the most-used move on these screens and deserves a
   * target he can hit without reading." Same job means same destination — a chevron pointing
   * anywhere else is a different control wearing this one's clothes.
   */
  it('gives the up-chevron the same destination as the last ancestor', () => {
    renderTrail();

    const up = screen.getByRole('link', { name: /up one level/i });
    expect(up).toHaveAttribute('href', '/area/3#quests');
  });

  it('announces itself as a breadcrumb trail', () => {
    renderTrail();
    expect(screen.getByRole('navigation', { name: /breadcrumb/i })).toBeInTheDocument();
  });

  it('is 46px tall and sits on its own bar above the canvas', () => {
    const { container } = renderTrail();
    const bar = container.querySelector('nav');

    expect(bar?.style.height).toBe(`${metric.crumbBarHeight}px`);
    expect(bar?.style.background).toBe(rgb(color.crumbBar));
  });
});
