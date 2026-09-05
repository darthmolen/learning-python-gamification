/**
 * `@pyquest/content/browser` — everything a browser may safely bundle.
 *
 * The default entry, `.`, is the complete package: it re-exports `validate.ts` and
 * `scaffold.ts`, which read the filesystem because validating a content root and scaffolding a
 * quest are things you do on a machine with one. `apps/api` imports `checkContent` through it
 * and must keep being able to.
 *
 * But `packages/contract` imports four schemas from here, and anything that bundles the
 * contract for a browser pulled `node:fs` in behind them — three deliberate links making one
 * accidental chain. The SPA found it the worst way: not at build time, where someone might have
 * been watching, but as a runtime error in the dev server.
 *
 * So this entry exists, and it holds only the two modules that describe content rather than
 * read it. Nothing here may import `node:` anything, and `tests/browser-entry.test.ts` walks
 * this graph to prove it rather than trusting the next author to remember.
 */

export {
  CONCEPTS,
  CONCEPT_IDS,
  conceptArea,
  getConcept,
  isKnownConcept,
  type Concept,
} from './concepts.ts';

/**
 * Marks are pure string work — no `node:` anything — and the SPA is the surface that renders them
 * as controls rather than stripping them, so this entry is where it reaches them from.
 */
export { parseMarks, stripMarks, type Mark } from './marks.ts';

/** Pure string work too. The SPA suite reads the authored glossaries through it. */
export { parseGlossary } from './glossary.ts';

export {
  AREAS,
  AreaManifestSchema,
  AreaSchema,
  ContentItemSchema,
  DEFAULT_MEDALS,
  DifficultyClassSchema,
  KindSchema,
  MAX_DC,
  MEDALS,
  MIN_DC,
  MedalSchema,
  VerifierSchema,
  medalsFor,
  parseAreaManifest,
  parseContentItem,
  type Area,
  type AreaManifest,
  type ContentItem,
  type Kind,
  type Medal,
  type Verifier,
} from './schema.ts';
