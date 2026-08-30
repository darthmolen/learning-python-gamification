# What happened to each review

Every file in this directory is a review as it was received — **never edited**, which is what
makes it an audit trail. What none of them records is the half that matters afterwards: which
findings were **accepted**, which were **merged**, which were **rejected and why**, and which
were **flagged** for a person.

That disposition is the point of a review, and until 2026-08-30 nothing in this repository was
required to write it down. It survived only where an author happened to put a `## Review History`
block in the plan or a reason in a commit subject. This index is the reconstruction, and it is
honest about where the reconstruction failed.

The four dispositions come from `plan-receive-review`: **accept** (reviewer is right), **merge**
(their idea adapted rather than taken wholesale), **reject** (with technical reasoning), **flag**
(a person decides).

## The index

| Review | Plan | Response | Disposition |
|---|---|---|---|
| `area-1-control` | area-1 | `d99fdde`, `c056f58` | **Not recorded.** "Revised after review" says it was acted on, not what was taken |
| `area-2-…-sandbox` | area-2 | `b68a6f7`, `3e9d910` | **Not recorded.** Revised, then re-sent |
| `area-2-v2-…-sandbox` | area-2 | `70e6622` | **Partial** — names one change, "one verifier per item", not the rest |
| `area-3-collections` | area-3 | `4aa0321` | **Not recorded.** Revised and sent back as v2 |
| `area-3-collections-v2` | area-3 | `5ff3261` | **Recorded** — "both findings rejected, no changes" |
| `shared-files-…-cannot-own` | shared-index | `3086771` | **Not recorded.** Went to in-progress after review |
| `the-spa`, `the-spa-v2` | spa | `e4d1ca4` | **Partial** — "twice reviewed, and offline leaves v1" names one outcome |
| `the-engine-query-layer-…` | engine-query-layer | `5bb092f` | **Recorded, in the plan** — 4 accepted, 4 merged, 2 rejected, 1 flagged and ruled |
| `the-progress-schema` | progress-schema | `f48aa93` | **Recorded, in the plan** — 5 criticals, all closed |
| `the-progress-schema-v2` | progress-schema | `f48aa93` | **Recorded** — 3 taken; 1 of 4 "missing" mutants was already present |
| `the-contract-modules-…` | contract-modules | `f48aa93` | **Recorded** — 5 taken, 1 rejected on the facts (the test count) |
| `the-contract-modules-v3` | contract-modules | `dfb3f26`, `688ce48` | **Recorded** — 2 taken, 1 declined; `npm run lint` does not exist |
| `the-api-and-the-runner` | api | `693a930` | **Recorded** — 6 criticals, all closed |
| `the-api-and-the-runner-v2` | api | `f48aa93` | **Recorded** — 3 taken, 1 not as suggested (`killed` kept, not collapsed) |
| `the-api-and-the-runner-v3` | api | `dfb3f26` | **Recorded** — 6 taken; the `payload` finding was the sharpest of four rounds |
| `the-api-and-the-runner-v4` | api | `2970316` | **Recorded** — 2 taken, 3 minors left |
| `the-boss-pays-boss-rates` | boss XP | `76fde05` | **Recorded** — 3 accepted, 1 merged, 2 rejected, 2 flagged |
| `reminders-as-a-first-class-surface…` | — | — | **Not acted on.** Filed unread by request |

## What this cost, and the rule that replaces it

Six reviews are unrecoverable. Somebody read each one, decided what to take, and the reasoning
is gone — so the next person to touch `area-1` or `shared-index` cannot tell a finding that was
rejected on merit from one that was missed.

That is worse than it sounds for rejections in particular. An accepted finding leaves evidence
in the plan; **a rejected one leaves nothing at all** unless someone writes down why. The whole
value of "we considered that and here is the argument against it" evaporates, and the same
finding gets raised, re-argued and possibly accepted next time by someone with less context.

**As of 2026-08-30 the disposition is required, in two places** — see
`.claude/skills/plan-review-record/SKILL.md`:

1. A `## Review History` block in the plan, one paragraph per round.
2. A commit whose message states the counts and the reasoning for anything rejected.

Neither is a new artefact. Both are places that already existed and were used by habit rather
than by rule, which is exactly why the habit held for some plans and not others.
