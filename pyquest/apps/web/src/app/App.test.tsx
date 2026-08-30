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
    ['/area/3', 'Area 3'],
    ['/area/3/quest/a3-recipe-book', 'a3-recipe-book'],
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
   * Content lives in git and reaches the app through the contract (CLAUDE.md's diagram). A
   * title the SPA can produce on its own is a title the SPA invented, and it goes stale
   * silently the moment the curriculum is edited — which is the whole failure mode.
   *
   * Phase 1 shipped an `AREA_NAMES` table that duplicated `content/areas/*.yml` for the three
   * authored areas and made up names for the five that do not exist yet. This test is the
   * guard that replaced it. It stays until the gateway serves area manifests, and then it
   * gets stricter, not deleted.
   */
  it('names no area it could only have invented', () => {
    at('/area/3');
    expect(screen.queryByText(/Collections/)).toBeNull();

    at('/area/0');
    expect(screen.queryByText(/First Light/)).toBeNull();
  });

  it('always offers the rail, wherever you are standing', () => {
    at('/area/3/quest/a3-recipe-book');
    expect(screen.getByRole('navigation', { name: 'Overland' })).toBeInTheDocument();
  });
});
