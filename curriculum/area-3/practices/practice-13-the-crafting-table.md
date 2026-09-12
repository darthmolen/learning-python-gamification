---
audience: dm
---

# Practice 13 — The Crafting Table

**Concepts:** — none introduced · all seventeen resurfacing
**Files:** `exercises/the-crafting-table/BRIEF.md` — the specification, and nothing else
**Journal:** entry 37, and it is the area's release notes

Boss 3. A blank file, a specification, and one evening.

**No drills, no `practices/practice-13/` directory, and no copy of the brief.** §5.3 gives a
boss no scaffolding, and Area 1 keeps a second copy of its boss brief beside the practice
plan — which is two files that must never disagree, the same liability that kept `journal/`
out of this area. The brief lives in `exercises/` where the learner opens it, and this plan
points at it.

**Read `dm-guide.md` §9 before tonight.** It is the run sheet: what to do at each stall, what
to say when it fails, and the clean-clone check that no test can perform.

---

## Beat 1 — Invasion (3 minutes)

1. List, dict or set — a recipe book. Which, and why not the other two?
2. What does `.get(name, 0)` do that `[name]` does not?
3. What is `need - have` asking?

Three questions, three collections. If all three come back clean, they are ready.

---

## Beat 2 — Forecast, and the whole area read back (10 minutes)

**Longer than usual, and it replaces the hook.** §5.6 asks for the area's Journal to be
reread before a boss, and this is the one where it pays: entry 35 has their own sentence
about how to choose between a list, a dict and a set, and tonight is an hour of that
judgment.

Have them read entries 25 to 36 to themselves, then say **one thing they wrote that they had
forgotten.** That is the whole beat. Do not add to it.

---

## Beat 3 — The fight (40 minutes)

Hand them the brief. Then stop talking.

**They pick the framing** — The Crafting Table, The Alchemist's Bench, or The Forge. §5.2
gives a boss two or three and the choice is theirs; the program underneath is identical.

What they are building: a program that **keeps its state and answers again.** Every quest in
this area printed an answer and stopped. This one is asked a question, changes what it holds,
and is asked another question about the thing it just changed.

**There is no new syntax in this fight.** There is one data shape held across a whole file,
which is why it is worth 24.

### The three failures worth predicting

Named here so you recognize them rather than solve them. §5.3: Socratic questions only.

1. **Half-spending.** They take ingredients as they check them, find one short partway, and
   stop — with the earlier ones already gone. The refusal message is honest and the world is
   already wrong. *"You said it could not be made. Print what you are holding."*
2. **Answering from a stale copy.** They work out what is affordable once and keep answering
   from it, so the second craft succeeds against an inventory that no longer exists.
   *"Craft it twice. Which inventory did the second one look at?"*
3. **The item never arrives.** Ingredients spent, nothing gained. Passes a glance, because
   the refusal path is where the attention went. *"You spent the coal. What did you get?"*

---

## Beat 4 — The clean clone (10 minutes)

**§5.3 binds every boss and this is the half no test performs.** `dm-guide.md` §9 is the
checklist. Push it, clone it into a folder that has never seen their code, and drive it
yourself — typing things they did not think of.

The verifier is `local-repo`, so a machine will check the arithmetic. **Nobody but you will
check that it survives a stranger.**

---

## Beat 5 — Journal, and the release notes (10 minutes)

Entry 37 is the last of the area, and §5.1's rewards table pays **75 XP flat** for release
notes — the largest non-boss payout in the campaign, and the only one that is not for
writing code.

A real `CHANGELOG.md` in their repository, against a real version tag:

- what Area 3 added that Area 2 could not do
- the thing that took longest, and why
- one thing they would build differently now

The four Journal prompts still apply on top.

---

## Where they will stall

`dm-guide.md` §9, and the three above. The one that is not in the list: **starting by
writing the recipe book and stopping.** A book with no simulator around it is a dict
literal, and forty minutes disappear into choosing recipes. *"You have three recipes. What
is the first question the program has to answer?"*

---

## What you may not say

**Do not name the half-spending bug before they hit it.** It is the best thing in this
fight: a program that refuses correctly and has already broken the world, with no error
anywhere. Finding that themselves is worth more than the boss.

And when it fails — **it is a scar, recorded and displayed with pride** (§5.3). Unlimited
attempts. A boss beaten on the fourth go is worth exactly what one beaten on the first is
worth, and the record of the three failures is the more interesting half.

---

## Success condition

A stranger can clone it, type `craft` at it, and get an honest answer — including when the
answer is no.
