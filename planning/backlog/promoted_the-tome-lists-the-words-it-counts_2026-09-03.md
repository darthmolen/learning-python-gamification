# The Tome Lists The Words It Counts

**Status:** Promoted 2026-09-04 to planning/completed/feature_the-tome-lists-the-words-it-counts_2026-09-04.md
**Date Discovered:** 2026-09-03
**Discovered During:** planning/completed/feature_the-glossary-reaches-a-reader_2026-09-03.md

## Context

The Tome tells the reader how many concepts an area teaches and never says which ones.
`TomeScreen.tsx` renders `${entry.concepts} concepts` in the area header and a total in the
syllabus rail. `ConceptList` is not imported there. The words themselves — the 95 the whole
curriculum is indexed by — appear on the Quest and Area screens and not on the screen whose job
is the syllabus.

`/api/tome` already carries `{ id, label }` per concept and, after the glossary plan, a
`definition` beside them. The data is on the wire and the screen counts it instead of showing it.

## Known Scope

A list of an area's concepts on the Tome's area page, with the definition available per entry.

The reason this is not a paragraph of work is that it is a design decision first. Ninety-five
terms across eight areas is between 6 and 20 per page, sitting on a screen that already carries a
syllabus rail, an area header, a blurb and a full lesson. Where the list goes relative to the
lesson — above it as vocabulary the reader meets first, or below it as a reference they return
to — changes what the screen is for. No pop-overs (CLAUDE.md), so an expanded definition pushes
the lesson down, and with 20 entries that is a lot of pushing.

Not decided here. Whoever picks this up decides it on the artboard before writing the component.

## Trigger for Promotion

The glossary plan lands and definitions are on the wire, so this becomes a screen design task
with no dependencies left — or the DM notices a session where the reader wanted the word list and
the Tome could not give it.
