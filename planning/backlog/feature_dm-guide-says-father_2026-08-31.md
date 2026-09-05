# The DM guide says "his father", and it is now published

**Status:** Backlog
**Date Discovered:** 2026-08-31
**Discovered During:** `planning/in-progress/feature_curriculum-foundation_2026-08-31.md`, phase 6 privacy scan

## Context

`curriculum/area-2/dm-guide.md:3-4` reads:

> **Who this is for.** Whoever holds the DM seat. In Kitchen Table mode (spec §5.11) that
> is his father, who is also a player.

Two rules land on that sentence.

**The lexicon.** `CLAUDE.md` is explicit: use `peer` / `dm`, never `parent` or `son` as roles.
*"Roles are not people."* "His father" is the exact substitution the table forbids, and the
reason the table exists is that at Boss 7 the learner opens this repository and reads it.

**The repository is public, and it concerns a minor.** A relational descriptor is not a name,
so this is not an identity leak. But it is the category the standing caution is about, and
until this branch it lived only in a markdown file in a repo nobody browses. **Phase 5 changed
that**: the DM build publishes `dm-guide.md` to GitHub Pages at `/dm/area-2.html`. Unlisted —
nothing links to it — but unlisted is not private.

Found by the phase 6 privacy scan over both built artifacts. The scan's other hits were false:
every `C:\Users` occurrence is a placeholder in a teaching example (`C:\Users\you\...`,
`C:\Users\<your name>`), which is correct and should stay.

## Known Scope

**Not one sentence. Seventeen, and they are not all the same problem.** The sweep this stub
recommends was run on 2026-09-04 and the stub was understating itself — whoever picks this up
should know that before promising a one-line fix.

Three categories, and only the first is unambiguous:

1. **A person named where a role belongs** — `dm-guide.md:4`, "the DM seat … is his father".
   The lexicon violation exactly: *roles are not people*. One sentence, and the rewrite below is
   right for it.
2. **Warmth addressed to the learner** — "your dad's machine", "Dad writes here", "your dad will
   ask you for it in two weeks". Second person, in session plans, journal templates and exercise
   starters across areas 0 and 1. The lexicon governs **roles**, not whether a curriculum written
   for one household may be affectionate to the child reading it. Rewriting these would make the
   curriculum colder, and that is a voice decision for the DM rather than one the table settles.
3. **Third person about the learner** — `dm-guide.md:367` "his father's answers",
   `session-1-what-a-repository-is.md:89` "his name is about to start appearing". Between the
   two: written *about* the learner rather than *to* them, in files that publish.

The `"his name"` occurrences in `dm-guide.md:60` and `:419` are placeholders inside command
examples — the same false positive the original scan noted for the `C:\Users\you\...` paths.
They are correct and should stay.

**This is why it did not fold into the inline-glossary plan on 2026-09-04.** It looked adjacent —
same lane, same publisher, prose in the same directories — and it is not the same kind of work.
That plan renders; this one decides how the curriculum talks about a family.

The original scope, which remains right for category 1:

> In Kitchen Table mode (spec §5.11) the DM seat is held by a player who also holds the peer
> seat.

That keeps §5.11's meaning — one household, one person in both chairs — without naming a
relationship.

**Not fixed on the `curriculum-foundation` branch on purpose.** `curriculum/area-2/**` belongs
to the live `area-2` track, and that branch already has an unavoidable structural collision
with it from phase 4. Rewriting another track's authored prose on top of that is how a merge
becomes unreviewable. Moving a file is mechanical; changing what it says is not.

Worth checking at the same time, since one instance suggests a pattern rather than a slip:

```bash
grep -rniE '\b(father|dad|mother|mum|mom|son|his name|her name)\b' curriculum/
```

## Trigger for Promotion

Whichever comes first:

- The `area-2` track next opens `dm-guide.md` — fix it in place, it is one line.
- Before `curriculum-foundation` merges to `main`, **if the DM site is going to be published
  from `main`.** That is the moment the sentence goes from a file in a public repo to a page on
  a public website, and it should be a deliberate decision rather than a side effect.
- Any decision to link the DM site publicly, which would remove the "unlisted" mitigation
  entirely.
