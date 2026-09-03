import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { AsSignedIn } from '../test-support/session.tsx';
import { JournalScreen } from './JournalScreen';

/**
 * §5.6's Journal, which reads and does not write.
 *
 * ADR 0004 put the prose in his repository and removed `POST /journal` from the contract, so the
 * artboard's draft editor is deliberately not built. What is built instead is what a learner
 * staring at an empty Journal in week 1 needs — the entry to copy, and where to put it.
 */

const renderJournal = async () => {
  const result = render(
    <AsSignedIn>
      <MemoryRouter>
        <JournalScreen />
      </MemoryRouter>
    </AsSignedIn>,
  );
  await screen.findByRole('heading', { level: 1 });
  return result;
};

describe('the entries', () => {
  it('lists what he wrote, newest first', async () => {
    await renderJournal();

    const rows = screen.getAllByRole('listitem');
    expect(rows).toHaveLength(3);
    // The fixture's dates are 2026-08-20, -24 and -27. Newest is the one he is looking for.
    expect(within(rows[0] as HTMLElement).getByRole('button')).toHaveTextContent('2026-08-27');
  });

  it('opens the newest entry without being asked', async () => {
    await renderJournal();

    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('2026-08-27');
    expect(screen.getByText(/did not close/)).toBeInTheDocument();
  });

  it('shows another entry when its row is pressed', async () => {
    await renderJournal();

    await userEvent.click(screen.getByRole('button', { name: /2026-08-24/ }));

    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('2026-08-24');
    expect(screen.getByText(/puts a space between things/)).toBeInTheDocument();
  });

  /**
   * The rows are buttons, not clickable `div`s. That is the difference between a list a keyboard
   * can move through and one it cannot — and the Journal is a screen he is meant to re-read
   * before every boss, so being able to reach an entry matters more here than almost anywhere.
   */
  it('makes every entry reachable by keyboard', async () => {
    await renderJournal();

    const rows = screen.getAllByRole('listitem');
    for (const row of rows) {
      expect(within(row as HTMLElement).getByRole('button')).toBeEnabled();
    }
  });
});

describe('the reply', () => {
  /**
   * `reply` is optional because a reply lands after the entry — always. A screen that could only
   * draw the answered case could not draw the common one.
   */
  it('marks the entries the DM answered, with a name a screen reader can hear', async () => {
    await renderJournal();

    const answered = screen.getByRole('button', { name: /2026-08-27/ });
    expect(within(answered).getByRole('img', { name: 'answered' })).toBeInTheDocument();

    const unanswered = screen.getByRole('button', { name: /2026-08-24/ });
    expect(within(unanswered).queryByRole('img', { name: 'answered' })).toBeNull();
  });

  it('shows the reply beside the entry it answers', async () => {
    await renderJournal();

    expect(screen.getByText(/you wrote 90 because the square worked/)).toBeInTheDocument();
  });

  it('says an unanswered entry is ordinary rather than leaving a blank column', async () => {
    await renderJournal();
    await userEvent.click(screen.getByRole('button', { name: /2026-08-24/ }));

    expect(screen.getByText(/No reply yet/)).toBeInTheDocument();
  });

  /**
   * The artboard says "Dad replied". The lexicon says `dm`, and CLAUDE.md is explicit that
   * `parent` is a word this system spent a spec removing. Roles are not people (§5.11).
   */
  it('names the seat and not a person', async () => {
    const { container } = await renderJournal();

    expect(screen.getByText('DM reply')).toBeInTheDocument();
    expect(container.textContent).not.toMatch(/\bDad\b|\bparent\b/i);
  });
});

/**
 * §5.6 pays ten XP an entry **for substance**, and "empty prompts pay nothing".
 *
 * §5.10's zero is the opposite claim — an elective medal that paid nothing is a brag — so
 * reusing `formatPayout` here would congratulate a child for not writing, on the one screen
 * §5.6 says must never tell somebody who wrote that they wrote nothing.
 */
describe('what an entry paid', () => {
  it('shows the ten XP an entry earns', async () => {
    await renderJournal();

    expect(screen.getByRole('button', { name: /2026-08-27/ })).toHaveTextContent('10 xp');
  });

  it('never renders an entry that paid nothing as a brag', async () => {
    await renderJournal();

    const empty = screen.getByRole('button', { name: /2026-08-20/ });
    expect(empty).not.toHaveTextContent('brag');
    expect(empty).toHaveTextContent(/empty prompts pay nothing/);
  });
});

/**
 * The template panel. **The Tome's rule is the app's rule**: it expands in place and pushes the
 * page down, nothing is covered and nothing is lost.
 */
describe('the entry to copy', () => {
  it('is closed until it is asked for, and expands in place', async () => {
    await renderJournal();

    const button = screen.getByRole('button', { name: /the template/i });
    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText(/Paste it at the/)).toBeNull();

    await userEvent.click(button);

    expect(button).toHaveAttribute('aria-expanded', 'true');
    // No pop-over, no scrim, nothing covering the entry he was reading.
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
  });

  it('keeps its label the same once it is open', async () => {
    await renderJournal();

    const button = screen.getByRole('button', { name: /the template/i });
    const label = button.textContent;

    await userEvent.click(button);

    expect(button.textContent).toBe(label);
  });

  /**
   * The two things `journal.ts` actually parses. A template missing either produces entries the
   * ledger can never join to — he writes, and the game cannot see it.
   */
  it('carries the dated heading and the reply heading the parser looks for', async () => {
    await renderJournal();
    await userEvent.click(screen.getByRole('button', { name: /the template/i }));

    const template = screen.getByText(/## YYYY-MM-DD/);
    expect(template).toBeInTheDocument();
    expect(template.textContent).toContain('### DM reply');
  });

  it('says where it goes, and that the date is copied rather than retyped', async () => {
    await renderJournal();
    await userEvent.click(screen.getByRole('button', { name: /the template/i }));

    expect(screen.getByText(/Paste it at the/)).toBeInTheDocument();
    expect(screen.getByText('journal.md')).toBeInTheDocument();
    expect(screen.getByText(/copy it rather than/i)).toBeInTheDocument();
  });

  /**
   * Which area's template this is. The server picks it from progress, and a heuristic that
   * guesses wrong in silence cannot be corrected by the person reading the screen.
   */
  it('names the area whose template it is showing', async () => {
    await renderJournal();
    await userEvent.click(screen.getByRole('button', { name: /the template/i }));

    await waitFor(() => expect(screen.getByText('Area 0')).toBeInTheDocument());
  });
});

/**
 * **The two resources fail independently, and this is the test that says so.**
 *
 * Only areas 0 and 1 have a `TEMPLATE.md` today, so a learner in Area 3 whose earlier templates
 * were somehow unreachable is not a hypothetical — the template is the call most likely to fail.
 * If it took the screen down with it, a child would lose sight of everything he had written
 * because a coaching file nobody had authored yet could not be fetched.
 */
describe('when the template cannot be fetched', () => {
  it('keeps his entries on screen and confines the failure to the panel', async () => {
    const gateway = await import('../gateway/index.ts');
    const failing = vi
      .spyOn(gateway, 'getJournalTemplate')
      .mockRejectedValue(new Error('/journal/template answered 404'));

    try {
      await renderJournal();

      // His writing is exactly where it was.
      expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('2026-08-27');
      expect(screen.getByText(/did not close/)).toBeInTheDocument();
      expect(screen.queryByText(/could not load your journal/)).toBeNull();

      await userEvent.click(screen.getByRole('button', { name: /the template/i }));

      await waitFor(() => {
        expect(screen.getByText(/authored per area, and this one is not/)).toBeInTheDocument();
      });
    } finally {
      failing.mockRestore();
    }
  });
});
