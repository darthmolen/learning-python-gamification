# Decisions

Short records of choices that outlive the plan that made them.

The spec (`docs/specs/`) is the document of record and settles most arguments. These files are
for the arguments it does not settle — the ones decided later, while building, that constrain
what gets built next.

## What belongs here

A decision earns a file when **at least two** of these are true:

1. **It crosses components.** One decision that lands in the content schema, the contract, and
   the UI has no single plan or package to live in.
2. **It constrains future work.** Someone six months from now will propose the thing this
   decision ruled out, and the reasoning has to survive to meet them.
3. **It records a road not taken.** The rejected option and *why* it was rejected. This is the
   part that is never written down anywhere else, and the part that is always wanted later.

## What does not belong here

- Anything the spec already says. Amend the spec instead — it is the document of record.
- Anything scoped to one plan. Plans carry their own Status, Deviations and Lessons Learned,
  and that is where a plan-shaped decision belongs.
- Anything scoped to one function. The code comment is closer to the reader and cannot drift
  from the code the way a separate file can.

Four places to look is three too many. When in doubt, it does not belong here.

## Format

Numbered, four digits, kebab-case title: `0002-weeks-are-road-markers.md`. Numbers are never
reused and files are never deleted — a decision that gets reversed is marked **Superseded** by
the number that replaced it, and stays where it is. The trail is the point.

Keep them short. If it runs past a page, the thinking is not finished.

## Why `decisions/` and not `adr/`

At Boss 7 he opens this repository and reads it (CLAUDE.md). `adr` is an acronym he would have
to look up; `decisions` is a word he already knows. The lexicon rule applies to directory names
as much as to `Area` over `Tier`.

## The index

| # | Decision | Status |
|---|---|---|
| [0001](0001-we-write-decisions-down.md) | We write decisions down, here, under these rules | Accepted |
| [0002](0002-weeks-are-road-markers.md) | Area weeks are road markers, not a schedule to be judged against | Accepted |
