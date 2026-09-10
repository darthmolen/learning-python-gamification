# The workflow catalog

Every interaction the campaign actually contains, between the three parties that have one: the
**learner**, the **DM**, and the **system**.

It exists because five questions were asked of the loop — *how does the DM contribute, how does
the learner get exercises, how does a DM know what is theirs, where is each audience's content,
and how does peer or dm validation happen* — and every answer existed only as fragments, spread
across a spec section, four area guides, a voice table and a verifier table with one row.

**This describes what is built.** Where something is specified and unbuilt it says so and names
what is missing. A catalog that describes intent as if it were behavior is worse than none,
because it is the document people would trust.

Written 2026-09-10, against the tree at that date. The spec
(`docs/specs/2026-08-26-gamified-python-curriculum-design.md`) remains the document of record for
*intent*; this is the record of *behavior*, and the two differ in the places noted.

---

## The shape of the loop

```text
Area  ──►  Practices, in order  ──►  Exercises  ──►  Boss
           (the curriculum)          (some are scored)
```

Four words, and they are four different objects. ADR 0007 settles them:

| Word | What it is | Ordered? | Where it lives |
|---|---|---|---|
| **Practice** | a numbered unit of the curriculum | **yes** — this is the spine | `curriculum/area-<n>/practices.yml` |
| **Exercise** | one brief-bearing piece of that work | within its practice | `curriculum/area-<n>/exercises/<slug>/` |
| **Quest** | an exercise the game scores | no — any three unlock the boss (§5.2) | `game/area-<n>/quests/*.yml` |
| **Session** | the evening. Attendance, §5.9's streak | calendar | Postgres — *and see "unbuilt" below* |

**Practice → Quest is derived, never stored.** The curriculum names exercise slugs; a quest names
its brief path; the loader joins them. Writing the edge down would either point the curriculum at
game ids — failing the deletion test — or state a fact the brief path already states.

**Not every practice carries an exercise, and that is the truth about the work.** Five of the
twenty-four authored practices carry none: the work happens at the table, out loud. The app
rendered only the scored subset for months and never admitted it was a subset, which is what
ADR 0007 exists to correct.

---

## Two bodies of work per area, and this is the thing most likely to confuse

```text
curriculum/area-<n>/
  practices/
    practice-3-the-broken-sigil.md    the DM's plan.  audience: dm.  never travels
    practice-3/                       the drills.     audience: learner
  exercises/<slug>/
    BRIEF.md                          audience: learner
    starter/                          the file to begin from
    hidden/                           the test. never reaches a browser (§6.3)
  reference/                          Datamine answer keys. the DM's copy
```

`practices/practice-<n>/` holds drills delivered at the table — no brief, no test, not scored.
`exercises/<slug>/` holds the brief-bearing work, and in every authored area those map **1:1** to
quests. The two live in the same area and are different objects.

Since 2026-09-10 every document under an area declares `audience: learner | dm` in frontmatter,
`validate:content` refuses one that does not, and `npm run pack:payload` derives what may travel
from those marks. Before that the split was directory convention plus voice — and it had already
failed: `practices/README.md` told the learner to copy a directory holding the DM's plans.

---

## The five questions, answered

**How does the DM contribute?** §5.11 names five powers: author content, sign off, adjudicate,
forgive a streak, ask Socratic questions. Four are built. *Forgive a streak* is not — see unbuilt.

**How does the learner get exercises?** `tools/learner-setup/pack.sh`, which copies a derived
payload into a branch of the learner's own repository. `--remote` clones from Gitea, applies,
pushes and forgets. The payload mirrors the campaign layout, and that mirror is load-bearing.

**How does a DM know what is theirs?** The `audience:` field, and three conventions that predate
it: `reference/` is the DM's copy, `hidden/` never reaches a browser, and reference `.py` files
open with a `REFERENCE --` docstring.

**Where is each audience's content?** One tree, two published builds. `apps/field-manual` emits a
learner site and a `dm/` site, and the difference is whether the guide is *rendered at all* —
never merely hidden, because the site is public.

**How does peer or dm validation happen?** It is called **sign-off**, it is per attempt, and it
is one enum on one verifier. Fully built. See below.

---

## Verifiers — how a submission is judged

Four types (§6.3), and the **quest** decides which. `submit` switches on the quest's verifier,
never on the request body's; a body whose type disagrees is refused, explicitly so a client
cannot pick `peer-signoff` on a `hidden-tests` quest.

| Type | What happens | Count across 30 quests |
|---|---|---|
| `hidden-tests` | code posts to the API, which enqueues a runner job. **The test file's path travels, never its contents** | 16 |
| `local-repo` | the API clones the learner's pushed repository and runs the quest's pytest specification | 8 |
| `peer-signoff` | somebody other than the submitter presses a button | 5 |
| `git-signal` | reads the learner's git log through the Gitea API | 2 |

The mix changes sharply by area, and the transitions are the workflow changes:

- **Area 0** — `hidden-tests` throughout, plus one `peer-signoff` boss. Needs no application at
  all; the whole area runs with a terminal and Python. (Practice 0 is the one exception, and it
  needs Gitea reachable — see the area README.)
- **Area 2a** — git arrives as a *subject*. `git-signal` verifiers appear; the journal gains its
  commit-and-push half.
- **Area 2b** — the toolchain arrives. `local-repo` replaces `hidden-tests`, because from here
  the thing being judged is a repository rather than a snippet.
- **Area 3** — `by: dm` sign-offs appear beside `by: peer`, and ursina brings the 5,000-block
  authoring cap.

**Ten of the thirty cannot be verified until two environment variables are set.** `local-repo`
and `git-signal` both need `GITEA_TOKEN`, and the handle→repository map needs `PLAYER_REPOS`.
Both are documented in `infra/.env.example` and threaded through compose and the dev stack; the
live `.env` is gitignored and the operator has to mint the token. Until then the API refuses
those submissions rather than guessing, and says so at boot.

---

## Run and Submit are different paths, deliberately

**Run** is Pyodide in a Web Worker in the learner's browser. Instant, no round trip, and it
**records nothing**. A worker rather than the main thread because a page cannot interrupt
itself — without one there is no Stop button that can exist, and `while True:` would end the
session (ADR 0003).

**Submit** goes to the API, because anything shipped to the browser is readable and hidden tests
shipped to the client are not hidden.

---

## The six direct interactions

### system → learner

| What | Carried by |
|---|---|
| the brief, the editor, Run | the Quest screen; `GET /api/players/:id/quests/:questId` |
| which quests exist and what they pay | `GET .../campaign`, `.../areas/:area`; the engine's `availableQuests`, `areaProgress` |
| whether the boss is unlocked | `bossState` — three cleared quests, and the learner chooses which three |
| this session's invasions | `GET .../defend`; the engine's `dueInvasions` over the 1·3·7·16·35 ladder |
| the whole syllabus, from day one | `GET /api/tome`, `GET /api/how-to` — unauthenticated and unscoped on purpose |
| the practice spine, in order | the Area screen's right rail, from `practices.yml` |

### system → dm

| What | Carried by |
|---|---|
| the sign-off queue | `GET /api/signoffs` — **household-wide and deliberately not filtered by caller**, so the DM's own pending teach-back appears on the screen whose job is to show it |
| who exists and what roles they hold | `GET /api/players`, behind `requireDm` |
| whether content is valid | `npm run validate:content`, and the API refusing to boot on a bad root |

### learner → system

| What | Carried by |
|---|---|
| a submission | `POST .../quests/:questId/submit` |
| a repelled or missed invasion | `POST .../defend/:conceptId` |
| a practice tick | `POST .../areas/:area/practices/:practiceN` — scaffolding; gates nothing |
| a journal entry | a commit in their own repository, read later by `git-signal` |

### dm → system

| What | Carried by |
|---|---|
| new content | `npm run new:quest`, then `validate:content`. Authoring is a CLI (§6.10) — the Console does not do it |
| a granted or refused sign-off | `POST /api/signoffs/:attemptId` |
| accounts and roles | `POST /api/players`, `.../roles`, `.../password` — all `requireDm` |
| a machine put into service | `tools/learner-setup/pack.sh` |

### learner → dm, and dm → learner

The parts with no software in them, and §2.4 counts them as the design's largest advantage.
The five beats of an evening, the keyboard rule, the 90-second rule, the Socratic ladder, the
choice board, reading the forecast back. All of it lives in `game/how-to/how-to-run-a-session.md`
and the per-area `dm-guide.md`, and none of it is mediated by anything.

---

## The transitive paths, which is where the system earns its place

Neither party is told these exist, and they are the reason there is software at all.

### dm → system → learner

| Chain | The trace |
|---|---|
| authoring | `new:quest` → `validate:content` → git → the field-manual build → the brief in the Tome |
| a sign-off granted | Console → `resolveSignoff` flips `passed` → `medalDelta` prices it → `awardMedal` → XP on the learner's Area screen |
| a machine provisioned | `pack.sh --remote` → a branch on their Gitea repository → they `git checkout` |
| a journal reply | a comment in Gitea → the learner reads it where they wrote |

### learner → system → dm

| Chain | The trace |
|---|---|
| a `local-repo` submission | push → the API clones → `exportTree` tars → the runner → an attempt row |
| a boss attempt | Submit → attempt `passed=false` carrying `awaitingSignoff` → the DM's queue |
| a journal entry | commit → `git-signal` reads the log → `journal_entries` → the DM sees it and replies |
| a missed invasion | the concept steps back exactly one rung → the next Defend queue → the questions the DM asks out loud |
| **a scar, or a datamine** | an attempt that did not pass, kept → §5.5's signal about what the learner actually knows |

**The last one is the design's own argument for why any of this exists.** §5.5: *"Shame produces
hiding, and hiding destroys the parent's signal about what the learner actually knows."* Datamine
is costed, named and logged precisely so the signal survives. That signal travels
`learner → system → dm`, and until this document nothing told either of them so.

---

## Sign-off, in full

The only mechanic that blocks on a person. It is **per attempt**, on a quest or a boss — never
per area.

**Submitting a `peer-signoff` quest** records an attempt with `passed: false` and a detail of
`awaitingSignoff(<role>)`, and returns 202 with the attempt id. There is no `signoffs` table: a
pending sign-off *is* an attempt that has not passed, which is also the truer model.

**`GET /api/signoffs`** returns the pending queue: attempt id, player, quest, the role named, and
when. **The validator sees who submitted, which quest, and when — not the code.** The evidence is
a person or a git history, which is why the submit body for this verifier carries nothing at all.

**`POST /api/signoffs/:attemptId`** takes `{ by: <player id>, granted, note? }`. `by` is a
**player id here, not a role**, and that is the whole difference between a check and a claim. The
API refuses when:

- the approver is the submitter, or
- the approver does not hold the role the quest names (`player_roles`, checked at sign-off time).

A grant flips `passed`, records who pressed, and pays exactly `medalDelta(...)`. A denial leaves
`passed` false — correct rather than harsh: the attempt did not pass, and §3.5's whole argument is
that the record keeps the ones that did not. It is idempotent, so a double-clicked button cannot
pay twice.

**`peer` is not "the learner" and `dm` is not "the parent".** `peer` means *somebody other than
the submitter*. In Kitchen Table mode one adult holds both seats, so the parent satisfies `peer`
for the learner — and the learner, holding only `player`, satisfies `peer` for the parent. That
is §5.11's teach-back inversion, and it hands the learner real authority over the parent's work.

**The spec gives no rule for choosing `peer` over `dm`.** Three quests carry `dm` and two carry
`peer`, each with reasoning in a header comment, and no rule anywhere. Recorded as
`planning/backlog/feature_no-rule-for-peer-versus-dm_2026-09-10.md`.

---

## What is specified and not built

Named here because a reader who cannot tell these from the working parts will trust the wrong
thing.

| Thing | Status |
|---|---|
| **Attendance and §5.9's streak** | `sessions` is provisioned and **unwired** — one reader, no `INSERT` anywhere, no endpoint. The streak is derived from rows that do not exist |
| **Streak forgiveness** | the one mechanic §5.9 lets the DM apply by hand. No route, no control |
| **The boss attempt log and scars** | `BossScreen.tsx` renders the specification and the unlock count and declines the rest in a comment |
| **Party's "where the XP came from"** | no engine function and no endpoint; stubbed in the screen, which says so |
| **Medals other than `cleared`** | all six are priced, stored, carried on the wire and drawn. Only `cleared` can be awarded — `feature_no-way-to-claim-a-medal_2026-09-02` |
| **Content authoring in the Console** | CLI-only by design (§6.10), not a gap |
| **A solo-bootstrap path** | Practice 0 is DM-led. A learner alone at a new machine has no route — `feature_a-learner-cannot-bootstrap-alone_2026-09-10` |
| **A position on self-study** | the spec has none. Whether unsupervised work is legal, and whether a learner may run ahead, is undecided — `feature_the-spec-has-no-position-on-self-study_2026-09-10` |

---

## Where each answer lives, if you need the source

- **Roles and modes** — spec §5.11.
- **Verifiers** — spec §6.3; the shapes in `packages/content/src/schema.ts`.
- **Push as the verification mechanism** — spec §6.4.
- **Screens and the rail** — spec §6.8, ADR 0008.
- **Practice vs session** — ADR 0007.
- **The audience split** — `curriculum/README.md`'s voice table, now enforced by the `audience`
  rule in `packages/content/src/validate.ts`.
- **What may reach a learner's machine** — `packages/content/src/payload.ts`.
- **Running an evening** — `game/how-to/how-to-run-a-session.md`.
- **Working alone** — `curriculum/how-to/how-to-study-alone.md`.
