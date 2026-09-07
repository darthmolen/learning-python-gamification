/**
 * The practice spine on the Area screen.
 *
 * The screen's quest list is deliberately unordered — §5.2 gives any three of five and
 * `a1-the-sigil.yml` refuses `requires` so the choice stays the learner's. The consequence
 * nobody noticed was that the screen then showed *no* order at all, because the only sequence
 * in the curriculum lived in session plans the learner never opens. These tests hold the panel
 * that fixes it, and the two properties it must not lose.
 */

import { render, screen, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { describe, expect, it } from 'vitest';
import { AreaScreen } from './AreaScreen';
import { SessionProvider } from '../session/SessionProvider.tsx';

const renderArea = () =>
  render(
    <SessionProvider>
      <MemoryRouter initialEntries={['/area/3']}>
        <Routes>
          <Route path="/area/:areaId" element={<AreaScreen />} />
        </Routes>
      </MemoryRouter>
    </SessionProvider>,
  );

const spine = async () => {
  renderArea();
  return await screen.findByRole('complementary', { name: 'Practices' });
};

describe('the practice spine', () => {
  it('lists every practice in order, including the ones carrying no quest', async () => {
    const panel = await spine();
    const titles = within(panel)
      .getAllByRole('checkbox')
      .map((box) => box.getAttribute('aria-label'));

    expect(titles).toEqual([
      'Practice 1, The Row Of Blocks',
      'Practice 2, The Inventory',
      'Practice 3, It Changes',
      'Practice 4, The Recipe Book',
      'Practice 5, The Enchanter',
    ]);
  });

  /**
   * The line this whole panel exists for.
   *
   * A learner who plays only what the app scores is skipping work, and until now nothing told
   * him so. Practices 1 and 3 of the fixture carry no quest deliberately — a stub where every
   * practice had one could not tell this screen from the one that confused him.
   */
  it('says when a practice is worked at the table rather than leaving it blank', async () => {
    const panel = await spine();
    // Scoped to the rows. The footer explains the phrase as well, and counting that would make
    // this assertion pass on a legend with no rows under it.
    const rows = within(panel).getByRole('list');
    expect(within(rows).getAllByText('worked at the table')).toHaveLength(2);
  });

  it('counts quests where there are quests, singular and plural alike', async () => {
    const panel = await spine();
    const rows = within(panel).getByRole('list');
    expect(within(rows).getAllByText('1 quest')).toHaveLength(2);
    expect(within(rows).getAllByText('2 quests')).toHaveLength(1);
  });

  /** §5.1a: cleared of total, never a bare number. */
  it('shows how many are done against how many there are', async () => {
    const panel = await spine();
    expect(within(panel).getByText('2 of 5')).toBeInTheDocument();
  });

  /**
   * **Nothing here gates anything**, and this is the assertion that keeps it that way.
   *
   * A checklist screen's first instinct is to make the next row conditional on the last, and
   * §5.2, ADR 0002 and the Tome's "every page is open from day one" all refuse it. Practice 3
   * is unticked and practices 4 and 5 come after it; all three must be reachable and none
   * disabled.
   */
  it('disables nothing, whatever is ticked', async () => {
    const panel = await spine();
    for (const box of within(panel).getAllByRole('checkbox')) {
      expect(box).not.toBeDisabled();
    }
  });

  /**
   * ADR 0002's amendment: a manifest may carry any value the spec states and must not carry one
   * it does not. Per-practice weeks do not exist in the content, so none may appear here — and
   * ADR 0006's whole argument is that a date beside a unit of work tells a slower learner he is
   * behind. The area's range stays on the crumb bar, where the game is allowed to say it.
   */
  it('puts no week or date on a practice', async () => {
    const panel = await spine();
    expect(panel.textContent ?? '').not.toMatch(/week/i);
    expect(panel.textContent ?? '').not.toMatch(/\b20\d\d\b/);
  });
});
