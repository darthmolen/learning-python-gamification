/**
 * The Tome names the words it counts.
 *
 * The screen whose whole job is the syllabus said `17 concepts` and never said which seventeen.
 * The words are what the curriculum is indexed by — `concepts.ts` is the registry every quest,
 * every glossary entry and every Defend drill is keyed against — and the one screen §6.8 calls
 * "the whole field manual, open" was the screen that did not list them.
 *
 * **The vocabulary sits above the lesson and opens in place.** Above, because an area's concepts
 * are its index and the count is already in the header two lines up; in place, because CLAUDE.md
 * forbids pop-overs and the Quest screen's chips already behave exactly this way. Two screens
 * doing the same job should not have two interactions.
 */

import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import { describe, expect, it } from 'vitest';
import { AsSignedIn } from '../test-support/session.tsx';
import { TomeScreen } from './TomeScreen';

const renderTome = async () => {
  const result = render(
    <AsSignedIn>
      <MemoryRouter initialEntries={['/tome']}>
        <Routes>
          <Route path="/tome" element={<TomeScreen />} />
        </Routes>
      </MemoryRouter>
    </AsSignedIn>,
  );
  await screen.findByRole('heading', { level: 1, name: 'The Tome' });
  return result;
};

/** The rail button for an area, by the name the syllabus shows. */
const openArea = async (name: string) =>
  userEvent.click(within(screen.getByRole('navigation', { name: 'Syllabus' })).getByRole('button', { name: new RegExp(name) }));

describe('the Tome lists an area vocabulary', () => {
  it('names the concepts of the area it opens on', async () => {
    await renderTome();
    const vocabulary = screen.getByRole('list', { name: 'Vocabulary' });

    expect(within(vocabulary).getByRole('button', { name: 'print' })).toBeInTheDocument();
    expect(within(vocabulary).getByRole('button', { name: 'variables' })).toBeInTheDocument();
  });

  it('lists exactly as many terms as the header counts', async () => {
    /**
     * The count and the list must come from one source. They did not: the count was
     * `page?.concepts.length ?? 0` and the list did not exist, so nothing stopped a future
     * refactor from feeding them separately — and a syllabus that says seventeen beside a list of
     * twelve is worse than one that says nothing, because it looks authoritative.
     */
    await renderTome();
    const terms = within(screen.getByRole('list', { name: 'Vocabulary' })).getAllByRole('button');
    const header = screen.getByText(/\d+ concepts · everything below is on the Boss/);

    expect(header).toHaveTextContent(`${terms.length} concepts`);
  });

  it('counts the same number in the rail as it lists in the page', async () => {
    /**
     * The rail prints the count a second time, per area, and it is a *separate render of the same
     * array* — which a mutant proved was unasserted: adding one to the rail's number left the
     * whole suite green. Two numbers for one list is exactly the drift the `syllabus` mapping was
     * changed to prevent, and the prevention is worth nothing unheld.
     */
    await renderTome();
    const terms = within(screen.getByRole('list', { name: 'Vocabulary' })).getAllByRole('button');
    const rail = within(screen.getByRole('navigation', { name: 'Syllabus' })).getByRole('button', {
      current: 'page',
    });

    expect(rail).toHaveTextContent(`${terms.length} concepts`);
  });

  it('opens a definition under the term, leaving the lesson on the screen', async () => {
    await renderTome();
    const term = within(screen.getByRole('list', { name: 'Vocabulary' })).getByRole('button', {
      name: 'print',
    });

    expect(term).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(term);

    expect(term).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText(/puts a value on the screen/i)).toBeInTheDocument();
    // No pop-over: the lesson underneath is pushed down, never covered or unmounted.
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByText(/Three lines and a window opens/)).toBeInTheDocument();
  });

  it('says a word is undefined rather than opening onto nothing', async () => {
    // §5.1a's honesty rule. `iteration` is the fixture's concept with no glossary entry.
    await renderTome();
    await openArea('Collections');

    const term = within(screen.getByRole('list', { name: 'Vocabulary' })).getByRole('button', {
      name: 'iteration',
    });
    await userEvent.click(term);

    expect(screen.getByText(/has no definition written yet/i)).toBeInTheDocument();
  });

  it('changes the list when another area is opened', async () => {
    await renderTome();
    await openArea('Collections');

    const vocabulary = screen.getByRole('list', { name: 'Vocabulary' });
    expect(within(vocabulary).getByRole('button', { name: 'list' })).toBeInTheDocument();
    expect(within(vocabulary).queryByRole('button', { name: 'print' })).not.toBeInTheDocument();
  });

  it('renders no vocabulary block for an area the syllabus does not carry', async () => {
    /**
     * Area 2 is on the campaign and not in the Tome fixture, which is the honest state of an area
     * whose page is not authored. An empty `Vocabulary` heading over nothing would be the screen
     * inventing a section, which is the same mistake `payloads.ts` refuses when it declines to
     * invent a blurb.
     */
    await renderTome();

    /**
     * Both sides, in one test, because one side alone is vacuous — and that was measured rather
     * than guessed. Written as the absence check only, it passed against a screen with no
     * vocabulary block anywhere: a mutant that deleted the whole feature left this test green.
     * Pinning the presence first is what makes the absence mean "not for this area".
     */
    expect(screen.getByRole('list', { name: 'Vocabulary' })).toBeInTheDocument();

    await openArea('Area 2');
    expect(screen.queryByRole('list', { name: 'Vocabulary' })).not.toBeInTheDocument();
  });
});
