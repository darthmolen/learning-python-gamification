/**
 * Phase 2 stubs. These stand in for the API until Phase 5, and they are **not** typed as
 * contract shapes on purpose.
 *
 * A fixture annotated `const areas: AreaIdentity[] = [...]` is checked by the compiler and
 * therefore looks safe, but the compiler only knows the shape — it cannot see `.min(1)`, the
 * §5.4 queue cap, or the rule that an area appears once. Those live in the schemas and only
 * run when something calls `.parse()`. So these stay `unknown` to their consumers and the
 * gateway parses them, which means a fixture that drifts from the contract fails a test
 * instead of rendering.
 *
 * Nothing under `src/screens/` may import this file. `src/gateway/boundary.test.ts` enforces
 * it, because the whole of Phase 5 is the claim that one module changes.
 */

export const areaIdentities: unknown = [
  { area: 0, title: 'First Light', weeks: { from: 1, to: 2 }, blurb: 'The first line of code draws something.' },
  { area: 1, title: 'Control', weeks: { from: 3, to: 6 }, blurb: 'Loops, conditions, and the shapes they draw.' },
  {
    area: 2,
    title: 'The Scribe’s Rite, and Escape the Sandbox',
    weeks: { from: 6, to: 8 },
    blurb: 'Files, git, and a Python that is his own.',
  },
  { area: 3, title: 'Collections', weeks: { from: 9, to: 14 }, blurb: 'Minecraft data. Inventories are lists. Recipes are dicts.' },
  { area: 4, title: 'Functions and Decomposition', weeks: { from: 15, to: 20 }, blurb: 'Naming a thing is how you stop repeating it.' },
  { area: 5, title: 'State and Objects', weeks: { from: 21, to: 28 }, blurb: 'Things that remember what happened to them.' },
  { area: 6, title: 'Data and the Outside World', weeks: { from: 29, to: 36 }, blurb: 'Files, APIs, and data that did not come from you.' },
  { area: 7, title: 'Craft', weeks: { from: 37, to: 48 }, blurb: 'Tests, review, and code somebody else can read.' },
];

/** Per-area, keyed by area. §5.1a: cleared of total, and `estimated` when authoring is partial. */
export const areaProgress: Readonly<Record<number, unknown>> = {
  0: { cleared: 5, total: 5, estimated: true },
  1: { cleared: 3, total: 5, estimated: true },
  2: { cleared: 1, total: 5, estimated: true },
  3: { cleared: 3, total: 5, estimated: true },
  4: { cleared: 0, total: 5, estimated: true },
  5: { cleared: 0, total: 5, estimated: true },
  6: { cleared: 0, total: 5, estimated: true },
  7: { cleared: 0, total: 5, estimated: true },
};

/** §5.2: any three of five unlock the boss. `unlocked` must agree with the counts. */
export const bossState: Readonly<Record<number, unknown>> = {
  0: { cleared: 5, required: 3, unlocked: true },
  1: { cleared: 3, required: 3, unlocked: true },
  2: { cleared: 1, required: 3, unlocked: false },
  3: { cleared: 3, required: 3, unlocked: true },
  4: { cleared: 0, required: 3, unlocked: false },
  5: { cleared: 0, required: 3, unlocked: false },
  6: { cleared: 0, required: 3, unlocked: false },
  7: { cleared: 0, required: 3, unlocked: false },
};

/** The Area screen's cards. Ids and concepts are real — they exist in `content/`. */
export const availableQuests: Readonly<Record<number, unknown>> = {
  3: [
    {
      id: 'a3-inventory-lists',
      title: 'The Inventory',
      dc: 10,
      concepts: ['list', 'iteration'],
      medals: ['cleared', 'idiomatic'],
      status: 'cleared',
    },
    {
      id: 'a3-recipe-book',
      title: 'The Recipe Book',
      dc: 12,
      concepts: ['dict', 'dict-methods', 'iteration'],
      medals: ['cleared'],
      status: 'cleared',
    },
    {
      id: 'a3-the-smelter',
      title: 'The Smelter',
      dc: 14,
      concepts: ['dict', 'iteration'],
      medals: ['cleared'],
      status: 'cleared',
    },
    {
      id: 'a3-the-enchanter',
      title: 'The Enchanter',
      dc: 18,
      concepts: ['dict-methods', 'list'],
      medals: [],
      status: 'available',
    },
    {
      id: 'a3-the-trading-hall',
      title: 'The Trading Hall',
      dc: 20,
      concepts: ['dict', 'list', 'iteration'],
      medals: [],
      status: 'locked',
    },
  ],
};

/** §5.4 caps a session at five, and §5.5 merges a ladder-and-Datamine concept into one entry. */
export const dueInvasions: unknown = [
  { conceptId: 'dict', area: 3, lastSeen: '2026-08-22', overdueDays: 3, source: 'ladder' },
  { conceptId: 'list', area: 3, lastSeen: '2026-08-20', overdueDays: 5, source: 'both' },
  { conceptId: 'f-strings', area: 0, lastSeen: '2026-08-18', overdueDays: 2, source: 'datamine' },
  { conceptId: 'iteration', area: 1, lastSeen: '2026-08-25', overdueDays: 0, source: 'ladder' },
];

/** §5.8: a record, not a race. No rank field, and no display name — names are roster data. */
export const standings: unknown = [
  {
    playerId: 'peer',
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
];

/**
 * The Party screen's provenance panel. **This one never becomes a fetch.** No engine function
 * and no endpoint stands behind `xpSources`; whether it lands in the engine or the API is still
 * open, so Phase 5 swaps eight surfaces and leaves this one stubbed. Said here as well as in
 * the plan, because this is where someone will be standing when they wonder.
 */
export const xpSources: unknown = [
  { kind: 'quest', xp: 540 },
  { kind: 'boss', xp: 300 },
  { kind: 'invasion', xp: 180 },
  { kind: 'journal-entry', xp: 140 },
  { kind: 'co-op-session', xp: 100 },
];

/**
 * §5.1a. `into + toNext` must equal `need`, so a progress bar can never be drawn from numbers
 * that disagree with the label beside it.
 */
export const level: unknown = { level: 9, into: 60, need: 200, toNext: 140 };
