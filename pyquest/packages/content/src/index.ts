export {
  CONCEPTS,
  CONCEPT_IDS,
  conceptArea,
  getConcept,
  isKnownConcept,
  type Concept,
} from './concepts.ts';

export {
  ContentItemSchema,
  DEFAULT_MEDALS,
  DifficultyClassSchema,
  KindSchema,
  MAX_DC,
  MEDALS,
  MedalSchema,
  MIN_DC,
  AREAS,
  AreaManifestSchema,
  AreaSchema,
  VerifierSchema,
  PracticeSchema,
  PracticeManifestSchema,
  medalsFor,
  parseContentItem,
  parseAreaManifest,
  parsePracticeManifest,
  type ContentItem,
  type Kind,
  type Medal,
  type Area,
  type AreaManifest,
  type Practice,
  type PracticeManifest,
  type Verifier,
} from './schema.ts';

export { parseGlossary } from './glossary.ts';
export { parseMarks, stripMarks, type Mark } from './marks.ts';

export {
  checkContent,
  findPrerequisiteCycle,
  formatIssues,
  contentRootsFrom,
  validateContent,
  type ContentIssue,
  type ContentSet,
  type LoadedPractice,
  type Locator,
  type ValidationRule,
  type ContentRoots,
  type ContentSource,
} from './validate.ts';

export {
  ScaffoldError,
  scaffoldQuest,
  type ScaffoldOptions,
  type ScaffoldResult,
  type VerifierType,
} from './scaffold.ts';
