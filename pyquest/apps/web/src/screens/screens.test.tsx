import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AsSignedIn, SIGNED_IN } from '../test-support/session.tsx';
import { MemoryRouter, Route, Routes } from 'react-router';
import { describe, expect, it } from 'vitest';
import { AreaScreen } from './AreaScreen';
import { DefendScreen } from './DefendScreen';
import { MapScreen } from './MapScreen';
import { PartyScreen } from './PartyScreen';

/**
 * Render, then wait for the request to land.
 *
 * Every screen begins in `loading` now, and a `queryBy*` that runs before the data arrives
 * passes for the wrong reason — "no DC warning" is true of a screen that has not drawn a quest
 * list yet. Settling first is what keeps a negative assertion meaningful.
 */
const atArea = async (areaId: string) => {
  const result = render(
    <AsSignedIn>
      <MemoryRouter initialEntries={[`/area/${areaId}`]}>
        <Routes>
          <Route path="/area/:areaId" element={<AreaScreen />} />
        </Routes>
      </MemoryRouter>
    </AsSignedIn>,
  );
  await screen.findByRole('heading', { level: 1 });
  return result;
};

const renderAndSettle = async (node: React.ReactElement) => {
  const result = render(
    <AsSignedIn>
      <MemoryRouter>{node}</MemoryRouter>
    </AsSignedIn>,
  );
  await screen.findByRole('heading', { level: 1 });
  return result;
};

const plain = (node: HTMLElement) => (node.textContent ?? '').replace(/\s+/g, ' ');

/**
 * The presentation rules §5.1 leaves to the UI, asserted where a reader actually meets them.
 * `present.test.ts` proves the functions; these prove the screens call them — a correct rule
 * nobody invokes is the same as no rule.
 */
describe('the Area screen renders the decisions the engine does not make', () => {
  it('marks the estimated denominator with a tilde', async () => {
    const { container } = await atArea('3');
    // Area 3 is `authoring: partial`, so its total is a guess and must not read as a fact.
    expect(plain(container.querySelector('h1')?.parentElement?.parentElement as HTMLElement))
      .toContain('~5');
  });

  it('warns on a quest at DC 20 and leaves DC 18 alone', async () => {
    await atArea('3');
    const risky = screen.getByRole('listitem', { name: /Trading Hall/i });
    expect(within(risky).getByRole('img', { name: /High risk, DC 20/ })).toBeInTheDocument();

    const notRisky = screen.getByRole('listitem', { name: /Enchanter/i });
    expect(within(notRisky).queryByRole('img', { name: /High risk/ })).toBeNull();
  });

  it('shows every medal slot, earned and unearned alike', async () => {
    await atArea('3');
    const row = screen.getByRole('listitem', { name: /Recipe Book/i });

    // Held: cleared. The other four are present and marked not earned, never hidden.
    expect(within(row).getByRole('img', { name: 'cleared: earned' })).toBeInTheDocument();
    expect(within(row).getByRole('img', { name: 'ironman: not earned' })).toBeInTheDocument();
    expect(within(row).getByRole('img', { name: 'teach-back: not earned' })).toBeInTheDocument();
  });

  /**
   * §5.10 wants an unearned slot "greyed rather than absent", and it was greyed past the point of
   * being visible: an 8px `--crumb-rule` diamond on `--panel` is about 1.3:1. Depth he cannot see
   * is depth he does not know exists, which is the rule failing while appearing to be kept — so
   * the outline is pinned here rather than left as a taste that drifts back to a fill.
   */
  it('draws an unearned slot as an outline, not as a fill nobody can see', async () => {
    await atArea('3');
    const row = screen.getByRole('listitem', { name: /Recipe Book/i });
    const pip = (name: string) =>
      within(row).getByRole('img', { name }).querySelector('polygon');

    expect(pip('cleared: earned')?.getAttribute('fill')).toBe('var(--accent)');
    expect(pip('ironman: not earned')?.getAttribute('fill')).toBe('none');
    expect(pip('ironman: not earned')?.getAttribute('stroke')).toBe('var(--muted)');
  });

  /**
   * The list arrived in the order content loaded — which is the order the YAML files sit on
   * disk. Area 0's ten came out alphabetical by accident and read as though it meant something.
   * §5.2 hands the choice of which three to the player; an arbitrary order is not neutrality
   * about that choice, it is noise dressed as one.
   *
   * The fixture is deliberately shuffled (see `fixtures/index.ts`), so this fails if the screen
   * stops sorting. It could not, while the fixture happened to be in DC order already.
   */
  it('lists the quests cheapest first, rather than in whatever order they loaded', async () => {
    const { container } = await atArea('3');
    // `li[aria-label]` rather than every listitem: the concept chips inside each row are list
    // items too, and they are the ones with no label of their own.
    const titles = [...container.querySelectorAll('li[aria-label]')].map(
      (row) => row.getAttribute('aria-label')?.split(',')[0],
    );

    expect(titles).toEqual([
      'The Inventory',
      'The Recipe Book',
      'The Smelter',
      'The Enchanter',
      'The Trading Hall',
    ]);
  });

  it('links an available quest and leaves a locked one unclickable', async () => {
    await atArea('3');
    expect(screen.getByRole('link', { name: 'The Enchanter' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'The Trading Hall' })).toBeNull();
  });

  /**
   * The link used to wrap the title alone, so most of a 50px row — its padding, its concept
   * chips, its DC, its five medal pips — was dead to the click. A row that looks like one target
   * and behaves like a five-word one teaches him that the app is unreliable rather than that he
   * missed.
   *
   * It stays a real anchor rather than a click handler on the `<li>`: middle-click, ctrl-click,
   * Tab and Enter all have to keep working, and none of them is a `click` event.
   */
  it('makes the whole row the link, not just the title', async () => {
    await atArea('3');
    const link = screen.getByRole('link', { name: 'The Enchanter' });

    expect(within(link).getByText('DC 18')).toBeInTheDocument();
    expect(within(link).getByRole('list', { name: /The Enchanter/ })).toBeInTheDocument();
    expect(within(link).getByRole('img', { name: 'ironman: not earned' })).toBeInTheDocument();
    // Its name stays the quest, not the whole row read out as one string.
    expect(link).toHaveAccessibleName('The Enchanter');
  });

  it('says an unauthored area is empty rather than showing nothing', async () => {
    await atArea('5');
    expect(screen.getByText(/Nothing authored here yet/i)).toBeInTheDocument();
  });

  it('refuses an area outside the campaign, as a failed request rather than a blank page', async () => {
    render(
      <AsSignedIn>
        <MemoryRouter initialEntries={['/area/9']}>
          <Routes>
            <Route path="/area/:areaId" element={<AreaScreen />} />
          </Routes>
        </MemoryRouter>
      </AsSignedIn>,
    );

    // The gateway throws rather than inventing an empty area, and the screen says so with the
    // reason attached — he is learning to read errors, and this is one.
    expect(await screen.findByText(/could not load Area 9/i)).toBeInTheDocument();
    expect(screen.getByText(/no area 9 in this campaign/i)).toBeInTheDocument();
  });
});

describe('the Map', () => {
  const renderMap = () => renderAndSettle(<MapScreen />);

  /**
   * The header names the person, not the row.
   *
   * It rendered `view.playerId` — `5eed0000-0000-4000-8000-000000000002` across the top of the
   * Map — which was the honest answer while the SPA had no identity and a uuid was the only thing
   * it knew. `GET /api/me` answers with a display name now, and a database key shown to a child
   * is not a header.
   *
   * The uuid assertion is the half that matters: a regression here would put it back, and a test
   * that only checked for the name would still pass with both on screen.
   */
  it('names who is signed in, rather than printing their uuid', async () => {
    await renderMap();
    expect(screen.getByText(SIGNED_IN.displayName)).toBeInTheDocument();
    expect(screen.queryByText(SIGNED_IN.id)).not.toBeInTheDocument();
  });

  /**
   * The artboard's model: an island **selects** and fills the panel; entering the area is a
   * second, deliberate click. "The quests, the brief and the boss live inside the area — they
   * are things about a place, not places of their own", so the Map lets him look before he goes.
   */
  it('shows all eight areas, locked ones included', async () => {
    await renderMap();
    // §5.3: locked nodes stay visible so `class` sits in view for weeks. Anticipation.
    for (const area of [0, 1, 2, 3, 4, 5, 6, 7]) {
      expect(screen.getByRole('button', { name: new RegExp(`^Area ${area}\\b`) })).toBeInTheDocument();
    }
  });

  /**
   * `area-0.yml` and `area-2.yml` carry a title and no weeks or blurb, so no `AreaIdentity` can
   * be built and the API sends none. Those two islands are numbered and unnamed — which is the
   * honest map, and the one the API will actually send. Inventing a blurb to fill the gap is the
   * mistake the hardcoded name table was removed for.
   */
  it('names the areas content has named, and numbers the two it has not', async () => {
    await renderMap();

    expect(screen.getByRole('button', { name: 'Area 3, Collections' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Area 0' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Area 2' })).toBeInTheDocument();
  });

  it('opens on the area he is standing in, not on area 0', async () => {
    await renderMap();
    // Area 0 is cleared 5 of 5; Area 1 is the first unfinished one.
    expect(screen.getByRole('button', { name: /^Area 1,/ })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Area 0' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('fills the panel from the island you select', async () => {
    await renderMap();
    await userEvent.click(screen.getByRole('button', { name: /^Area 3,/ }));

    const panel = screen.getByRole('complementary', { name: /^Area 3, Collections/ });
    expect(within(panel).getByRole('heading', { name: 'Collections' })).toBeInTheDocument();
    expect(plain(panel)).toContain('Weeks 9–14');
  });

  it('selects by keyboard as well as by pointer', async () => {
    await renderMap();
    const island = screen.getByRole('button', { name: /^Area 7,/ });
    island.focus();
    await userEvent.keyboard('{Enter}');

    expect(island).toHaveAttribute('aria-pressed', 'true');
  });

  it('carries the tilde into the panel', async () => {
    await renderMap();
    await userEvent.click(screen.getByRole('button', { name: /^Area 3,/ }));
    const panel = screen.getByRole('complementary', { name: /^Area 3,/ });

    expect(plain(panel)).toContain('~5');
    expect(plain(panel)).toContain('The tilde is not decoration');
  });

  it('makes entering the area a separate, deliberate click', async () => {
    await renderMap();
    await userEvent.click(screen.getByRole('button', { name: /^Area 3,/ }));

    expect(screen.getByRole('link', { name: 'Enter the area' })).toHaveAttribute('href', '/area/3');
    expect(screen.getByRole('link', { name: 'Read it in the Tome first' })).toHaveAttribute('href', '/tome');
  });

  it('keeps locked areas visible in the legend rather than explaining their absence', async () => {
    await renderMap();
    expect(screen.getByText('locked, still visible')).toBeInTheDocument();
    expect(screen.getByText('you are here')).toBeInTheDocument();
  });

  /**
   * The first version derived `here` as the first unfinished area and locked everything after
   * it — so Area 3 was drawn as a dark locked island while its own label read `3 of ~5`. §361
   * lets him attempt any boss early, so work scattered across areas is supported, and an area
   * he has cleared quests in is observably not locked whatever the drawing says.
   */
  it('never draws an area locked when he has cleared quests in it', async () => {
    await renderMap();
    const LOCKED_FILL = '#2b323d';

    // Areas 2 and 3 both carry cleared quests without being finished.
    for (const area of [2, 3]) {
      const island = screen.getByRole('button', { name: new RegExp(`^Area ${area}\\b`) });
      const fills = [...island.querySelectorAll('polygon')].map((n) => n.getAttribute('fill'));

      expect(fills.length).toBeGreaterThan(0);
      expect(fills).not.toContain(LOCKED_FILL);
    }
  });

  it('still draws an untouched area locked', async () => {
    await renderMap();
    const island = screen.getByRole('button', { name: /^Area 6,/ });
    const fills = [...island.querySelectorAll('polygon')].map((n) => n.getAttribute('fill'));

    expect(fills).toContain('#2b323d');
  });

  /** ADR 0002: nothing derives ahead, behind or on-track from the week ranges. */
  it('passes no judgement on pace', async () => {
    const { container } = await renderMap();
    expect(container.textContent).not.toMatch(/behind|ahead|on track|overdue/i);
  });

  /**
   * The artboard's header reads "· week 10" and "1,260 xp". Neither has a source: the week needs
   * a campaign start date that lives in Postgres and does not exist, and `LevelSchema` carries
   * progress within a level but no cumulative total. Absent beats invented.
   */
  it('shows no campaign week and no cumulative xp, because neither has a source', async () => {
    const { container } = await renderMap();
    expect(container.textContent).not.toMatch(/week \d+ of|1,260/);
  });
});

describe('the Defend queue', () => {
  it('lists what is due and names why each is there', async () => {
    await renderAndSettle(<DefendScreen />);
    const rows = screen.getAllByRole('listitem');

    expect(rows.length).toBeLessThanOrEqual(5); // §5.4 caps a session at five
    expect(plain(rows[0] as HTMLElement)).toContain('ladder');
  });

  it('shows a merged ladder-and-Datamine concept once, saying both', async () => {
    await renderAndSettle(<DefendScreen />);
    // §5.5: one entry, not two — and the row has to say so or the merge looks like a loss.
    const merged = screen.getAllByRole('listitem').filter((r) => plain(r).includes('list'));
    expect(merged).toHaveLength(1);
    expect(plain(merged[0] as HTMLElement)).toContain('ladder + datamine');
  });
});

/**
 * The drill itself — §5.4, and the half that was never wired.
 *
 * `DrillResultSchema` is `{ repelled: boolean }` and `.strict()`, so this is a self-report: the
 * recall happens in his head or out loud, and the screen records which way it went. The artboard
 * draws a prompt per concept, and `DueInvasionSchema` says outright that prompts are content
 * looked up by concept id — content that does not exist yet, so it is not drawn.
 */
describe('answering an invasion', () => {
  const firstRow = () => screen.getAllByRole('listitem')[0] as HTMLElement;

  it('offers both answers, with labels that do not change', async () => {
    await renderAndSettle(<DefendScreen />);

    const row = within(firstRow());
    expect(row.getByRole('button', { name: 'Held it' })).toBeEnabled();
    expect(row.getByRole('button', { name: 'Let it through' })).toBeEnabled();
  });

  /**
   * **The row is answered in place and keeps its position**, which is the decision this test
   * exists to hold. A row that vanished would move the §5.4 count under his cursor and take with
   * it the thing he just earned — and the queue is a session's work, not an inbox to empty.
   */
  it('records the answer in the row rather than removing it', async () => {
    await renderAndSettle(<DefendScreen />);
    const before = screen.getAllByRole('listitem').length;
    const label = plain(firstRow()).slice(0, 20);

    await userEvent.click(within(firstRow()).getByRole('button', { name: 'Held it' }));

    await waitFor(() => {
      expect(within(firstRow()).queryByRole('button', { name: 'Held it' })).toBeNull();
    });
    expect(screen.getAllByRole('listitem')).toHaveLength(before);
    expect(plain(firstRow())).toContain(label);
  });

  /**
   * The engine's numbers, carried rather than recomputed. `nextRung` is called server-side for
   * exactly this reason: `rung + 1` is the same number today and stops being the same number the
   * first time §5.4's ladder is retuned.
   */
  it('shows the rung it landed on and when it comes back', async () => {
    await renderAndSettle(<DefendScreen />);

    await userEvent.click(within(firstRow()).getByRole('button', { name: 'Held it' }));

    await waitFor(() => expect(plain(firstRow())).toMatch(/rung \d+ · back on \d{4}-\d{2}-\d{2}/));
  });

  it('pays a repelled invasion the flat rate §5.1 prices it at', async () => {
    await renderAndSettle(<DefendScreen />);

    await userEvent.click(within(firstRow()).getByRole('button', { name: 'Held it' }));

    await waitFor(() => expect(plain(firstRow())).toContain('repelled · 5 xp'));
  });

  /**
   * A concept let through pays nothing because it was let through. §5.10's zero is a *brag* — an
   * elective medal earned for nothing — and reusing that word here would congratulate him for
   * failing. Same number, opposite claim.
   */
  it('never calls a let-through drill a brag', async () => {
    await renderAndSettle(<DefendScreen />);

    await userEvent.click(within(firstRow()).getByRole('button', { name: 'Let it through' }));

    await waitFor(() => expect(plain(firstRow())).toContain('let through · no xp'));
    expect(plain(firstRow())).not.toContain('brag');
  });

  /**
   * The two buttons send opposite booleans. A test that only pressed one would pass against a
   * screen that sent `true` from both — and the learner would climb the ladder by failing.
   */
  it('sends the opposite answer from each button', async () => {
    await renderAndSettle(<DefendScreen />);
    const rows = screen.getAllByRole('listitem');

    await userEvent.click(within(rows[0] as HTMLElement).getByRole('button', { name: 'Held it' }));
    await userEvent.click(
      within(rows[1] as HTMLElement).getByRole('button', { name: 'Let it through' }),
    );

    await waitFor(() => expect(plain(rows[0] as HTMLElement)).toContain('repelled'));
    expect(plain(rows[1] as HTMLElement)).toContain('let through');
  });
});

describe('the Party board', () => {
  it('is a record, not a race — no rank anywhere', async () => {
    const { container } = await renderAndSettle(<PartyScreen />);
    expect(container.textContent).not.toMatch(/\brank\b|\b1st\b|\bwinner\b|\bleader\b/i);
  });

  it('says why XP provenance is empty rather than showing a blank panel', async () => {
    await renderAndSettle(<PartyScreen />);
    // The endpoint exists and answers `[]` — no engine function computes it, and an API that
    // summed medals would be doing the engine's job. Empty is the truth; silence would not be.
    expect(screen.getByText(/no engine function computes this yet/i)).toBeInTheDocument();
  });
});

/**
 * Every area the Map links to must open. Area 3 is the only one with authored quests, so the
 * other seven exercise the empty path — and the empty path is the one a click actually lands
 * on today.
 */
describe('every area the Map offers can be entered', () => {
  it.each([0, 1, 2, 4, 5, 6, 7])('opens area %i without an authored quest list', async (area) => {
    await atArea(String(area));
    expect(screen.getByRole('navigation', { name: /breadcrumb/i })).toBeInTheDocument();
    expect(screen.getByText(/Nothing authored here yet/i)).toBeInTheDocument();
  });
});
