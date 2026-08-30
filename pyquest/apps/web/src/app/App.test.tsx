import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import { App } from './App';

const at = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );

/**
 * The nine screens of `docs/design/pyquest/`, each at its own address. Six are rail
 * destinations and three are sub-areas reached through a place (§6.8) — a distinction the
 * route shapes carry: a sub-area's path contains the place it belongs to.
 */
describe('routing', () => {
  const RAIL: readonly [string, string][] = [
    ['/map', 'The Campaign'],
    ['/tome', 'Tome'],
    ['/defend', 'Defend'],
    ['/party', 'Party'],
    ['/journal', 'Journal'],
    ['/console', 'Console'],
  ];

  it.each(RAIL)('renders %s', (path, heading) => {
    at(path);
    expect(screen.getByRole('heading', { name: heading, level: 1 })).toBeInTheDocument();
  });

  const SUB: readonly [string, string][] = [
    ['/area/3', 'Collections'],
    ['/area/3/quest/a3-recipe-book', 'The Recipe Book'],
    ['/area/3/boss', 'Boss 3'],
  ];

  it.each(SUB)('renders %s', (path, heading) => {
    at(path);
    expect(screen.getByRole('heading', { name: heading, level: 1 })).toBeInTheDocument();
  });

  /**
   * "Every sub-area carries a breadcrumb, and it is the way back." A sub-area that renders
   * without one is a room with no door — which is the failure §6.8 spends four paragraphs on.
   */
  it.each(SUB)('gives %s a breadcrumb', (path) => {
    at(path);
    expect(screen.getByRole('navigation', { name: /breadcrumb/i })).toBeInTheDocument();
  });

  /** "Rail destinations have no breadcrumb, because they have no ancestor." */
  it.each(RAIL)('gives %s no breadcrumb', (path) => {
    at(path);
    expect(screen.queryByRole('navigation', { name: /breadcrumb/i })).toBeNull();
  });

  /**
   * Phase 1 carried a guard here — `names no area it could only have invented` — that failed if
   * a name the SPA could only have made up reached the screen. It has been replaced rather than
   * deleted: now that the gateway serves real titles, "Collections" on screen is correct, so a
   * rendered-text assertion can no longer tell invention from data.
   *
   * The strict version reads the source instead and forbids any screen from containing an area
   * title at all. It lives in `src/gateway/boundary.test.ts`, beside the other rule about what
   * a screen is not allowed to reach for.
   */
  it('always offers the rail, wherever you are standing', () => {
    at('/area/3/quest/a3-recipe-book');
    expect(screen.getByRole('navigation', { name: 'Overland' })).toBeInTheDocument();
  });
});
