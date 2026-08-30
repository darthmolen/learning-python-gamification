import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import { color, metric } from '../design/tokens';
import { rgb } from '../test-support/rgb';
import { Rail } from './Rail';

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Rail />
    </MemoryRouter>,
  );

/**
 * §6.8: six rail destinations, "true wherever you are standing, so they are always one click
 * away and never nested". The count is load-bearing — a seventh would mean something was
 * promoted out of a place it belongs to, and a fifth would mean something is unreachable.
 */
describe('the rail', () => {
  it('offers exactly the six overland destinations, in artboard order', () => {
    renderAt('/map');
    const names = screen.getAllByRole('link').map((a) => a.textContent);
    expect(names).toEqual(['Map', 'Tome', 'Defend', 'Party', 'Journal', 'Console']);
  });

  it('points each destination at its own route', () => {
    renderAt('/map');
    const href = (name: string) =>
      screen.getByRole('link', { name }).getAttribute('href');

    expect(href('Map')).toBe('/map');
    expect(href('Tome')).toBe('/tome');
    expect(href('Defend')).toBe('/defend');
    expect(href('Party')).toBe('/party');
    expect(href('Journal')).toBe('/journal');
    expect(href('Console')).toBe('/console');
  });

  it('marks where you are standing, and only there', () => {
    renderAt('/defend');
    expect(screen.getByRole('link', { name: 'Defend' })).toHaveAttribute('aria-current', 'page');

    for (const name of ['Map', 'Tome', 'Party', 'Journal', 'Console']) {
      expect(screen.getByRole('link', { name })).not.toHaveAttribute('aria-current');
    }
  });

  /**
   * "Labels never change with state" (CLAUDE.md). The rail is where that rule is easiest to
   * break — an active destination is a tempting place to write "You are here" — and it is the
   * rule that made "Take it cold" false on a screen showing three quests cleared.
   */
  it('reads the same whether or not you are standing on it', () => {
    renderAt('/map');
    const active = screen.getByRole('link', { name: 'Map' }).textContent;

    renderAt('/journal');
    const inactive = screen.getAllByRole('link', { name: 'Map' })[0]?.textContent;

    expect(active).toBe('Map');
    expect(inactive).toBe('Map');
  });

  it('is 72px wide and darker than the canvas it sits beside', () => {
    const { container } = renderAt('/map');
    const rail = container.querySelector('nav');

    expect(rail).not.toBeNull();
    expect(rail?.style.width).toBe(`${metric.railWidth}px`);
    // jsdom normalises an inline colour to `rgb()`, so the token is converted rather than
    // the assertion loosened — a wrong colour still fails.
    expect(rail?.style.background).toBe(rgb(color.railBg));
  });

  /**
   * The badge is a count, and a count of zero is not a quiet badge — it is no badge. An
   * always-rendered badge showing "0" tells an 11-14-year-old he has work waiting when he
   * does not.
   */
  it('badges a destination that has a count, and leaves the rest bare', () => {
    render(
      <MemoryRouter initialEntries={['/map']}>
        <Rail counts={{ defend: 4, console: 2 }} />
      </MemoryRouter>,
    );

    expect(within(screen.getByRole('link', { name: /Defend/ })).getByText('4')).toBeInTheDocument();
    expect(within(screen.getByRole('link', { name: /Console/ })).getByText('2')).toBeInTheDocument();
    expect(within(screen.getByRole('link', { name: /Journal/ })).queryByText('0')).toBeNull();
  });

  it('renders no badge for a zero count', () => {
    render(
      <MemoryRouter initialEntries={['/map']}>
        <Rail counts={{ defend: 0 }} />
      </MemoryRouter>,
    );

    expect(within(screen.getByRole('link', { name: /Defend/ })).queryByText('0')).toBeNull();
  });
});
