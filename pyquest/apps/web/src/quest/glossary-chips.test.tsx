/**
 * The definitions, on the screen that shows the work.
 *
 * §6.8's argument for putting the Tome on the quest is that "if looking something up costs a
 * learner the code in his editor, he stops looking things up." A concept chip is the smallest
 * version of the same idea: the word is already on the screen, and the meaning should not be a
 * navigation away from it.
 *
 * **The rules the expander is held to are the Tome's rules**, because it is making the same
 * promise. `Tome.test.tsx` states them: no dialog, no scrim, in flow, and what is underneath
 * stays mounted. CLAUDE.md puts it more bluntly — no pop-overs, the thing expands in place and
 * pushes the work down, nothing is covered and nothing is lost.
 */

import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import { describe, expect, it } from 'vitest';
import { AsSignedIn } from '../test-support/session.tsx';
import { QuestScreen } from '../screens/QuestScreen';
import type { WorkerLike } from './useRunner.ts';

const idleWorker = (): WorkerLike => ({
  onmessage: null,
  onerror: null,
  postMessage: () => {},
  terminate: () => {},
});

const renderQuest = async (questId = 'a3-recipe-book') => {
  const result = render(
    <AsSignedIn>
      <MemoryRouter initialEntries={[`/area/3/quest/${questId}`]}>
        <Routes>
          <Route
            path="/area/:areaId/quest/:questId"
            element={<QuestScreen makeWorker={idleWorker} pollMs={0} />}
          />
        </Routes>
      </MemoryRouter>
    </AsSignedIn>,
  );
  await screen.findByRole('button', { name: 'Run' });
  return result;
};

describe('a concept chip opens its definition', () => {
  it('lists the quest concepts as controls, each with its own name', async () => {
    await renderQuest();
    const list = screen.getByRole('list', { name: 'Concepts' });

    // `dict` is one of `a3-recipe-book`'s concepts in the fixtures, and it is defined there.
    const chip = within(list).getByRole('button', { name: 'dict' });
    expect(chip).toHaveAttribute('aria-expanded', 'false');
  });

  it('opens nothing until a chip is pressed', async () => {
    /**
     * The initial state, asserted because "nothing yet" is the state nobody thinks to look at.
     *
     * **What this does not prove is worth writing down.** `ConceptList` guards its lookup with
     * `open === undefined ? undefined : …`, and that guard is *defensive depth, not behavior*:
     * with contract-shaped concepts every `id` is a string, so the unguarded version passes this
     * test too — a seeded mutant removing the guard survived, and it is recorded here rather than
     * quietly forgotten.
     *
     * The guard earns its place against off-contract data, which is not hypothetical: a mocked
     * `QuestView` in `quest-refresh.test.tsx` still carried bare id strings, every `id` was
     * `undefined`, and `undefined === undefined` opened the first chip on the first render of a
     * screen nobody had touched. That payload is fixed. The guard stays because the next stale
     * mock will not announce itself.
     */
    await renderQuest();
    const list = screen.getByRole('list', { name: 'Concepts' });

    for (const chip of within(list).getAllByRole('button')) {
      expect(chip).toHaveAttribute('aria-expanded', 'false');
    }
    expect(screen.queryByText(/mapping from keys to values/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/has no definition written yet/i)).not.toBeInTheDocument();
  });

  it('shows the definition when the chip is pressed, and says so on the control', async () => {
    await renderQuest();
    const chip = within(screen.getByRole('list', { name: 'Concepts' })).getByRole('button', {
      name: 'dict',
    });

    await userEvent.click(chip);

    expect(chip).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText(/mapping from keys to values/i)).toBeInTheDocument();
  });

  it('closes on a second press rather than stacking definitions', async () => {
    // One open at a time. A stack of open definitions is a wall of text where a reference was
    // wanted, and it pushes the editor off the screen — which is §6.8's whole complaint.
    await renderQuest();
    const list = screen.getByRole('list', { name: 'Concepts' });
    const chip = within(list).getByRole('button', { name: 'dict' });

    await userEvent.click(chip);
    await userEvent.click(chip);

    expect(chip).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText(/mapping from keys to values/i)).not.toBeInTheDocument();
  });

  it('opens one and closes the other when a second chip is pressed', async () => {
    await renderQuest();
    const list = screen.getByRole('list', { name: 'Concepts' });

    await userEvent.click(within(list).getByRole('button', { name: 'dict' }));
    await userEvent.click(within(list).getByRole('button', { name: 'iteration' }));

    expect(within(list).getByRole('button', { name: 'dict' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
    expect(screen.queryByText(/mapping from keys to values/i)).not.toBeInTheDocument();
  });

  it('says a word is undefined rather than opening onto nothing', async () => {
    /**
     * §5.1a's honesty rule, the one the tilde on an estimated total keeps: an area authored later
     * has no glossary, and a chip that opened onto an empty box would read as a broken screen
     * rather than as unwritten prose. `iteration` is the fixture's undefined concept.
     */
    await renderQuest();
    const chip = within(screen.getByRole('list', { name: 'Concepts' })).getByRole('button', {
      name: 'iteration',
    });

    await userEvent.click(chip);

    expect(screen.getByText(/has no definition written yet/i)).toBeInTheDocument();
  });

  it('covers nothing: the editor and the brief stay on the screen', async () => {
    /**
     * The no-pop-over rule, asserted rather than described. A dialog would take the editor out of
     * the accessibility tree and a scrim would cover the brief; the definition is meant to push
     * the work down, not to replace it.
     */
    await renderQuest();
    await userEvent.click(
      within(screen.getByRole('list', { name: 'Concepts' })).getByRole('button', { name: 'dict' }),
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Run' })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Python editor' })).toBeInTheDocument();
  });
});

describe('a medal card explains what the medal is', () => {
  it('opens the description from game/medals.md', async () => {
    await renderQuest();
    const medals = screen.getByRole('group', { name: 'Medals' });
    const card = within(medals).getByRole('button', { name: /ironman/i });

    expect(card).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(card);

    expect(card).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText(/without running it until the end/i)).toBeInTheDocument();
  });

  it('leaves a medal it cannot explain as a plain card, not a control that does nothing', async () => {
    /**
     * `conjured` is one of the five cards the screen draws, and the fixture deliberately does not
     * describe it — the state every card is in when `game/` is absent entirely. A card that was focusable
     * and opened nothing would put a stop in a keyboard user's path leading nowhere.
     *
     * **This assertion was vacuous once and a mutant found it.** It named `datamine`, which is not
     * a medal — it is §5.5's review mechanic — so it queried for a card that never renders and
     * passed against a component where *every* card was a control. The lesson is the one
     * CLAUDE.md draws: a check you have not seen fail is worth nothing. Both halves are asserted
     * now, so the card has to be present *and* not a control.
     */
    await renderQuest();
    const medals = screen.getByRole('group', { name: 'Medals' });

    expect(within(medals).getByText('conjured'), 'the card is not drawn at all').toBeInTheDocument();
    expect(within(medals).queryByRole('button', { name: /conjured/i })).not.toBeInTheDocument();
  });
});
