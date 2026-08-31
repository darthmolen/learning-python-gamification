# 0005 — A heading names what follows it

**Status:** Accepted
**Date:** 2026-08-31

## Context

The lessons published to the Field Manual grew a house style nobody chose. Thirteen headings
across seven lessons had picked up a comma and a second clause:

```
## Lists change, and that is the point
## Defaults, so the common case is short
## Context managers, and why `with`
## pytest — proving it, instead of hoping
## The debugger, properly
## Refactoring, with a net
```

Read them as a list and the shape is obvious. Each names a subject, then buys a second breath to
tell you how to feel about it. That second breath is the tell. It is the register of a thing
selling itself — *but wait, there's more* — and it is not what these documents are.

**The parent named it before the pattern was measured**, and was right about the cause:

> I am not an infomercial and am not asking for prayers and likes. Yes, you were born of the
> Internet as it is now, I was not.

That is worth recording as more than a preference. **The reader is one learner between eleven
and fourteen who did not ask for any of this.** A heading that performs enthusiasm is asking him
for a reaction. A heading that names what follows it is doing him a service: it tells him where
he is, lets him skip what he already knows, and lets him find the thing again in three weeks
when he has forgotten where it was. Every heading is also a table-of-contents entry and an
anchor in a published page.

There is a second reason, narrower and just as real. §2.3's diagnosis of every platform surveyed
is graduates who cannot ship, having been kept engaged rather than taught. Prose that sells
itself is the texture of exactly those platforms. The curriculum should not sound like the thing
it exists to be an alternative to.

## Decision

**A heading names what follows it. It is not an argument for reading on.**

A heading must be one of two things:

1. **The name of what is about to be read** — `The first line`, `Reading an error`,
   `A square through repetition`.
2. **A plain sentence that is true** — `A list is things in order`, `Lists change`.

And it must survive being read aloud flatly, with no emphasis available to rescue it.

### Commas

**No comma that joins a clause.** That comma is where the editorialising gets in, and removing
it forces the choice the heading was avoiding: name the subject, or make the claim. Not both.

```
Lists change, and that is the point   ->  Lists change
Defaults, so the common case is short ->  Defaults
The debugger, properly                ->  The debugger
Refactoring, with a net               ->  Refactoring under test
```

**A comma that lists is fine**, because it is naming the subject rather than appending an
opinion about it:

```
## and, or, not
## `in`, `len`, `sorted`, `min`, `max`
```

The difference is testable. If the text after the comma could be deleted and the heading would
still say what the section is about, the comma is joining a clause and must go.

### Dashes

**One em dash is allowed, to define the term the heading names**, which is a service to the
reader rather than a pitch:

```
## Variables — giving something a name
## f-strings — putting values inside text
```

It defines. It does not comment. `pytest — proving it, instead of hoping` fails on both counts:
the dash introduces an opinion, not a definition, and there is a comma behind it.

**The dash is the only mark for this.** A colon does the same job and having two ways invites a
third — `Scope: what a function can see` became `Scope — what a function can see`, and
`When things go wrong: try / except` became `try / except — catching a failure`, which also
stopped burying the term the section is actually about.

### Everything else

No exclamation marks. No questions the section then answers. No second person in a heading — no
`What you need to know about lists`. No promises of value: nothing is *essential*, *powerful*,
*the secret to* or *what nobody tells you*.

## Consequences

Thirteen headings change. One of them, `## Reading a traceback, second pass`, loses information
worth keeping and becomes `## Reading a traceback again` — the ordinal was doing real work and
the fix is a word rather than a comma.

**This governs the learner-facing curriculum**: `curriculum/**/lesson.md`, `lesson.draft.md`,
briefs, and session material a learner reads. It does not reach planning documents, ADRs or
commit messages, where a heading arguing its own case is often exactly right — this file's own
headings would fail the rule and should.

**It is not enforced by a test, and that is deliberate.** The no-game gate can check for a
vocabulary list because `dc` and `medal` are a closed set. Register is not. A regular expression
that failed a heading for containing a comma would fail `## and, or, not`, and a rule that fires
on the honest case teaches people to work around it. This is a rule for authors and reviewers.

## The road not taken

**A style guide in `curriculum/README.md` rather than a decision here.** Rejected because the
question is not "how do we write" but "who is the reader and what does he owe us" — and the
answer, *nothing*, is the same answer that settles the Journal's format and the no-game gate. It
constrains future work: someone will eventually propose a livelier heading to make a dry area
more appealing, and this is what meets them.

**A lint rule.** Rejected above, for the reason it would have to be wrong to be strict.
