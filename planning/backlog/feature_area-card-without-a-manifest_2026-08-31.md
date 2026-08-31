# An area card with no manifest — the test that authored content outgrew

**Status:** Backlog
**Date Discovered:** 2026-08-31
**Discovered During:** `planning/in-progress/feature_curriculum-foundation_2026-08-31.md`

## Context

`apps/api/tests/server.test.ts` held a test asserting that the campaign view draws a card for
an area whose manifest carries no identity — no title, no weeks — without an identity block
and without failing. That is spec §5.1a honesty at the API boundary: an unauthored area is
still a real area, and the map must show it rather than hide it or crash.

**It was asserted against authored content, and the content moved.** When the area-0 track
landed, `content/areas/area-0.yml` gained a `title`, `weeks` and a `blurb` — so area 0 now has
an identity and the test's premise stopped being true:

```
AssertionError: expected { area: 0, title: "First Light", weeks: {...} } to be undefined
```

All eight areas now carry manifests, so there is no longer any area in the authored tree that
can stand in for "unauthored". The test could not be repaired by pointing it at a different
area; the case it guards has no representative left in real content.

**This was already failing on `main` before the `curriculum-foundation` branch existed** —
confirmed by stashing that branch's work and re-running against a clean tree. It was deleted
rather than fixed on that branch because the fix is a design decision, not an edit, and it
belongs to the api track.

**The class of failure matters more than this instance.** A test whose premise is supplied by
authored content will silently stop testing what it names the moment an author does their job.
This is the same shape as the Field Manual's `\b` gate that passed while measuring nothing, and
the `vite build` that sits in no gate at all — a check that looks green and is not looking.

## Known Scope

The deleted test, verbatim, so the intent is not reconstructed from memory:

```ts
it('draws an area whose manifest carries no weeks, without an identity and without failing', async () => {
  const response = await app.inject({ method: 'GET', url: `/api/players/${ADA}/campaign` });
  const view = CampaignViewSchema.parse(response.json());
  expect(view.areas[0]?.identity).toBeUndefined();
  expect(view.areas[1]?.identity?.title).toBe('Control');
});
```

It sat in `describe('the reads')` in `pyquest/apps/api/tests/server.test.ts`, directly after
`draws the whole map in one request`. `ADA` and `CampaignViewSchema` are already in scope there.

What a repair has to decide:

- **Where the unauthored area comes from.** A fixture content root with a deliberate gap is the
  obvious answer, and it makes the test independent of authoring forever. The cost is that the
  api tests currently read the real tree, so this introduces a second source.
- **Whether the second assertion survives.** `areas[1].identity.title === 'Control'` is the
  paired positive case — an area *with* a manifest renders one. That half still passes today
  and is worth keeping, wherever it lands.
- **Whether other api tests share the flaw.** This one was found by accident. A sweep for
  assertions whose premise is authored rather than fixed is the wider job, and probably the more
  valuable one.

## Trigger for Promotion

Whichever comes first:

- The api track picks up work in `server.test.ts` for any reason — repair it while it is open.
- `curriculum-foundation` merges. That branch moves the content root, and the api tests read it;
  they will need attention at that moment anyway.
- Any further "green but not looking" finding lands, at which point the sweep this stub proposes
  is worth doing as one piece of work rather than three.
