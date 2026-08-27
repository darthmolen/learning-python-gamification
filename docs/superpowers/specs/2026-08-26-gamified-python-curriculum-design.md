# Gamified Python Curriculum — Design Spec

- **Date:** 2026-08-26
- **Status:** Approved design. No implementation plan yet.
- **Players:** One parent (professional developer), one son, age 11–14, Scratch background.
- **Cadence:** 2–3 sessions per week, 45–60 minutes.
- **Horizon:** ~48 weeks, ~120 sessions.

---

## 1. Purpose and Constraints

Teach a 11–14-year-old real, transferable Python while a parent learns alongside him. A game layer wraps the work; the work itself stays real from week one.

**Fixed constraints:**

| Constraint | Value |
|---|---|
| Learner interests | Minecraft, sandbox building, 3D, creative art |
| Session length | 45–60 minutes, 2–3 times weekly |
| Vehicle | Phased: in-app puzzles first, real-repo quests after |
| Stack | Vite + React SPA, Pyodide, Fastify API, Postgres, Docker Compose |
| Git host | Self-hosted Gitea, in the same compose stack |
| Machines | Parent's machine hosts; both play from their own computers |

---

## 2. Research Findings

### 2.1 The existing platforms

| Platform | Model | Strength | Failure |
|---|---|---|---|
| CodeCombat | RPG, type Python to move a hero | Best blocks-to-syntax on-ramp for ages 9–14 | Locked linear order; gem-purchase pressure; weak transition to real programming |
| Boot.dev | XP, levels, quests, boss battles, guilds, Socratic AI tutor | The most sophisticated retention design in the field; real projects | Built for adult career-switchers |
| CheckiO | Python puzzle islands, peer solution review | Genuinely interesting problems | Assumes syntax already known |
| Codewars | Katas, honor points, ranks | Strong practice layer | Not a curriculum; teaching must happen first |
| CodinGame | Bot-battle AI competitions | Powerful intrinsic pull | Intermediate and above only |
| Exercism | Free mentored tracks | Human feedback | Almost no game layer |
| Advent of Code | Annual event, private leaderboards | The private leaderboard among people you know is the strongest single mechanic found | Runs once a year; difficulty spikes hard |
| Tynker / CodeMonkey / Kodland | School curricula | Scope and sequence already solved | Per-seat pricing, classroom-shaped |

### 2.2 What the evidence says

- Gamification helps, modestly. A meta-analysis of 35 interventions found an overall effect of g = 0.257 favoring gamified over non-gamified learning.
- A larger meta-analysis found gamification raises intrinsic motivation, autonomy, and relatedness, but has **minimal impact on competency**. Game layers make learners show up. They do not make learners better.
- Self-determination theory supplies the design rule: **options satisfy autonomy, points satisfy competence, other people satisfy relatedness.** Autonomy correlates most strongly with intrinsic motivation.
- The two documented failure modes in gamified classrooms are students feeling neither competent nor autonomous. Both are design choices.

### 2.3 The failure every platform shares

Two independent criticisms share one root cause:

- Codecademy-style platforms teach syntax but not building. Graduates cannot ship an original project, having never left the browser sandbox or learned where a file goes.
- CodeCombat-style platforms make the transition to real programming hard, and gamified learning hits a ceiling at the intermediate level.

**Diagnosis: when the game is the curriculum, the skill dies with the game.** This design inverts that. Real work is the curriculum; the game wraps it.

### 2.4 The two advantages this project has

1. **Relatedness is free.** Boot.dev builds guilds to simulate the presence of people who care. A parent in the room is the real thing.
2. **Autonomy is free.** No pacing guide, no cohort. The learner picks his quests, his themes, and his boss fights.

---

## 3. Design Principles

1. **The real work is the curriculum. The game wraps it.**
2. **Pay for shipped code, never for elapsed time.**
3. **Give options everywhere.** Autonomy is the highest-yield lever the research identifies.
4. **Rewards are capabilities, not currency.** No gems, no shop, no purchase pressure.
5. **Never hide failure.** Failed attempts are recorded and displayed as scars.
6. **Answers are never given.** Socratic questions only.
7. **Concepts resurface on a schedule.** Nothing is taught once and abandoned.
8. **Leave the sandbox early and permanently.**

---

## 4. The Curriculum

Sequenced by motivation-adjusted dependency order. Each tier's project makes the next concept necessary.

### Tier 0 — First Light (weeks 1–2)
`print` · variables · `int` `float` `str` `bool` · `input` · f-strings · reading errors

**Vehicle:** turtle graphics. The first line of code draws something.

### Tier 1 — Control (weeks 3–6)
`if` `elif` `else` · comparison and boolean operators · `while` · `for` and `range` · nesting · the accumulator pattern

**Vehicle:** turtle to generative art. Spirals, polygons, mandalas, parameterized color.

**BOSS 1 — The Sigil:** an art generator that takes input and produces something worth hanging on a wall.

### The Chronicle (begins week 3, runs forever)
A markdown journal in his repo, one entry per session, committed and pushed. Three prompts: what I built, what broke, what I would do differently. See §5.6.

### Tier 2a — The Scribe's Rite (weeks 6–7)
what a repository is · `init` `add` `commit` · the log as a story · branches, lightly · `push` to origin

**Win condition:** he pushes, and the board updates by itself. The game noticed.

### Tier 2b — Escape the Sandbox (weeks 7–8)
files on disk · `python thing.py` · VS Code · venv · `pip` · tracebacks · `if __name__ == "__main__"`

This tier is load-bearing. Every platform surveyed fails at this seam, so it comes early and earns a trophy.

**BOSS 2 — Escape the Sandbox:** rebuild an in-app program as a real project, push it, and the parent clones it cold and runs it. The win condition is not passing tests. The win condition is that his code ran on someone else's computer.

### Tier 3 — Collections (weeks 9–14)
`list` · indexing · slicing · mutation · list methods · `tuple` · `dict` · `set` · iteration · nested structures · `len` `in` `sorted` `min` `max`

**Vehicle:** Minecraft data. Inventories are lists. Crafting recipes are dicts. Block palettes are sets.

**BOSS 3 — The Crafting Table:** a working crafting simulator with a real recipe book.

### Tier 4 — Functions and Decomposition (weeks 15–20)
`def` · parameters · `return` · defaults and keyword arguments · scope · docstrings · pure versus side-effecting · refactoring a long script · `import` · stdlib (`random`, `math`, `time`, `pathlib`, `json`)

**Vehicle:** Pygame Zero. Game loop, sprites, keyboard input, collision, score.

**BOSS 4 — The Loop:** a complete playable 2D game, then refactored into modules without breaking it.

### Tier 5 — State and Objects (weeks 21–28)
`class` · `__init__` · attributes · methods · `__repr__` · instances versus class · composition · light inheritance · `try` `except` · `raise` · custom exceptions

**Vehicle:** modeling a world. `Block`, `Player`, `Inventory`, `World`. Objects finally have an obvious reason to exist, because Tier 4 supplied the pain of living without them.

**BOSS 5 — The Bestiary:** an object-oriented game with multiple entity types that behave differently.

### Tier 6 — Data and the Outside World (weeks 29–36)
file read and write · context managers · JSON · CSV · `pathlib` · HTTP and `requests` · `argparse` · dependencies

**Vehicle:** save and load his world. Share a seed. Call a live API.

**BOSS 6 — The Archive:** a tool with real persistence and a real command-line interface that the parent installs and uses.

### Tier 7 — Craft (weeks 37–48)
`pytest` · the debugger · type hints · comprehensions · generators · refactoring · performance intuition · branches and pull requests · reading unfamiliar code

**BOSS 7 — Visit Another Kingdom (Don't Break It):** he clones the parent's engine repository, branches, authors a new quest for the game he has played all year, opens a pull request, and receives a real review with comments he must address before merge. Then he plays the level he wrote.

### Capstone — Voxel
A 3D Minecraft-like game in Python using [Ursina](https://www.ursinaengine.org/), whose flagship demo is exactly that. Voxel terrain, block placement and destruction, textures, save and load, his own mechanics.

The pitch matters: **he built a game, he did not mod one.**

### Elective Arc — Scrollcraft: The Helping Hand

**Unlocks after Boss 7. Elective, and runs alongside the capstone.**

Using AI well sounds ungradeable. It becomes gradeable when the AI output is a
**canned transcript authored by the parent** rather than a live model. Transcripts are
deterministic, safe, replayable, and they let the author plant exactly the failure the
learner should catch.

| Quest | Principle | Win condition |
|---|---|---|
| Too Confident Is a Smell | Confidence is a smell | A transcript contains a fluent, plausible, wrong answer. Find it and prove it wrong with a test |
| Fact-Check the Oracle | Fact-check everything | The transcript calls a method that does not exist. Verify against real documentation, correct it, make it run |
| Be More Specific | More specific, not less | The same goal, prompted vaguely and precisely. Submit both outputs and the analysis |
| You Pose the Direction | Refuse its trailing suggestions | The transcript ends by offering to add caching and refactor. He writes the next prompt himself and holds his own line |
| Prove It Small | Small proofs before implementation | A spike proving one assumption, committed **before** any implementation. Git history verifies the order, and commit order cannot be faked |
| Read Before You Run | Validate, validate, validate | AI-written code with a planted bug. Find it without running it, then write the test that catches it |

**BOSS — The Familiar:** build a small real feature with AI assistance and submit two
artifacts: the feature, and a **conjuring log** recording every prompt, what he rejected
and why, which spikes he demanded, and what he caught. The parent reviews the log rather
than the code. Teach-back mandatory.

The graded artifact is the reasoning trail, because the reasoning trail is the skill.

**Review date:** canned transcripts age. A hallucination that convinces in 2026 may be
stale by 2028. Revisit this arc's content annually.

### Deliberately excluded
`async`/`await`, decorators, threading, metaclasses, web frameworks, machine learning, data science. None serves the learner's motivation, and each is a place where curricula stall. Deferred consciously to §9.

### Minecraft and Python: the honest position
Minecraft Java Edition modding is Java, not Python. The options are a Spigot server plus RaspberryJuice driven by `mcpi`, Minecraft Education's Python mode, or building a voxel game outright. **This curriculum uses `mcpi` in Tiers 3–5 and Ursina for the capstone**, which sidesteps the problem by having him build the game rather than script someone else's.

---

## 5. Game Mechanics

### 5.1 Experience points

| Source | XP |
|---|---|
| Quest complete | 10–40, scaling by tier |
| Boss fight | 150–300 |
| Patrol drill | 5 |
| Chronicle entry | 10 |
| Tier release notes | 75 |
| Co-op session | 20 |
| Datamine used | quest XP x 0.5 |

No XP for minutes logged, videos watched, or lessons read. Working code is the only currency.

### 5.2 The skill tree

The curriculum rendered as a node graph. Locked nodes stay visible and greyed, so `class` sits in view for weeks before he reaches it. Anticipation, not frustration.

**Autonomy rules:**

- Each tier offers **five quests; any three unlock the boss.** He chooses which three.
- Each boss offers **two or three theme framings.** He chooses.
- **Challenge run:** he may attempt any boss early. Beating it skips the tier's remaining quests and pays a bonus. This directly answers the criticism that locked linear progression frustrates learners who already know the material.

### 5.3 Boss fights

Rules hold for the whole campaign:

- No scaffolding. A blank file, a specification, a deadline.
- No hints. Socratic questions only, never the answer.
- **It must run from a clean clone on the other person's machine.**
- Unlimited attempts. Failures are recorded as **scars** and displayed with pride.

### 5.4 Patrols

Every quest carries concept tags. When a concept passes its review interval untouched, the engine queues a two-to-three minute drill at the start of the next session. Three to five per session.

This mechanic exists to kill the most-cited flaw in the research: learners complete a challenge and never revisit the topic.

### 5.5 Datamine

After **two genuine attempts** and one written sentence describing what he tried, he may unlock the reference solution.

- Costs half the quest's XP.
- Guarantees a patrol on that concept at +3 days and again at +10 days.
- Carries a name and a button, because it is a **legal move, not cheating**.

Shame produces hiding, and hiding destroys the parent's signal about what the learner actually knows. A costed, logged, named move keeps both.

### 5.6 The Chronicle

A markdown journal in his repository, one entry per session, committed and pushed.

- **Ten XP per entry, paid for substance rather than existence.** Three prompts: what I built, what broke, what I would do differently. Empty prompts pay nothing.
- **The parent replies**, as comments in Gitea. Relatedness, plus code-review culture learned before he writes code worth reviewing.
- **Before every boss fight he re-reads his own Chronicle from the start of that tier.** Reading something he wrote six weeks ago and finding it easy is the strongest evidence a learner will ever get that he is not stupid. Badges cannot fake that.
- **At the end of each tier he writes release notes** in a real `CHANGELOG.md` against a real version tag. That yields one versioned release per tier, each with written release notes, before he ever reaches the capstone.

Git also gets learned here by low-stakes repetition, weeks before it has to carry anything.

### 5.7 Rewards are capabilities

Bosses unlock real new powers:

| Boss | Unlock |
|---|---|
| 2 | The real toolchain |
| 3 | `mcpi` — Python touching actual Minecraft |
| 4 | Pygame Zero |
| 6 | `requests` and the open internet |
| 7 | Merge rights on the engine repository |
| Capstone | Ursina and 3D |

Titles and sigils exist as flavor. **No currency, no shop, no gems.** Purchase pressure is the one CodeCombat trait this design refuses to copy.

### 5.8 The co-op layer

Relatedness is the hardest need to satisfy at scale, which is why commercial platforms simulate it. Here it is real, so the app is genuinely two-player.

- **The parent has his own track**, with real quests at his real level, on the same board.
- **The son watches the parent fail.** This is the highest-value mechanic in the design. A child who has never seen a competent adult get stuck concludes that being stuck means being stupid.
- **A leaderboard of two**, Advent-of-Code style, **reset each tier** so neither player runs away with it.
- **Co-op quests:** pair programming, driver and navigator, roles swapped every ten minutes. The son drives more.
- **Bounties:** either player posts a bug or feature bounty for the other. Both pay XP.

### 5.9 Streaks

**No daily streaks.** A daily streak against a two-or-three-times-weekly cadence manufactures guilt and then collapses. The counter tracks **consecutive scheduled sessions attended**, and it is the only mechanic the parent may forgive by hand, because sometimes there is a soccer game.

---

### 5.10 Medals

A quest is not binary. Every quest carries medal slots, earned independently and on replay.

| Medal | Requirement |
|---|---|
| Cleared | Tests pass. The only medal progression cares about |
| Ironman | From memory. No documentation, no autocomplete, no AI |
| Idiomatic | ruff and pyright clean, plus one written line on why this solution is idiomatic |
| Teach-back | The other player signs off after hearing the explanation |
| Conjured | Completed with AI assistance. See §5.12 |
| Time Attack | Roadmap |

Rules:

- Medals earn independently, and **replaying a cleared quest to take a medal is a
  first-class action** rather than a workaround.
- Quest XP equals base XP plus medal bonuses, each paid once.
- **Only Cleared unlocks anything.** Medals are elective depth, which keeps autonomy intact.
- Unearned slots render greyed on the quest card, borrowing the visible-but-locked
  psychology of the skill tree.

Two consequences follow. The campaign map gains a completionist layer. More importantly,
**voluntary replay becomes a second retrieval-practice engine** beside patrols: patrols are
retrieval the engine forces, medals are retrieval the player chooses. Both build retention.

Ironman is not auto-granted to the son. His binding constraint is working from memory
without documentation, which is a genuine demand at his age. The parent's binding
constraint is abstaining from AI. The same medal costs each player something real.

### 5.11 The Parent's Track

**One content set, two players.** Quest YAML is player-agnostic; the completion bar differs.

**The challenge run is the parent's gap detector.** Playing Tier 0–3 quests straight would
teach the parent nothing and distort the leaderboard, so the parent instead challenge-runs
the bosses under the mechanic already defined in §5.2.

- Beat the boss cold: the tier is skipped and the bonus paid.
- **Fail it: a real gap has surfaced**, measured rather than self-assessed. The parent then
  plays that tier's quests in earnest.

*"I can write Python, but that does not mean I learned it"* is a problem introspection
cannot solve. The bosses solve it by measurement.

**Teach-back inverts the sign-off.** A parent quest is incomplete until the son hears the
explanation and presses the button himself. This matters twice over: explanation exposes
precisely the parts a fluent practitioner runs on muscle memory, and it hands the son real
authority over the parent's work, including the standing power to say the explanation was
not good enough.

### 5.12 Conjured, and the AI policy

The curriculum takes a deliberate position on AI rather than omitting one.

**Conjured** marks a quest completed with AI assistance. It is legal, named, and logged.
It pays reduced XP and requires a statement of what the AI did and why the result works.
Conjured and Ironman cannot coexist on one quest, though the quest may be replayed later
for Ironman, which is exactly the return-to-basics move an AI-fluent adult needs.

**Availability:**

| Player | Conjured unlocks |
|---|---|
| Parent | Day one |
| Son | **Tier 7** |

Before Tier 7, AI would rob the son of the struggle that does the teaching. From Tier 7
onward, refusing to teach him to use it well would be its own failure. The Scrollcraft arc
(§4) exists to teach the discipline, and the Scrolls of Conjure Helper economy (§9) later
governs how many conjures a quest permits.

## 6. Application Architecture

### 6.1 Services

`docker-compose.yml`, shaped for a pipeline from day one:

| Service | Role |
|---|---|
| `postgres` | Postgres 16 with a persistent volume |
| `api` | Fastify, serves the built SPA in production |
| `runner` | Executes untrusted Python; network disabled, CPU, memory, and time capped |
| `gitea` | Self-hosted git remote, backed by the same Postgres |
| `web` | Vite dev server, development only |

Environment-variable configuration, migrations as a job, healthchecks throughout. Gitea and its repositories load on startup from the compose stack.

### 6.2 The content model

A drill, a quest, and a boss are the same object. Only the verifier differs.

```yaml
id: t3-recipe-book
title: The Recipe Book
kind: quest          # quest | patrol | boss
tier: 3
concepts: [dict, dict-methods, iteration]
requires: [t3-inventory-lists]
xp: 25
brief: briefs/t3-recipe-book.md
verifier:
  type: hidden-tests
  starter: starters/t3-recipe-book.py
  tests:   tests/t3-recipe-book_test.py
```

Adding content means editing a file. That is the entire justification for the engine.

Quests may also carry **transcript assets** — canned AI conversations authored by the
parent, used by the Scrollcraft arc. Transcripts are content like any brief, so they are
versioned in git and validated on load.

**Medals are stored per player, per quest, per medal**, not as a flat completion flag:
`(player_id, quest_id, medal, earned_at, xp_awarded)`. Progression queries read only the
`Cleared` rows; XP sums across all of them.

### 6.3 Verifiers

| Type | Mechanism | Used by |
|---|---|---|
| `hidden-tests` | Submit posts the code to the API, which runs tests the client never sees | Tiers 0–1 drills |
| `local-repo` | API pulls his repo, runs the quest's pytest specification | Tier 2b onward |
| `peer-signoff` | The other player presses the button, named by a `by` field | Bosses, and every Teach-back medal |
| `git-signal` | Reads his git log for commits and streaks | Chronicle, streaks |

**Run and Submit are deliberately different paths.** Pyodide runs his code in the browser for **Run**, giving instant feedback with no round trip. **Submit** goes to the API, because anything shipped to the browser is readable, and hidden tests shipped to the client are not hidden.

### 6.4 Push is the verification mechanism

The API runs on the parent's machine; the son codes on his own. The API therefore cannot see his filesystem. His code reaches the server the only way code travels between machines: **`git push`**.

The API pulls his repository into `/workspaces/<username>/`, runs the quest's pytest specification, and awards XP.

This is an upgrade rather than a workaround. *If you did not push it, it did not happen* is real engineering culture, and the game cannot see him until he pushes.

### 6.5 Why Gitea

- No age gate, and nothing he writes leaves the house.
- **Gitea Actions is GitHub-Actions-compatible**, so the pipeline can be built and run entirely at home and ported later almost verbatim.
- Real pull requests with inline review, which Boss 7 requires.
- Moving to GitHub at 13 becomes its own milestone quest rather than a prerequisite.

### 6.6 The runner

Arbitrary Python needs a boundary, not because the learner is malicious but because `while True:` is week-three material.

- **v1:** the `runner` container executes each submission as a subprocess with `--network none`, a ten-second timeout, and memory caps.
- **Later:** an ephemeral container per job.

The API-to-runner interface is a job queue in both cases, so hardening it touches nothing else.

### 6.7 `packages/engine`

Pure functions over state and content. Given completions, XP, scars, datamines, and concept review timestamps, it returns available quests, tier progress, boss unlock status, due patrols, level, and standings.

**No I/O, no database, no network.** This is the one component that must never be wrong, so it is the one component that is trivially testable.

**Content lives in git. Progress lives in Postgres. The two never mix.**

### 6.8 Screens

1. **Campaign Map** — the skill tree as regions, locked nodes visible
2. **Quest** — brief, CodeMirror editor, Run and Submit, Datamine
3. **Muster** — session start, queued patrol drills
4. **Boss** — specification, attempt log, scars, sign-off
5. **The Board** — two-player XP, levels, tier standings, open bounties
6. **Chronicle** — entries, prompts, parent replies
7. **Console** — sign-off, authoring, streak forgiveness. Both players have one, since sign-off runs both directions

### 6.9 Backup policy

Nightly job: `pg_dump` of Postgres plus a mirror of every Gitea repository, written to a
dated tarball on a second disk. Thirty-day retention, with a restore rehearsed once before
week 3.

The Chronicle becomes irreplaceable quickly, and so does his commit history. Those are the
two artifacts this project cannot regenerate.

### 6.10 Authoring is a first-class feature

`npm run new:quest` scaffolds the files. Every YAML file is zod-validated on load. Development hot-reloads content. `npm run validate:content` proves the prerequisite graph is acyclic and every concept tag is known.

The parent will do this more than 150 times. It should take two minutes.

---

## 7. Repository and Git Model

| Repository | Owner | Contents |
|---|---|---|
| `pyquest` | parent | SPA, engine, quest YAML, verifiers, hidden tests |
| `<his choice>` | son | One directory per project, plus the Chronicle |

**The son owns a separate repository.** Reasons, in order of weight:

1. The engine repository contains the answers. A fork puts every solution in his working tree.
2. Ownership is the cheapest large dose of autonomy available, and autonomy is the lever the research ranks highest. A folder inside the parent's project is a desk in the parent's office.
3. First-commit blast radius. A first `git commit` rejected by a linter he did not install and cannot read is a bad first day.
4. His git log becomes a progress bar, which fails if his commits are diluted into another history.

One repository for all his projects, not one per project. Ceremony kills momentum, and the single continuous history is the point.

**Working inside someone else's repository is not abandoned, only scheduled.** It needs branches, pull requests, review, and the ability to read unfamiliar code — all Tier 7 material. Boss 7 delivers exactly that lesson, authentically, against the engine repository, with the highest-stakes reviewer he will ever have.

---

## 8. Build Order

Driven by the learner's calendar, not by feature completeness.

| Phase | Ships | Needed by |
|---|---|---|
| 0 | Compose stack, engine, schema, content validator | week 0 |
| 1 | Quest view, Pyodide run, API verify, campaign map | week 1 |
| 1.5 | Gitea, `git-signal`, Chronicle | week 3 |
| 2 | `local-repo` verifier, boss flow, peer sign-off | week 6 |
| 3 | Patrols and spaced repetition | week 9 |
| 4 | Two-player board, bounties | week 12 |
| 5 | See roadmap | later |

**Start the curriculum before the app is finished.** Tier 0 needs a markdown file and a REPL. If Tier 0 waits on Phase 1, the app becomes a satisfying way to postpone teaching a child Python.

**Build a turtle-to-canvas shim for Pyodide** (roughly one to two days). Turtle does not render in Pyodide unaided, and six weeks of text-only drills will lose a learner who chose creative art as an interest. Boss 2 keeps its meaning regardless, because that boss concerns files, venv, and git rather than graphics.

---

## 9. Roadmap

- **Scrolls of Conjure Helper.** Three hint scrolls per quest; further hints cost 50 XP. The full consumable-hint economy that Datamine grows into.
- Ephemeral per-job containers for the runner.
- Gitea Actions CI on his repository, so his own commits earn green checkmarks.
- Migration to GitHub at 13, as its own milestone quest.
- Richer in-app mini-games and cosmetics.
- Post-campaign concepts: `async`, decorators, threading, web frameworks.

---

## 10. Open Questions

1. Ursina versus `mcpi` weighting in Tiers 3–5, should he prefer scripting real Minecraft over building his own.
2. ~~Parent track content~~ — **closed.** Quest YAML is reused unchanged; §5.11 governs the difference.
3. ~~Backup policy~~ — **closed.** See §6.9.
4. How the Scrollcraft transcripts get refreshed as models change. Annual review is the current answer, and it may prove too slow.

---

## 11. Decision Log

| Decision | Rationale |
|---|---|
| Data-driven engine over bespoke screens | Content throughput is the year-long bottleneck |
| Phased puzzles then real repo | Smooths the difficulty curve without abandoning transfer |
| Son owns a separate repository | Engine holds the answers; ownership buys autonomy |
| Boss 7 covers contributing to another repository | Needs Tier 7 prerequisites; premature at week 6 |
| Postgres and Docker Compose over SQLite | Beefy host available; pipeline-shaped from day one |
| Gitea over GitHub | No age gate, private, GitHub-compatible Actions |
| Push as the verification mechanism | Two machines; also honest engineering culture |
| Git split across Chronicle, Scribe's Rite, Escape | Verification depends on git, so git must precede it |
| Chronicle scored rather than ritual | Reflection is a skill the industry lost |
| No currency or shop | Directly answers the gem-pressure criticism |
| No daily streaks | Guilt against a 2–3x weekly cadence |
| Medals per quest, earned on replay | Makes replay rewarding, and adds voluntary retrieval practice beside forced patrols |
| Only Cleared gates progression | Keeps medals elective, preserving autonomy |
| `peer-signoff` replaces `parent-signoff` | Sign-off runs both directions; deletes a special case rather than adding one |
| Challenge runs as the parent's gap detector | Measures gaps instead of asking the parent to introspect them |
| Conjured is legal, logged, and costed | Disclosure beats prohibition; the son will grow up with these tools |
| Son's AI unlock at Tier 7 | Struggle teaches before Tier 7; refusing to teach the tool after Tier 7 fails him |
| Canned transcripts as Scrollcraft content | Makes AI-usage discipline deterministic and gradeable |

---

## 12. Sources

- [The Gamification of Learning: a Meta-analysis](https://link.springer.com/article/10.1007/s10648-019-09498-w)
- [Gamification enhances intrinsic motivation, autonomy and relatedness, minimal impact on competency](https://link.springer.com/article/10.1007/s11423-023-10337-7)
- [A Meta-Analysis of Gamification's Impact on Student Motivation in K-12 Education](https://onlinelibrary.wiley.com/doi/10.1002/pits.70056)
- [Teach coding with games: a review of Codewars and CodeCombat](https://opensource.com/education/15/7/codewars-codecombat-review)
- [CodeCombat review, Common Sense Media](https://www.commonsensemedia.org/website-reviews/codecombat)
- [The Problem With Codecademy](https://www.redgreencode.com/the-problem-with-codecademy/)
- [Boot.dev](https://www.boot.dev/)
- [Advent of Code with Python](https://realpython.com/python-advent-of-code/)
- [Python Discord Code Jams](https://www.pythondiscord.com/events/code-jams/)
- [Coding Games With Pygame Zero and Python](https://electronstudio.github.io/pygame-zero-book/)
- [PCEP exam syllabus](https://pythoninstitute.org/pcep)
- [Pyodide](https://pyodide.org/)
- [Ursina Engine](https://www.ursinaengine.org/)
- [Gitea](https://about.gitea.com/)
