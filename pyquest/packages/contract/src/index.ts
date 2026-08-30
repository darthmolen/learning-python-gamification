/**
 * `packages/contract` — the shapes the API returns and the SPA consumes.
 *
 * This package exists so that "the SPA is not blocked by the API" is safe rather than merely
 * true. Without it the SPA invents stub shapes, the API invents response shapes, and the two
 * meet for the first time at integration. Both build against this instead.
 *
 * It holds schemas and nothing else. No logic, no I/O, no engine import: the engine returns
 * plain data that satisfies these shapes, and a test parses engine output through them. That
 * direction matters — a build edge from the engine to here would put a dependency on the one
 * component §6.7 requires to stay trivially testable.
 *
 * It does depend on `@pyquest/content`, deliberately. Areas, medals and the 5–30 DC scale are
 * already defined there, pinned to §5.1, §5.2 and §5.10, and a second definition of `Medal` in
 * this package is a second definition that can disagree with the first. Endpoint payloads reuse
 * the content vocabulary rather than restating it.
 *
 * ## The modules, and who owns them
 *
 * This file is re-exports and nothing else. The schemas live in one module per owner, because
 * three Lane A tracks need to add to this package and one file cannot take three writers:
 *
 * | Module | Holds | Owner |
 * |---|---|---|
 * | `payloads.ts` | what the API returns | `main` |
 * | `progress.ts` | the rows the repository returns | `db` |
 * | `endpoints.ts` | routes, request bodies, the error shape | `api` |
 * | `primitives.ts` | what all three need | `main` |
 *
 * The two owned modules are re-exported wholesale, and that is deliberate rather than lazy:
 * `db` adds seven row shapes and `api` adds a route table without either one editing this file.
 * A named list here would put both tracks back in `main`'s file, which is the collision the
 * split was made to end.
 *
 * `primitives.ts` is named export by export for the opposite reason. It holds `ContentIdSchema`,
 * `ConceptIdSchema` and `CountSchema`, which siblings import and consumers have never had; a
 * wholesale re-export would publish all three by accident. What this file names is the public
 * surface, and the difference between the two lists is the whole reason the list is written out.
 */

export * from './payloads.ts';
export * from './progress.ts';

export {
  INVASION_QUEUE_CAP,
  PRESENTATION_FIELDS,
  TOP_RUNG_BOUND,
  type PresentationField,
} from './primitives.ts';
