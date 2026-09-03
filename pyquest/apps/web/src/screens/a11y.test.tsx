import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import { describe, expect, it } from 'vitest';
import type { Account } from '@pyquest/contract';
import { AsSignedIn, SIGNED_IN } from '../test-support/session.tsx';
import { App } from '../app/App';
import { AreaScreen } from './AreaScreen';
import { BossScreen } from './BossScreen';
import { ConsoleScreen } from './ConsoleScreen';
import { DefendScreen } from './DefendScreen';
import { JournalScreen } from './JournalScreen';
import { MapScreen } from './MapScreen';
import { PartyScreen } from './PartyScreen';
import { QuestScreen } from './QuestScreen';
import { TomeScreen } from './TomeScreen';

/**
 * The keyboard-and-names sweep, kept.
 *
 * The plan's criterion is that every screen is operable by keyboard and every control carries an
 * accessible name. That was asserted screen by screen as each was built, which catches the screen
 * being written and not the tenth control added to it six weeks later. This is the standing
 * version: it walks all nine and fails on the first unnamed thing.
 *
 * **It is not a WCAG pass and does not claim to be** — contrast, reflow and motion are a
 * different plan. What it holds is the floor the SPA plan actually named: a control nobody can
 * reach or hear announced is not finished.
 */

/** The DM seat, for the one screen whose second panel only exists for it. */
const DM: Account = { ...SIGNED_IN, roles: ['player', 'dm'] };

const SCREENS: readonly [string, React.ReactElement, string][] = [
  ['Map', <MapScreen />, '/map'],
  ['Tome', <TomeScreen />, '/tome'],
  ['Defend', <DefendScreen />, '/defend'],
  ['Party', <PartyScreen />, '/party'],
  ['Journal', <JournalScreen />, '/journal'],
  ['Console', <ConsoleScreen />, '/console'],
  ['Area', <AreaScreen />, '/area/3'],
  ['Quest', <QuestScreen />, '/area/3/quest/a3-recipe-book'],
  ['Boss', <BossScreen />, '/area/3/boss'],
];

const ROUTE: Readonly<Record<string, string>> = {
  '/area/3': '/area/:areaId',
  '/area/3/quest/a3-recipe-book': '/area/:areaId/quest/:questId',
  '/area/3/boss': '/area/:areaId/boss',
};

const settle = async (node: React.ReactElement, path: string, account = DM) => {
  const result = render(
    <AsSignedIn account={account}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path={ROUTE[path] ?? path} element={node} />
        </Routes>
      </MemoryRouter>
    </AsSignedIn>,
  );
  /* Every screen begins in `loading`, and a screen with no controls yet passes a name check for
   * the wrong reason. Waiting for the heading is what makes the sweep meaningful. */
  await screen.findByRole('heading', { level: 1 });
  return result;
};

const ROLES = ['button', 'link', 'textbox', 'checkbox', 'combobox'] as const;

/**
 * Every control on screen.
 *
 * `hidden: false` is the default and it matters: an element behind `display: none` is not
 * something a user can reach, so requiring it to be named would fail on things nobody meets.
 */
const controls = () => ROLES.flatMap((role) => screen.queryAllByRole(role));

/**
 * The unnamed ones, found by **asking the query for named ones and subtracting**.
 *
 * The first version of this hand-rolled the name — `aria-label`, then `aria-labelledby`, then
 * `textContent` — and that is an approximation of the accessible name computation rather than
 * the thing itself. It has no idea about `<label for>`, `<fieldset><legend>`, `title`, or
 * `alt`, so **it reports correctly-labelled controls as unnamed.**
 *
 * It went unnoticed because nothing in the sweep's nine screens had a `<label for>` control
 * rendered by default — the Console's refusal textarea only appears once a row is open. Adding
 * the Quest screen's Input box exposed it immediately: `quest-screen.test.tsx` finds that
 * textarea *by its accessible name* while this file called it nameless.
 *
 * Testing Library already implements the real algorithm, and `{ name: /\S/ }` is how to make it
 * do the work. A guard whose own idea of the rule is a paraphrase is a guard that fails on
 * exactly the code that got the rule right.
 */
const unnamedControls = () =>
  ROLES.flatMap((role) => {
    const named = new Set(screen.queryAllByRole(role, { name: /\S/ }));
    return screen
      .queryAllByRole(role)
      .filter((el) => !named.has(el))
      .map((el) => `<${el.tagName.toLowerCase()}> with role ${role} and no accessible name`);
  });

describe('every control on every screen has a name', () => {
  it.each(SCREENS)('%s', async (_name, node, path) => {
    await settle(node, path);

    expect(unnamedControls()).toEqual([]);
  });

  /** A sweep that found nothing to check would pass forever. Prove it can see the controls. */
  it('is actually looking at controls, not at an empty page', async () => {
    await settle(<MapScreen />, '/map');
    expect(controls().length).toBeGreaterThan(8);
  });
});

/**
 * Six rail destinations precede the content on every one of the nine screens. Tabbing past them
 * on every navigation is the thing that makes a keyboard user stop using a keyboard, so the first
 * stop is a way past them.
 */
describe('the skip link', () => {
  it('is the first thing a keyboard reaches, and it points at the main landmark', async () => {
    render(
      <AsSignedIn>
        <MemoryRouter initialEntries={['/map']}>
          <App />
        </MemoryRouter>
      </AsSignedIn>,
    );
    await screen.findByRole('heading', { level: 1 });

    await userEvent.tab();

    const skip = screen.getByRole('link', { name: 'Skip to content' });
    expect(skip).toHaveFocus();
    expect(skip).toHaveAttribute('href', '#main');
    // The target has to exist, or the link is a promise to nowhere.
    expect(document.getElementById('main')).not.toBeNull();
  });

  /**
   * Off-screen rather than `display: none`. A hidden element is not focusable, and an
   * unfocusable skip link is decoration — this is the assertion that keeps the trick honest.
   */
  it('comes into view when it is focused, and only then', async () => {
    render(
      <AsSignedIn>
        <MemoryRouter initialEntries={['/map']}>
          <App />
        </MemoryRouter>
      </AsSignedIn>,
    );
    await screen.findByRole('heading', { level: 1 });

    const skip = screen.getByRole('link', { name: 'Skip to content' });
    expect(skip.style.left).toBe('-9999px');

    await userEvent.tab();
    await waitFor(() => expect(skip.style.left).toBe('8px'));
  });
});

/**
 * The editor is a keyboard trap by design, and the escape hatch has to be **discoverable**.
 *
 * Python is whitespace-significant, so Tab indents rather than moving on — a considered trade
 * `Editor.tsx` argues for. What was not considered, until this sweep ran on 2026-09-01, is that
 * the hatch this repository claimed ("Escape then Tab — CodeMirror's own behaviour") **does not
 * exist**. That is Monaco's behaviour. CodeMirror binds Escape to `simplifySelection`; its real
 * hatch is Ctrl-m, which nothing on screen mentioned. Run, Stop and Submit all follow the editor
 * in the tab order, so a learner who tabbed in could not reach the button that submits his work.
 *
 * Escape is now bound to `temporarilySetTabFocusMode` and the screen says so.
 *
 * **What is asserted here is the sentence, not the key**, and that is a limitation worth stating
 * rather than papering over: jsdom cannot express tab-focus mode. Releasing Tab depends on the
 * browser's own focus move once CodeMirror declines to consume the key, and jsdom does not model
 * it — CodeMirror's *own* Ctrl-m fails identically under this runner, which is how we know it is
 * the environment and not the binding. A test asserting the release would pass or fail for
 * reasons unrelated to the behaviour, which is worth less than no test.
 *
 * So the key itself is verified by a person in a real browser:
 * `planning/reminders/follow-up_editor-escape-hatch-in-a-browser_2026-09-01.md`.
 */
describe('the editor, which is deliberately a keyboard trap', () => {
  it('tells the reader how to get out of it', async () => {
    await settle(<QuestScreen />, '/area/3/quest/a3-recipe-book');

    // An escape hatch nobody is told about is the same as no escape hatch.
    expect(screen.getByText(/Press Escape, then Tab, to move on/)).toBeInTheDocument();
  });

  it('puts the editor before the buttons it must not swallow', async () => {
    const { container } = await settle(<QuestScreen />, '/area/3/quest/a3-recipe-book');

    // The reason the trap matters at all: these are downstream of it in the tab order, so a
    // trapped keyboard cannot reach them. If they ever move above the editor, the hatch stops
    // being load-bearing and this test should be revisited rather than deleted.
    const content = container.querySelector('.cm-content') as HTMLElement;
    const submit = screen.getByRole('button', { name: 'Submit' });
    expect(content.compareDocumentPosition(submit) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
