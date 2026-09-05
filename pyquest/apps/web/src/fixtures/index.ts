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

/**
 * The Area screen's cards. Ids and concepts are real — they exist in `content/`.
 *
 * **Deliberately not in DC order.** They used to be, by accident, which made the fixture unable
 * to tell a screen that sorts from a screen that does not — `screens.test.tsx` asserts the
 * rendered order, and against an already-sorted list that assertion passes either way. The API
 * hands these over in content-load order, so a fixture that arrives pre-sorted is also the less
 * faithful stub.
 */
const QUESTS: Readonly<Record<number, unknown[]>> = {
  3: [
    { id: 'a3-the-trading-hall', title: 'The Trading Hall', dc: 20, concepts: ['dict', 'list', 'iteration'], medals: [], status: 'locked' },
    { id: 'a3-recipe-book', title: 'The Recipe Book', dc: 12, concepts: ['dict', 'dict-methods', 'iteration'], medals: ['cleared'], status: 'cleared' },
    { id: 'a3-the-enchanter', title: 'The Enchanter', dc: 18, concepts: ['dict-methods', 'list'], medals: [], status: 'available' },
    { id: 'a3-inventory-lists', title: 'The Inventory', dc: 10, concepts: ['list', 'iteration'], medals: ['cleared', 'idiomatic'], status: 'cleared' },
    { id: 'a3-the-smelter', title: 'The Smelter', dc: 14, concepts: ['dict', 'iteration'], medals: ['cleared'], status: 'cleared' },
  ],
};

/**
 * A verifier per quest, and **all four of them**, because §6.3's four are what Submit branches
 * on and a fixture set that was uniformly `hidden-tests` would leave three branches undrawn.
 *
 * The mix is not invented for the sake of it: the real content already carries all four —
 * sixteen `hidden-tests`, four `peer-signoff`, two `local-repo` and two `git-signal` across
 * `curriculum/` and `game/`. What these fixtures do is make the offline app able to reach each
 * one, which is the only way the branch that must not poll gets exercised without a stack.
 */
const VERIFIERS: Readonly<Record<string, unknown>> = {
  'a3-inventory-lists': { type: 'hidden-tests' },
  'a3-recipe-book': { type: 'hidden-tests' },
  'a3-the-smelter': { type: 'local-repo' },
  'a3-the-enchanter': { type: 'peer-signoff', by: 'peer' },
  'a3-the-trading-hall': { type: 'git-signal', signal: 'push' },
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

/**
 * Definitions for the concepts the offline fixtures name.
 *
 * Real prose rather than lorem, and shorter than the authored glossary, because what the offline
 * screen has to exercise is the *expander* — a chip that opens, pushes the work down, and closes.
 * A one-word definition would leave the layout untested at the size it actually renders at.
 *
 * **`iteration` is deliberately missing**, and `dict-methods` too. An area authored later has no
 * glossary yet, and §5.1a's honesty rule says the chip reports that rather than opening onto
 * nothing. Offline is the easiest place to look at that branch, which is the same argument the
 * tome fixture makes for Area 1 having no lesson.
 */
const DEFINITIONS: Readonly<Record<string, string>> = {
  dict: 'A mapping from keys to values. `inventory["rope"]` asks the question the key names, and\ngets back whatever was filed under it.',
  list: 'An ordered collection. The order is the point: `inventory[0]` is the first slot, not the\nzeroth thing you own.',
  indexing: 'Reaching one item by its position. Counting starts at zero, which is the source of\nexactly one off-by-one error per person per lifetime.',
  print: 'Puts a value on the screen. The first thing that proves a program ran at all.',
  variables: 'A name bound to a value, so the value can be referred to later by something a\nreader understands.',
  if: 'Runs a block only when a condition holds. Everything a program decides, it decides here.',
  else: 'The branch taken when the `if` above it was not.',
};

const conceptsWith = (ids: readonly string[]): readonly unknown[] =>
  ids.map((id) => {
    const definition = DEFINITIONS[id];
    return definition === undefined ? { id, label: id } : { id, label: id, definition };
  });

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
    concepts: conceptsWith(card.concepts),
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
    verifier: VERIFIERS[card.id] ?? { type: 'hidden-tests' },
    /*
     * Only a quest Run can execute gets a starter. `local-repo` grades what was pushed and
     * `git-signal` reads a history, so an editor pre-filled with a square would be inviting
     * work into a box the API will never look in.
     */
    ...(VERIFIERS[card.id] === undefined ||
    (VERIFIERS[card.id] as { type: string }).type === 'hidden-tests'
      ? { starter: STARTER }
      : {}),
  };
};

/* -------------------------------------------------------------------------------------------
 * Submit and the job queue — §6.3, §6.6
 * ----------------------------------------------------------------------------------------- */

/**
 * What Submit answers offline, per verifier — and the three answers are genuinely different.
 *
 * A fixture that returned one shape for all four would hide the thing the client most needs to
 * get right: `hidden-tests` and `local-repo` enqueue a runner job and hand back its **numeric**
 * id; `peer-signoff` hands back an `attempts` id and waits on a person; `git-signal` resolves at
 * submit time and comes back already terminal. Only the first two may be polled.
 */
interface FixtureJob {
  polls: number;
  questId: string;
}

let lastJobId = 40;
const jobs = new Map<string, FixtureJob>();

export const jobAccepted = (verifier: string, questId: string): unknown => {
  if (verifier === 'peer-signoff') return { jobId: 'att-fixture-signoff', state: 'queued' };
  /* The evidence is a history already on the server, so the answer is a read, not a job. */
  if (verifier === 'git-signal') return { jobId: 'att-fixture-signal', state: 'passed' };

  lastJobId += 1;
  const jobId = String(lastJobId);
  jobs.set(jobId, { polls: 0, questId });
  return { jobId, state: 'queued' };
};

/**
 * A job that actually moves: `running`, then `passed`.
 *
 * A fixture stuck on `queued` would let a screen that never polls look exactly like one that
 * does — and the polling loop is the half of Submit with no other way to be exercised without a
 * database and a runner container behind it.
 */
export const job = (jobId: string): unknown => {
  const known = jobs.get(jobId);
  if (known === undefined) throw new Error(`no job ${jobId}`);

  known.polls += 1;
  const passed = known.polls > 1;

  return {
    jobId,
    playerId: PLAYER_ID,
    questId: known.questId,
    state: passed ? 'passed' : 'running',
    result: passed
      ? { passed: true, stdout: '4 passed in 0.31s\n', stderr: '', truncated: false, durationMs: 812 }
      : null,
    errorCode: null,
    attemptId: passed ? 'att-fixture-run' : null,
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
const AREA_0_LESSON = `# First Light

By the end of this area you will have typed a line that draws a square, given things
names, and read an error message on purpose.

## The first line

\`\`\`python
import turtle

turtle.forward(100)
turtle.done()
\`\`\`

Three lines and a window opens with a line drawn across it. The dot matters:
\`turtle.forward\` means **the \`forward\` that belongs to \`turtle\`**.
`;

/**
 * Area 3's lesson carries three glossary marks, and the first one is the interesting case.
 *
 * `[[print]]` is an **Area 0** concept marked in an **Area 3** lesson — a cross-area reference,
 * which is what a curriculum that builds on itself looks like and what an area-scoped lookup
 * would silently fail to resolve. The real `curriculum/area-3/lesson.draft.md` already writes
 * `print` and `range` for the same reason, so the fixture is not inventing a shape.
 *
 * `[[iteration]]` is the fixture's concept with no definition, so the offline app can show what an
 * unwritten glossary entry looks like without waiting for an area to be authored.
 */
const AREA_3_LESSON = `# Collections

A [[list]] holds things in order, and the order is the point. You already know how to
[[print]] one.

- \`inventory[0]\` is the first slot, not the zeroth thing you own.
- \`len(inventory)\` counts them.

Walking one is [[iteration|going through it]], one item at a time.
`;

/**
 * Area 1 carries concepts and no lesson on purpose. Offline is where the "unwritten" branch is
 * easiest to look at, and a fixture where every area is written would leave the screen's honest
 * empty state to be discovered in production.
 */
export const tome: unknown = {
  areas: [
    {
      area: 0,
      concepts: conceptsWith(['print', 'variables']),
      lesson: AREA_0_LESSON,
      lessonIsDraft: false,
    },
    {
      area: 1,
      concepts: conceptsWith(['if', 'else']),
      lessonIsDraft: false,
    },
    {
      area: 3,
      /**
       * `iteration` carries no definition, deliberately — it is absent from `DEFINITIONS` above.
       * Area 1 having no lesson is the same argument at area scale: offline is where the honest
       * "unwritten" branch is easiest to look at, and a fixture where every word is defined would
       * leave the Tome's empty state to be discovered in production.
       */
      concepts: conceptsWith(['list', 'indexing', 'iteration']),
      lesson: AREA_3_LESSON,
      lessonIsDraft: true,
    },
  ],
};

/**
 * What each medal is — `game/medals.md`, offline.
 *
 * Four of the five the Quest screen draws, and `conjured` left out on purpose. That is what puts
 * the "a card with no description" branch in front of anyone running the app with no stack behind
 * it, and the route allows exactly that state: a medal `game/medals.md` does not describe is
 * omitted rather than given an empty string. It is also the state *every* card is in when `game/`
 * is not installed at all, which is the deletion CLAUDE.md requires to stay survivable.
 *
 * `time-attack` is absent for a different reason and is not the case above: `DEFAULT_MEDALS` is
 * five long, so the screen never draws a sixth card at all.
 */
export const medals: unknown = {
  medals: [
    {
      medal: 'cleared',
      description:
        '**The tests pass.** The only medal progression cares about: three cleared quests\nunlock the area’s boss.',
    },
    {
      medal: 'ironman',
      description: 'Done without running it until the end. Raises the DC, and pays the difference.',
    },
    {
      medal: 'idiomatic',
      description: 'Ruff and pyright clean — the standard this repository holds itself to.',
    },
    {
      medal: 'teach-back',
      description: 'You explained it to somebody else and they could then do it.',
    },
  ],
};

/**
 * What a drill answers offline — §5.4, §5.1.
 *
 * **This fixture computes, and that is allowed because it stands in for the server.** The rule
 * the SPA keeps is that a *screen* never recomputes what the engine returned; nothing here runs
 * in a screen. The ladder below is the engine's `INVASION_LADDER` copied rather than imported,
 * because `apps/web` depends on the contract and not on the engine — the SPA talks to shapes, and
 * a build edge to the engine would be a new dependency for a stub.
 *
 * §5.1 prices an invasion flat, and `server.ts` writes `repelled ? 5 : 0` — a concept let through
 * is not work done. The rung moves one either way and never resets to the beginning: §5.4 is
 * explicit that "losing one evening should not cost you everything you already held."
 */
const LADDER = [1, 3, 7, 16, 35];
const rungs = new Map<string, number>();

export const drillOutcome = (conceptId: string, repelled: boolean): unknown => {
  const current = rungs.get(conceptId) ?? 2;
  const rung = repelled ? Math.min(current + 1, LADDER.length - 1) : Math.max(current - 1, 0);
  rungs.set(conceptId, rung);

  const due = new Date();
  due.setUTCDate(due.getUTCDate() + (LADDER[rung] as number));

  return {
    conceptId,
    rung,
    dueOn: due.toISOString().split('T')[0],
    xpAwarded: repelled ? 5 : 0,
  };
};

/* -------------------------------------------------------------------------------------------
 * The Journal — §5.6, ADR 0004
 * ----------------------------------------------------------------------------------------- */

/**
 * Entries as `GET /journal` serves them: the ledger joined to the markdown he wrote.
 *
 * Three, and the three are deliberately unlike each other. One is answered and one is not,
 * because `reply` is optional and a screen that can only draw the answered case cannot draw the
 * common one — a reply lands after the entry, always. And one paid **nothing**: §5.6 pays ten XP
 * *for substance*, and empty prompts pay nothing, which is the case `formatPayout` would render
 * as a brag if anybody reused it here.
 */
export const journal: unknown = [
  {
    sessionDate: '2026-08-27',
    body: '### What I built\n\nA square, then a hexagon by changing the 4 to a 6 and the 90 to a 60.\n\n### What broke\n\nThe hexagon did not close. 360/6 is 60 and I had written 90 out of habit.',
    commitSha: 'a1b2c3d',
    xpAwarded: 10,
    reply: 'The habit is the interesting part — you wrote 90 because the square worked. Next time try predicting the angle before you run it.',
  },
  {
    sessionDate: '2026-08-24',
    body: '### What I built\n\nThe name tag exercise.\n\n### What broke\n\nNothing broke, which the template says is nearly always false. What surprised me was that print puts a space between things automatically.',
    commitSha: 'ff0091a',
    xpAwarded: 10,
  },
  {
    // Paid nothing. Not a brag, and the screen has to say why rather than showing a bare zero.
    sessionDate: '2026-08-20',
    body: '### What I built\n\nnot much',
    commitSha: '77de1b0',
    xpAwarded: 0,
  },
];

/**
 * The template the offline app offers, standing in for `curriculum/area-0/journal/TEMPLATE.md`.
 *
 * **Short, and deliberately not a copy of the real file.** A fixture that reproduced all sixty
 * lines would be the very duplication this endpoint exists to prevent, and it would go stale the
 * same way. What it does keep is the two things `journal.ts` parses — the dated `##` heading and
 * `### DM reply` — so the offline screen shows a template that would actually work.
 */
export const journalTemplate: unknown = {
  area: 0,
  markdown: [
    '## YYYY-MM-DD — Session NN',
    '',
    '**Area:** 0 — First Light',
    '',
    '### What I built',
    '',
    '<!-- Specific. A stranger should be able to tell which session it was. -->',
    '',
    '### What broke',
    '',
    '### What I would do differently',
    '',
    '### What will break next time',
    '',
    '### DM reply',
    '',
  ].join('\n'),
  path: 'journal.md',
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
