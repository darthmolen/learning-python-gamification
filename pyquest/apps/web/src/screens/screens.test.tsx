import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import { describe, expect, it } from 'vitest';
import { AreaScreen } from './AreaScreen';
import { DefendScreen } from './DefendScreen';
import { MapScreen } from './MapScreen';
import { PartyScreen } from './PartyScreen';

const atArea = (areaId: string) =>
  render(
    <MemoryRouter initialEntries={[`/area/${areaId}`]}>
      <Routes>
        <Route path="/area/:areaId" element={<AreaScreen />} />
      </Routes>
    </MemoryRouter>,
  );

const plain = (node: HTMLElement) => (node.textContent ?? '').replace(/\s+/g, ' ');

/**
 * The presentation rules §5.1 leaves to the UI, asserted where a reader actually meets them.
 * `present.test.ts` proves the functions; these prove the screens call them — a correct rule
 * nobody invokes is the same as no rule.
 */
describe('the Area screen renders the decisions the engine does not make', () => {
  it('marks the estimated denominator with a tilde', () => {
    const { container } = atArea('3');
    // Area 3 is `authoring: partial`, so its total is a guess and must not read as a fact.
    expect(plain(container.querySelector('h1')?.parentElement?.parentElement as HTMLElement))
      .toContain('~5');
  });

  it('warns on a quest at DC 20 and leaves DC 18 alone', () => {
    atArea('3');
    const risky = screen.getByRole('listitem', { name: /Trading Hall/i });
    expect(within(risky).getByRole('img', { name: /High risk, DC 20/ })).toBeInTheDocument();

    const notRisky = screen.getByRole('listitem', { name: /Enchanter/i });
    expect(within(notRisky).queryByRole('img', { name: /High risk/ })).toBeNull();
  });

  it('shows every medal slot, earned and unearned alike', () => {
    atArea('3');
    const row = screen.getByRole('listitem', { name: /Recipe Book/i });

    // Held: cleared. The other four are present and marked not earned, never hidden.
    expect(within(row).getByRole('img', { name: 'cleared: earned' })).toBeInTheDocument();
    expect(within(row).getByRole('img', { name: 'ironman: not earned' })).toBeInTheDocument();
    expect(within(row).getByRole('img', { name: 'teach-back: not earned' })).toBeInTheDocument();
  });

  it('links an available quest and leaves a locked one unclickable', () => {
    atArea('3');
    expect(screen.getByRole('link', { name: 'The Enchanter' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'The Trading Hall' })).toBeNull();
  });

  it('says an unauthored area is empty rather than showing nothing', () => {
    atArea('5');
    expect(screen.getByText(/Nothing authored here yet/i)).toBeInTheDocument();
  });

  it('refuses an area outside the campaign', () => {
    atArea('9');
    expect(screen.getByText(/Not a place in this campaign/i)).toBeInTheDocument();
  });
});

describe('the Map', () => {
  const renderMap = () =>
    render(
      <MemoryRouter>
        <MapScreen />
      </MemoryRouter>,
    );

  /**
   * The artboard's model: an island **selects** and fills the panel; entering the area is a
   * second, deliberate click. "The quests, the brief and the boss live inside the area — they
   * are things about a place, not places of their own", so the Map lets him look before he goes.
   */
  it('shows all eight areas, locked ones included', () => {
    renderMap();
    // §5.3: locked nodes stay visible so `class` sits in view for weeks. Anticipation.
    for (const area of [0, 1, 2, 3, 4, 5, 6, 7]) {
      expect(screen.getByRole('button', { name: new RegExp(`^Area ${area},`) })).toBeInTheDocument();
    }
  });

  it('opens on the area he is standing in, not on area 0', () => {
    renderMap();
    // Area 0 is cleared 5 of 5; Area 1 is the first unfinished one.
    expect(screen.getByRole('button', { name: /^Area 1,/ })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: /^Area 0,/ })).toHaveAttribute('aria-pressed', 'false');
  });

  it('fills the panel from the island you select', async () => {
    renderMap();
    await userEvent.click(screen.getByRole('button', { name: /^Area 3,/ }));

    const panel = screen.getByRole('complementary', { name: /^Area 3, Collections/ });
    expect(within(panel).getByRole('heading', { name: 'Collections' })).toBeInTheDocument();
    expect(plain(panel)).toContain('Weeks 9–14');
  });

  it('selects by keyboard as well as by pointer', async () => {
    renderMap();
    const island = screen.getByRole('button', { name: /^Area 7,/ });
    island.focus();
    await userEvent.keyboard('{Enter}');

    expect(island).toHaveAttribute('aria-pressed', 'true');
  });

  it('carries the tilde into the panel', async () => {
    renderMap();
    await userEvent.click(screen.getByRole('button', { name: /^Area 3,/ }));
    const panel = screen.getByRole('complementary', { name: /^Area 3,/ });

    expect(plain(panel)).toContain('~5');
    expect(plain(panel)).toContain('The tilde is not decoration');
  });

  it('makes entering the area a separate, deliberate click', async () => {
    renderMap();
    await userEvent.click(screen.getByRole('button', { name: /^Area 3,/ }));

    expect(screen.getByRole('link', { name: 'Enter the area' })).toHaveAttribute('href', '/area/3');
    expect(screen.getByRole('link', { name: 'Read it in the Tome first' })).toHaveAttribute('href', '/tome');
  });

  it('keeps locked areas visible in the legend rather than explaining their absence', () => {
    renderMap();
    expect(screen.getByText('locked, still visible')).toBeInTheDocument();
    expect(screen.getByText('you are here')).toBeInTheDocument();
  });

  /**
   * The first version derived `here` as the first unfinished area and locked everything after
   * it — so Area 3 was drawn as a dark locked island while its own label read `3 of ~5`. §361
   * lets him attempt any boss early, so work scattered across areas is supported, and an area
   * he has cleared quests in is observably not locked whatever the drawing says.
   */
  it('never draws an area locked when he has cleared quests in it', () => {
    renderMap();
    const LOCKED_FILL = '#2b323d';

    // Areas 2 and 3 both carry cleared quests without being finished.
    for (const area of [2, 3]) {
      const island = screen.getByRole('button', { name: new RegExp(`^Area ${area},`) });
      const fills = [...island.querySelectorAll('polygon')].map((n) => n.getAttribute('fill'));

      expect(fills.length).toBeGreaterThan(0);
      expect(fills).not.toContain(LOCKED_FILL);
    }
  });

  it('still draws an untouched area locked', () => {
    renderMap();
    const island = screen.getByRole('button', { name: /^Area 6,/ });
    const fills = [...island.querySelectorAll('polygon')].map((n) => n.getAttribute('fill'));

    expect(fills).toContain('#2b323d');
  });

  /** ADR 0002: nothing derives ahead, behind or on-track from the week ranges. */
  it('passes no judgement on pace', () => {
    const { container } = renderMap();
    expect(container.textContent).not.toMatch(/behind|ahead|on track|overdue/i);
  });

  /**
   * The artboard's header reads "· week 10" and "1,260 xp". Neither has a source: the week needs
   * a campaign start date that lives in Postgres and does not exist, and `LevelSchema` carries
   * progress within a level but no cumulative total. Absent beats invented.
   */
  it('shows no campaign week and no cumulative xp, because neither has a source', () => {
    const { container } = renderMap();
    expect(container.textContent).not.toMatch(/week \d+ of|1,260/);
  });
});

describe('the Defend queue', () => {
  it('lists what is due and names why each is there', () => {
    render(<MemoryRouter><DefendScreen /></MemoryRouter>);
    const rows = screen.getAllByRole('listitem');

    expect(rows.length).toBeLessThanOrEqual(5); // §5.4 caps a session at five
    expect(plain(rows[0] as HTMLElement)).toContain('ladder');
  });

  it('shows a merged ladder-and-Datamine concept once, saying both', () => {
    render(<MemoryRouter><DefendScreen /></MemoryRouter>);
    // §5.5: one entry, not two — and the row has to say so or the merge looks like a loss.
    const merged = screen.getAllByRole('listitem').filter((r) => plain(r).includes('list'));
    expect(merged).toHaveLength(1);
    expect(plain(merged[0] as HTMLElement)).toContain('ladder + datamine');
  });
});

describe('the Party board', () => {
  it('is a record, not a race — no rank anywhere', () => {
    const { container } = render(<MemoryRouter><PartyScreen /></MemoryRouter>);
    expect(container.textContent).not.toMatch(/\brank\b|\b1st\b|\bwinner\b|\bleader\b/i);
  });

  it('says outright that XP provenance is stubbed', () => {
    render(<MemoryRouter><PartyScreen /></MemoryRouter>);
    // The one surface with no endpoint behind it. Better said on the screen than discovered.
    expect(screen.getByText(/no endpoint implements this yet/i)).toBeInTheDocument();
  });
});

/**
 * Every area the Map links to must open. Area 3 is the only one with authored quests, so the
 * other seven exercise the empty path — and the empty path is the one a click actually lands
 * on today.
 */
describe('every area the Map offers can be entered', () => {
  it.each([0, 1, 2, 4, 5, 6, 7])('opens area %i without an authored quest list', (area) => {
    atArea(String(area));
    expect(screen.getByRole('navigation', { name: /breadcrumb/i })).toBeInTheDocument();
    expect(screen.getByText(/Nothing authored here yet/i)).toBeInTheDocument();
  });
});
