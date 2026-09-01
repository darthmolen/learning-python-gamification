/**
 * Stub payloads, shaped exactly like the endpoints they stand in for.
 *
 * These are what the gateway answers with when no `VITE_API_URL` is set, which is how the app
 * runs with no stack behind it and how the test gate stays hermetic. They are **not** a mock
 * layer: every one goes through the same `.parse()` a real response does, so a fixture that
 * drifts from the contract fails a test instead of rendering.
 *
 * Typed `unknown` on purpose. Annotating them as contract types would satisfy the compiler while
 * hiding the rules that matter — `.min(1)`, the §5.4 cap, one entry per area — because those
 * live in the schemas and only run when something parses.
 *
 * **Nothing here invents content.** An earlier version gave areas 0 and 2 a blurb, which was the
 * same mistake as the `AREA_NAMES` table it replaced: `area-0.yml` and `area-2.yml` carry a title
 * and no `weeks` or `blurb`, so on the wire they have no `identity` at all. The map with two
 * unlabelled areas is the honest one, and it is also the one the API will actually send.
 */

/**
 * Who the fixtures are about.
 *
 * **These moved here from `household.ts`, which is now deleted.** That module existed because the
 * app had to name a player before it could ask who it was, and every request was made as a
 * constant compiled into the build. `GET /api/me` replaced it: against a live api the player comes
 * from the token, and no uuid is compiled into anything.
 *
 * They survive *here* because fixture data has to be about somebody. The plan's criterion is that
 * no uuid literal lives in `apps/web` outside the fixtures, and this is inside them.
 *
 * The values are `packages/db/src/seed.ts`'s, so the offline app and a seeded database describe
 * the same household — which is what makes switching `VITE_API_URL` on and off a change of source
 * rather than a change of story.
 */
export const PLAYER_ID = '5eed0000-0000-4000-8000-000000000001';
export const DM_ID = '5eed0000-0000-4000-8000-000000000002';

const identity = (area: number, title: string, from: number, to: number, blurb: string) => ({
  area,
  title,
  weeks: { from, to },
  blurb,
});

/** Per-area state. Areas 0 and 2 have no `identity` key, because their manifests have no fields for one. */
const AREA_CARDS = [
  { area: 0, progress: { cleared: 5, total: 5, estimated: true }, boss: { cleared: 5, required: 3, unlocked: true } },
  {
    area: 1,
    identity: identity(1, 'Control', 3, 6, 'Loops and conditions, and the shapes they draw.'),
    progress: { cleared: 3, total: 5, estimated: true },
    boss: { cleared: 3, required: 3, unlocked: true },
  },
  { area: 2, progress: { cleared: 1, total: 5, estimated: true }, boss: { cleared: 1, required: 3, unlocked: false } },
  {
    area: 3,
    identity: identity(3, 'Collections', 9, 14, 'Minecraft data. Inventories are lists. Recipes are dicts.'),
    progress: { cleared: 3, total: 5, estimated: true },
    boss: { cleared: 3, required: 3, unlocked: true },
  },
  {
    area: 4,
    identity: identity(4, 'Functions and Decomposition', 15, 20, 'Naming a thing is how you stop repeating it.'),
    progress: { cleared: 0, total: 5, estimated: true },
    boss: { cleared: 0, required: 3, unlocked: false },
  },
  {
    area: 5,
    identity: identity(5, 'State and Objects', 21, 28, 'Modeling a world. Block, Player and Inventory hold their own state.'),
    progress: { cleared: 0, total: 5, estimated: true },
    boss: { cleared: 0, required: 3, unlocked: false },
  },
  {
    area: 6,
    identity: identity(6, 'Data and the Outside World', 29, 36, 'Files, APIs, and data that did not come from you.'),
    progress: { cleared: 0, total: 5, estimated: true },
    boss: { cleared: 0, required: 3, unlocked: false },
  },
  {
    area: 7,
    identity: identity(7, 'Craft', 37, 48, 'Tests, review, and code somebody else can read.'),
    progress: { cleared: 0, total: 5, estimated: true },
    boss: { cleared: 0, required: 3, unlocked: false },
  },
];

/** What `GET /api/me` answers offline: the peer seat, holding both roles as §5.11 has it. */
export const me: unknown = {
  id: PLAYER_ID,
  handle: 'peer',
  displayName: 'The Peer',
  roles: ['player', 'dm'],
};

export const campaign: unknown = { playerId: PLAYER_ID, areas: AREA_CARDS };

/** The Area screen's cards. Ids and concepts are real — they exist in `content/`. */
const QUESTS: Readonly<Record<number, unknown[]>> = {
  3: [
    { id: 'a3-inventory-lists', title: 'The Inventory', dc: 10, concepts: ['list', 'iteration'], medals: ['cleared', 'idiomatic'], status: 'cleared' },
    { id: 'a3-recipe-book', title: 'The Recipe Book', dc: 12, concepts: ['dict', 'dict-methods', 'iteration'], medals: ['cleared'], status: 'cleared' },
    { id: 'a3-the-smelter', title: 'The Smelter', dc: 14, concepts: ['dict', 'iteration'], medals: ['cleared'], status: 'cleared' },
    { id: 'a3-the-enchanter', title: 'The Enchanter', dc: 18, concepts: ['dict-methods', 'list'], medals: [], status: 'available' },
    { id: 'a3-the-trading-hall', title: 'The Trading Hall', dc: 20, concepts: ['dict', 'list', 'iteration'], medals: [], status: 'locked' },
  ],
};

export const areaView = (area: number): unknown => {
  const card = AREA_CARDS.find((c) => c.area === area);
  if (card === undefined) throw new Error(`no area ${area} in this campaign`);

  return { ...card, playerId: PLAYER_ID, quests: QUESTS[area] ?? [] };
};

const STARTER = `import turtle

# Draw a square.
for side in range(4):
    turtle.forward(100)
    turtle.right(90)

turtle.done()
`;

export const questView = (questId: string): unknown => {
  const card = (QUESTS[3] as { id: string; title: string; dc: number; concepts: string[]; medals: string[]; status: string }[])
    .find((q) => q.id === questId);
  if (card === undefined) throw new Error(`no quest ${questId}`);

  return {
    id: card.id,
    title: card.title,
    kind: 'quest',
    area: 3,
    dc: card.dc,
    concepts: card.concepts,
    requires: [],
    status: card.status,
    brief: `# ${card.title}\n\nThe brief is authored markdown, read from the content root.\n`,
    medalsHeld: card.medals,
    // §5.10: every slot the quest offers, and what each would pay from here. Zero is legal.
    medalSlots: [
      { medal: 'cleared', effectiveDC: card.dc, xp: 40 },
      { medal: 'ironman', effectiveDC: card.dc + 2, xp: 20 },
      { medal: 'idiomatic', effectiveDC: card.dc + 2, xp: 20 },
      { medal: 'teach-back', effectiveDC: card.dc, xp: 15 },
      { medal: 'conjured', effectiveDC: card.dc, xp: 0 },
    ],
    verifier: { type: 'hidden-tests' },
    starter: STARTER,
  };
};

/** §5.4 caps a session at five, and §5.5 merges a ladder-and-Datamine concept into one entry. */
export const dueInvasions: unknown = [
  { conceptId: 'dict', area: 3, lastSeen: '2026-08-22', overdueDays: 3, source: 'ladder' },
  { conceptId: 'list', area: 3, lastSeen: '2026-08-20', overdueDays: 5, source: 'both' },
  { conceptId: 'f-strings', area: 0, lastSeen: '2026-08-18', overdueDays: 2, source: 'datamine' },
  { conceptId: 'iteration', area: 1, lastSeen: '2026-08-25', overdueDays: 0, source: 'ladder' },
];

/**
 * §5.8: a record, not a race. No rank field and no display name — names are roster data.
 *
 * `xpSources` is empty, and that is not a gap in the fixture. The API declares it and answers
 * `[]`, because no engine function computes it: the plan that built the endpoint declined to
 * write one on the grounds that an API summing medals is doing the engine's job. The Party
 * screen shows nothing and says why, which is the truth.
 */
export const party: unknown = {
  standings: [
    {
      playerId: PLAYER_ID,
      level: 9,
      toNext: 140,
      areaXp: 320,
      areas: [
        { area: 0, cleared: 5, medals: ['cleared', 'idiomatic'] },
        { area: 1, cleared: 3, medals: ['cleared'] },
        { area: 3, cleared: 3, medals: ['cleared', 'teach-back'] },
      ],
    },
    {
      playerId: 'dm',
      level: 11,
      toNext: 60,
      areaXp: 410,
      areas: [
        { area: 0, cleared: 5, medals: ['cleared'] },
        { area: 3, cleared: 4, medals: ['cleared', 'idiomatic'] },
      ],
    },
  ],
  xpSources: [],
  bounties: [],
};

/**
 * The syllabus: concepts by area, content only.
 *
 * Every id here is real, and that is enforced rather than intended — `ConceptIdSchema` refuses
 * anything the registry does not know, and it caught this fixture inventing `conditionals` on
 * the first run. Area 1's condition concept is `if`.
 */
export const tome: unknown = {
  areas: [
    { area: 0, concepts: [{ id: 'print', label: 'print' }, { id: 'variables', label: 'variables' }] },
    { area: 1, concepts: [{ id: 'if', label: 'if' }, { id: 'else', label: 'else' }] },
    { area: 3, concepts: [{ id: 'list', label: 'list' }, { id: 'indexing', label: 'indexing' }] },
  ],
};

/**
 * The Console's queue — §6.3, §5.11.
 *
 * `submittedAt` is computed from now rather than written down. A fixed date drifts: "asked 400
 * days ago" is what a hardcoded ISO string reads as in a year, and the row whose whole job is to
 * say how long something has been waiting would be the one lying.
 *
 * Two rows, and the second one is the important one. `PLAYER_ID` is `peer`, so `a3-the-smelter`
 * is the caller's **own** submission — the queue is household-wide and deliberately unfiltered
 * (`PendingSignoffsSchema`), which means the screen has to render a row it cannot act on. A
 * fixture with only actionable rows would leave that path undrawn.
 */
const daysAgo = (days: number): string => new Date(Date.now() - days * 86_400_000).toISOString();

export const pendingSignoffs: unknown = [
  {
    attemptId: 'att-8f21c0',
    // The submitter, and a player id like any other. It was the string 'dm' — a seat name in a
    // field that holds an id, which is the same confusion that left PLAYER_ID reading 'peer'.
    playerId: DM_ID,
    questId: 'a3-the-enchanter',
    questTitle: 'The Enchanter',
    // `by` on a pending row is the SEAT that must sign, not a player id — the contract has it
    // as z.enum(['peer','dm']). The player id on this shape is `playerId`, the submitter.
    by: 'peer',
    submittedAt: daysAgo(2),
  },
  {
    attemptId: 'att-4c07ab',
    playerId: PLAYER_ID,
    questId: 'a3-the-smelter',
    questTitle: 'The Smelter',
    by: 'dm',
    submittedAt: daysAgo(8),
  },
];

/**
 * What a granted sign-off pays, per attempt.
 *
 * `medal` is `cleared` on both because that is what the endpoint awards — `server.ts` writes
 * `medal: 'cleared'` and an XP number the engine returned. A fixture that paid a `teach-back`
 * would be describing an API that does not exist.
 */
const AWARDS: Readonly<Record<string, { questId: string; xpAwarded: number }>> = {
  'att-8f21c0': { questId: 'a3-the-enchanter', xpAwarded: 36 },
  'att-4c07ab': { questId: 'a3-the-smelter', xpAwarded: 28 },
};

export const signoffAward = (attemptId: string): unknown => {
  const award = AWARDS[attemptId];
  if (award === undefined) throw new Error(`no pending sign-off ${attemptId}`);
  return { attemptId, questId: award.questId, medal: 'cleared', xpAwarded: award.xpAwarded };
};
