# Elective Arc — Scrollcraft: The Helping Hand

**Status:** Backlog
**Track:** scrollcraft
**Date Discovered:** 2026-08-28
**Discovered During:** the Lane B planning session that produced
`planning/feature_area-1-control_2026-08-28.md` and its three siblings

## Context

Six quests plus **BOSS — The Familiar**, unlocking after Boss 7 and running alongside the
capstone. Elective, per §5.12's rule that AI assistance opens to the son only at Area 7.

The design insight this arc rests on: *using AI well* sounds ungradeable, and becomes
gradeable the moment the AI output is a **canned transcript authored by the parent** rather
than a live model. Transcripts are deterministic, safe, replayable, and they let the author
plant exactly the failure the learner should catch. `content/transcripts/` exists in the
content root for this and is empty; the schema already carries an optional `transcripts`
field on a content item, and it is one of two fields `new:quest` deliberately does not
scaffold — these are hand-authored.

The six quests and their win conditions are fully specified in §4 and need no design work:

| Quest | Principle | Win condition |
|---|---|---|
| Too Confident Is a Smell | Confidence is a smell | A fluent, plausible, wrong answer. Find it and prove it wrong with a test |
| Fact-Check the Oracle | Fact-check everything | The transcript calls a method that does not exist. Verify against real docs, correct it, make it run |
| Be More Specific | More specific, not less | The same goal prompted vaguely and precisely. Submit both outputs and the analysis |
| You Pose the Direction | Refuse its trailing suggestions | It offers to add caching and refactor. He writes the next prompt himself |
| Prove It Small | Small proofs before implementation | A spike committed **before** any implementation. Git history verifies the order, and commit order cannot be faked |
| Read Before You Run | Validate, validate, validate | AI-written code with a planted bug. Find it without running it, then write the test that catches it |

**The Familiar:** build a small real feature with AI assistance and submit two artifacts —
the feature, and a **conjuring log** recording every prompt, what he rejected and why, which
spikes he demanded, and what he caught. The parent reviews the log rather than the code.
Teach-back mandatory. The graded artifact is the reasoning trail, because the reasoning trail
is the skill.

## Known Scope

Almost all of the work is **writing six convincing transcripts**, and that is harder than it
sounds: each has to be fluent enough that catching the planted failure is a real achievement,
and each has to plant a failure an 11–14-year-old with a year of Python can actually find.
A transcript that is obviously wrong teaches nothing, and one he cannot catch teaches
helplessness.

Then the content items: six quests plus the boss in `content/`, `peer-signoff` throughout
since every win condition is a judgement, with `transcripts:` paths hand-added after
scaffolding.

`Prove It Small` is the one with an unusual verifier: **git history verifies the order.** That
is a `git-signal` shape and may want a signal the schema does not have yet — check before
authoring rather than after.

## Trigger for Promotion

**Boss 7 cleared.**

**Review date: annually.** §4 is explicit — canned transcripts age, and a hallucination that
convinces in 2026 may be stale by 2028. This item does not close when the arc ships; it
recurs.
