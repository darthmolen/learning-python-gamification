/**
 * The content loader and validator.
 *
 * Spec §6.10 asks this to prove three things: every YAML file parses, the prerequisite graph
 * is acyclic, and every concept tag is known. It proves a few more, because the cost of a
 * check here is one function and the cost of missing one is a quest that is silently
 * unreachable for a week.
 *
 * Two decisions shape everything below.
 *
 * **It reports, it does not throw.** The parent will run this more than 150 times (§6.10).
 * A validator that stops at the first problem turns one authoring session into N runs, so
 * every check contributes to one list and the run always reaches the end.
 *
 * **A file that fails the schema still contributes its identity.** The graph checks read the
 * raw `id` and `requires` of every file that parsed as YAML, so a typo in `concepts` does not
 * also produce a fake "dangling prerequisite" against the quest that legitimately requires it.
 * Cascade noise is how a useful error gets buried.
 */

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { LineCounter, parseDocument, type Document } from 'yaml';
import { z } from 'zod';
import { CONCEPTS, conceptArea } from './concepts.ts';
import { parseGlossary } from './glossary.ts';
import {
  parseContentItem,
  parseAreaManifest,
  type ContentItem,
  type AreaManifest,
} from './schema.ts';

/* -------------------------------------------------------------------------------------------
 * Issues
 * ----------------------------------------------------------------------------------------- */

/**
 * What went wrong, named. The rule is part of the contract because tests assert on it and
 * because a rule name is the thing an author can search for twice.
 */
export type ValidationRule =
  | 'yaml-parse'
  | 'schema'
  | 'duplicate-id'
  | 'dangling-prerequisite'
  | 'prerequisite-cycle'
  | 'missing-file'
  | 'concept-above-area'
  | 'missing-area-manifest'
  | 'pace-in-lesson'
  | 'glossary-gap';

export interface ContentIssue {
  /** Path relative to the content root, with forward slashes on every platform. */
  readonly file: string;
  /** 1-based, where the YAML told us. Absent when the problem is not at a point in a file. */
  readonly line?: number;
  readonly column?: number;
  /** The content id, where the file got far enough to have one. */
  readonly id?: string;
  readonly rule: ValidationRule;
  /** What is wrong, in a sentence. */
  readonly message: string;
  /** What to do about it. Every issue carries one; an error without a next action is a riddle. */
  readonly fix: string;
}

/**
 * Where content is read from.
 *
 * `curriculum` holds every educational artifact — manifests, briefs, starters, hidden tests.
 * `game` holds the overlay: quests, bosses, transcripts. They are separate trees so that
 * "the curriculum stands without the game" is a deletion test rather than a claim, and
 * `tests/two-roots.test.ts` performs that deletion.
 *
 * A bare string means both roots are the same directory, which is the pre-split layout and
 * still what the API, the CLI and the live site pass today.
 */
export interface ContentRoots {
  readonly curriculum: string;
  readonly game: string;
}

export type ContentSource = string | ContentRoots;

/**
 * The two roots as they sit in a checkout, or in the container: `curriculum/` and `game/` as
 * siblings under one directory. Callers name that directory once rather than assembling two
 * paths each, and the layout is stated here instead of in nine call sites.
 */
export function contentRootsFrom(base: string): ContentRoots {
  const abs = resolve(base);
  return { curriculum: join(abs, 'curriculum'), game: join(abs, 'game') };
}

/** One resolved pair. A bare string collapses to the same absolute path twice. */
function resolveRoots(source: ContentSource): { curriculum: string; game: string } {
  if (typeof source === 'string') {
    const abs = resolve(source);
    return { curriculum: abs, game: abs };
  }
  return { curriculum: resolve(source.curriculum), game: resolve(source.game) };
}

/** What a content root holds, once read. */
export interface ContentSet {
  readonly root: string;
  /** Items that satisfied the schema. Everything downstream reads only these. */
  readonly items: readonly ContentItem[];
  readonly manifests: readonly AreaManifest[];
  readonly issues: readonly ContentIssue[];
}

/* -------------------------------------------------------------------------------------------
 * Reading the tree
 * ----------------------------------------------------------------------------------------- */

/** A file's identity as the graph checks see it, whether or not the schema accepted it. */
interface RawRecord {
  readonly id: string;
  readonly requires: readonly string[];
  readonly file: string;
}

const toPosix = (p: string): string => p.split('\\').join('/');

const isYaml = (p: string): boolean => p.endsWith('.yml') || p.endsWith('.yaml');

/** Every YAML file under `root`, relative and posix-separated, in a stable order. */
function yamlFilesUnder(root: string): string[] {
  if (!existsSync(root)) return [];
  return readdirSync(root, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile() && isYaml(entry.name))
    .map((entry) => toPosix(join(entry.parentPath, entry.name).slice(root.length + 1)))
    .sort();
}

/**
 * A YAML file and the tree it came from, so a path can be resolved and an issue reported
 * against the right root. `file` stays relative to its own root — that is what an author sees
 * in the report and what they can act on.
 */
interface SourceFile {
  readonly file: string;
  readonly root: string;
}

/**
 * Both trees, deduplicated. A bare string resolves the two roots to the same directory, and
 * reading it twice would report every issue twice — so identical roots are read once.
 */
function yamlFilesAcross(roots: { curriculum: string; game: string }): SourceFile[] {
  const trees =
    roots.curriculum === roots.game ? [roots.curriculum] : [roots.curriculum, roots.game];
  return trees.flatMap((root) => yamlFilesUnder(root).map((file) => ({ file, root })));
}

/**
 * Is this file an area manifest?
 *
 * `area-N/area.yml`, inside the area it describes. There is one convention and it does not
 * depend on a directory name above it: the transitional `areas/` clause went out with the
 * directory when the tree moved, and the fixtures moved with it so that no second form
 * survives in test data either.
 */
function isManifestPath(file: string): boolean {
  return file === 'area.yml' || file.endsWith('/area.yml');
}

/**
 * Where a zod path lands in the source file. The point of carrying a `LineCounter` around: a
 * ZodError knows `concepts[1]` and a human knows line 5, and only the document maps between.
 */
function positionOf(
  doc: Document,
  counter: LineCounter,
  path: readonly PropertyKey[],
): { line?: number; column?: number } {
  // Walk up the path until something in the document actually exists — a mistyped key has no
  // node of its own, but its parent object does, and the parent's line is still the right one.
  for (let end = path.length; end >= 0; end--) {
    const node: unknown = end === 0 ? doc.contents : doc.getIn(path.slice(0, end) as never, true);
    const range = (node as { range?: [number, number, number] } | null)?.range;
    if (range) {
      const pos = counter.linePos(range[0]);
      return { line: pos.line, column: pos.col };
    }
  }
  return {};
}

/**
 * Where a field lives in a given file. Every issue that can point at a line does, because
 * "which of the twelve lines" is the next question after "which file", and the graph checks
 * know the answer as surely as the schema ones do.
 */
export type Locator = (file: string, path: readonly PropertyKey[]) => {
  line?: number;
  column?: number;
};

/** The scalar the author actually wrote at `path`, for quoting back at them. */
function valueAt(doc: Document, path: readonly PropertyKey[]): string | undefined {
  const node: unknown = doc.getIn(path as never, true);
  const value = (node as { value?: unknown } | null)?.value;
  return typeof value === 'string' || typeof value === 'number' ? String(value) : undefined;
}

/** `concepts[1]`, `verifier.starter`, or `(root)` — how an author would point at the field. */
function pathLabel(path: readonly PropertyKey[]): string {
  if (path.length === 0) return '(root)';
  return path.reduce<string>(
    (acc, key) =>
      typeof key === 'number' ? `${acc}[${key}]` : acc === '' ? String(key) : `${acc}.${String(key)}`,
    '',
  );
}

/** The remedy for a schema complaint, chosen by what the schema complained about. */
function fixForSchemaIssue(issue: z.ZodIssue): string {
  if (issue.message.includes('known concept tag')) {
    return 'use an id from packages/content/src/concepts.ts, or add the concept there if the curriculum really teaches it';
  }
  if (issue.code === 'unrecognized_keys') {
    return 'remove the key, or check it against the field list in packages/content/src/schema.ts';
  }
  return `correct ${pathLabel(issue.path)} to match the contract in packages/content/src/schema.ts`;
}

/** Turn a ZodError into per-field issues an author can act on, rather than a dumped object. */
function schemaIssues(
  error: z.ZodError,
  file: string,
  id: string | undefined,
  doc: Document,
  counter: LineCounter,
): ContentIssue[] {
  return error.issues.map((issue) => {
    const label = pathLabel(issue.path);
    const written = valueAt(doc, issue.path);
    const subject = written === undefined ? label : `${label}: "${written}"`;
    return {
      file,
      id,
      rule: 'schema' as const,
      ...positionOf(doc, counter, issue.path),
      message: `${subject} ${issue.message}`,
      fix: fixForSchemaIssue(issue),
    };
  });
}

/* -------------------------------------------------------------------------------------------
 * The prerequisite graph
 * ----------------------------------------------------------------------------------------- */

/**
 * One cycle in the `requires` graph, as the chain that closes it — `a -> b -> c -> a`, with the
 * first id repeated at the end. `undefined` when the graph is acyclic.
 *
 * Depth-first with a *visiting* mark rather than a plain seen-set: a diamond reaches the same
 * node twice down two paths and is not a cycle, and a seen-set cannot tell the difference.
 */
export function findPrerequisiteCycle(
  requires: ReadonlyMap<string, readonly string[]>,
): string[] | undefined {
  const state = new Map<string, 'visiting' | 'done'>();
  const stack: string[] = [];

  const visit = (id: string): string[] | undefined => {
    const seen = state.get(id);
    if (seen === 'done') return undefined;
    if (seen === 'visiting') return [...stack.slice(stack.indexOf(id)), id];

    state.set(id, 'visiting');
    stack.push(id);
    for (const next of requires.get(id) ?? []) {
      const found = visit(next);
      if (found) return found;
    }
    stack.pop();
    state.set(id, 'done');
    return undefined;
  };

  for (const id of requires.keys()) {
    const found = visit(id);
    if (found) return found;
  }
  return undefined;
}

/**
 * Every cycle, not just the first. After reporting one, the edge that closed it is removed and
 * the search runs again, so two unrelated cycles are two errors rather than two runs.
 */
function allCycles(requires: ReadonlyMap<string, readonly string[]>): string[][] {
  const working = new Map<string, string[]>(
    [...requires].map(([id, reqs]) => [id, [...reqs]]),
  );
  const cycles: string[][] = [];

  for (;;) {
    const cycle = findPrerequisiteCycle(working);
    if (!cycle) return cycles;
    cycles.push(cycle);

    // Break the closing edge — the last hop back to the start — and look for another.
    const from = cycle[cycle.length - 2]!;
    const to = cycle[cycle.length - 1]!;
    working.set(from, (working.get(from) ?? []).filter((r) => r !== to));
  }
}

/* -------------------------------------------------------------------------------------------
 * Loading
 * ----------------------------------------------------------------------------------------- */

/**
 * Read and check a content root. Never throws for content reasons — a malformed file is an
 * issue in the list, not an exception out of the run.
 */
export function checkContent(source: ContentSource): ContentSet {
  const roots = resolveRoots(source);
  const abs = roots.curriculum;
  const issues: ContentIssue[] = [];
  const items: ContentItem[] = [];
  const manifests: AreaManifest[] = [];
  const records: RawRecord[] = [];
  const sources = new Map<string, { doc: Document; counter: LineCounter }>();

  for (const { file, root } of yamlFilesAcross(roots)) {
    const counter = new LineCounter();
    const doc = parseDocument(readFileSync(join(root, file), 'utf8'), { lineCounter: counter });
    sources.set(file, { doc, counter });

    if (doc.errors.length > 0) {
      for (const error of doc.errors) {
        issues.push({
          file,
          line: error.linePos?.[0]?.line,
          column: error.linePos?.[0]?.col,
          rule: 'yaml-parse',
          message: `will not parse as YAML — ${error.message.split('\n')[0]}`,
          fix: 'check the indentation and any unclosed bracket or quote on the line above',
        });
      }
      continue;
    }

    const raw: unknown = doc.toJS();
    const isManifest = isManifestPath(file);
    const id =
      typeof (raw as { id?: unknown })?.id === 'string'
        ? ((raw as { id: string }).id)
        : undefined;

    if (!isManifest && id !== undefined) {
      const declared = (raw as { requires?: unknown }).requires;
      records.push({
        id,
        requires: Array.isArray(declared) ? declared.filter((r) => typeof r === 'string') : [],
        file,
      });
    }

    try {
      if (isManifest) manifests.push(parseAreaManifest(raw));
      else items.push(parseContentItem(raw));
    } catch (error) {
      if (!(error instanceof z.ZodError)) throw error;
      issues.push(...schemaIssues(error, file, id, doc, counter));
    }
  }

  const locate: Locator = (file, path) => {
    const source = sources.get(file);
    return source ? positionOf(source.doc, source.counter, path) : {};
  };

  issues.push(...identityIssues(records, locate));
  issues.push(...graphIssues(records, locate));
  issues.push(...referenceIssues(roots, items, byId(records), locate));
  issues.push(...conceptAreaIssues(items, byId(records), locate));
  issues.push(...manifestIssues(items, manifests, byId(records), locate));
  issues.push(...paceIssues(roots));
  issues.push(...glossaryIssues(roots));

  issues.sort(
    (a, b) => a.file.localeCompare(b.file) || (a.line ?? 0) - (b.line ?? 0) || a.rule.localeCompare(b.rule),
  );

  return { root: abs, items, manifests, issues };
}

/** The file each id was declared in, for pointing an issue at the right place. */
function byId(records: readonly RawRecord[]): ReadonlyMap<string, RawRecord> {
  return new Map(records.map((r) => [r.id, r]));
}

/* -------------------------------------------------------------------------------------------
 * The checks
 * ----------------------------------------------------------------------------------------- */

/** No two files may claim the same id: `requires` and every progress row read it as identity. */
function identityIssues(records: readonly RawRecord[], locate: Locator): ContentIssue[] {
  const claims = new Map<string, RawRecord[]>();
  for (const record of records) {
    claims.set(record.id, [...(claims.get(record.id) ?? []), record]);
  }

  return [...claims]
    .filter(([, files]) => files.length > 1)
    .map(([id, files]) => ({
      file: files[0]!.file,
      id,
      ...locate(files[0]!.file, ['id']),
      rule: 'duplicate-id' as const,
      message: `id "${id}" is claimed by ${files.length} files: ${files.map((f) => f.file).join(', ')}`,
      fix: 'give one of them a different id — ids are the identity progress rows are keyed by',
    }));
}

/** A prerequisite that resolves to nothing, and any cycle. Both lock a quest forever (§5.2). */
function graphIssues(records: readonly RawRecord[], locate: Locator): ContentIssue[] {
  const known = new Set(records.map((r) => r.id));
  const issues: ContentIssue[] = [];

  for (const record of records) {
    for (const [index, required] of record.requires.entries()) {
      if (known.has(required)) continue;
      issues.push({
        file: record.file,
        id: record.id,
        ...locate(record.file, ['requires', index]),
        rule: 'dangling-prerequisite',
        message: `requires "${required}", which is not the id of any item in this content root`,
        fix: `fix the spelling, or author "${required}" — until it exists this item can never unlock`,
      });
    }
  }

  const graph = new Map<string, readonly string[]>(
    records.map((r) => [r.id, r.requires.filter((id) => known.has(id))]),
  );
  const files = byId(records);

  for (const cycle of allCycles(graph)) {
    const file = files.get(cycle[0]!)?.file ?? cycle[0]!;
    issues.push({
      file,
      id: cycle[0],
      ...locate(file, ['requires']),
      rule: 'prerequisite-cycle',
      message: `prerequisite cycle: ${cycle.join(' -> ')}`,
      fix: `remove one link in that chain — every item in it is waiting on the next, so none of them will ever unlock`,
    });
  }

  return issues;
}

/** Every path an item points at must exist. A missing brief is a quest with nothing to read. */
function referenceIssues(
  roots: { curriculum: string; game: string },
  items: readonly ContentItem[],
  files: ReadonlyMap<string, RawRecord>,
  locate: Locator,
): ContentIssue[] {
  const issues: ContentIssue[] = [];

  for (const item of items) {
    /**
     * Which tree each reference resolves against, and it is not uniform. A brief, a starter and
     * a hidden test are educational artifacts and live in `curriculum/`; a transcript is the
     * game's record of a run and lives in `game/`. An item in `game/` therefore points *out* of
     * its own tree for almost everything it names, which is the rule this whole split rests on.
     */
    const referenced: Array<[PropertyKey[], string, 'curriculum' | 'game']> = [
      [['brief'], item.brief, 'curriculum'],
    ];
    if (item.verifier.type === 'hidden-tests') {
      referenced.push([['verifier', 'starter'], item.verifier.starter, 'curriculum']);
      referenced.push([['verifier', 'tests'], item.verifier.tests, 'curriculum']);
    }
    // A `local-repo` verifier's `path` names a directory in *his* repository, which this
    // machine cannot see; only the pytest specification lives here.
    if (item.verifier.type === 'local-repo') {
      referenced.push([['verifier', 'tests'], item.verifier.tests, 'curriculum']);
    }
    for (const [index, transcript] of (item.transcripts ?? []).entries()) {
      referenced.push([['transcripts', index], transcript, 'game']);
    }

    for (const [path, relative, tree] of referenced) {
      if (existsSync(join(roots[tree], relative))) continue;
      const file = files.get(item.id)?.file ?? item.id;
      issues.push({
        file,
        id: item.id,
        ...locate(file, path),
        rule: 'missing-file',
        message: `${pathLabel(path)} points at "${relative}", which does not exist in the ${tree} root`,
        fix: `create the file, or correct the path — it is relative to the ${tree} root, not to the YAML file`,
      });
    }
  }

  return issues;
}

/**
 * A quest may not tag vocabulary from an area above its own. Spec §4 orders the vocabulary, and
 * an Area 3 quest tagged `class` is tagging something the learner does not meet for eighteen
 * weeks — which would also queue an invasion (§5.4) for a concept never taught.
 */
function conceptAreaIssues(
  items: readonly ContentItem[],
  files: ReadonlyMap<string, RawRecord>,
  locate: Locator,
): ContentIssue[] {
  const issues: ContentIssue[] = [];

  for (const item of items) {
    for (const [index, concept] of item.concepts.entries()) {
      const taught = conceptArea(concept);
      if (taught === undefined || taught <= item.area) continue;
      const file = files.get(item.id)?.file ?? item.id;
      issues.push({
        file,
        id: item.id,
        ...locate(file, ['concepts', index]),
        rule: 'concept-above-area',
        message: `tags "${concept}", first taught in area ${taught}, but this item is area ${item.area}`,
        fix: `drop the tag, or move the item to area ${taught} — spec §4 orders the vocabulary and the learner has not met this one yet`,
      });
    }
  }

  return issues;
}

/* -------------------------------------------------------------------------------------------
 * Pace in learner-facing prose — ADR 0006
 * ----------------------------------------------------------------------------------------- */

/**
 * Which files this rule reaches: what a learner reads, and nothing written for a calendar.
 *
 * ADR 0006 governs lessons and briefs. It deliberately does **not** reach session plans, DM
 * guides, journal prompts or READMEs — those are written for somebody running a schedule, and
 * "in two weeks, opening this file" is exactly the sentence a DM guide should contain. Scoping
 * this wrongly would be worse than not having it: 66 honest sentences elsewhere in the
 * curriculum match this pattern, and a check that fires on them teaches authors to write around
 * the check.
 */
const readsAsLesson = (file: string): boolean =>
  /(?:^|\/)lesson\.(?:draft\.)?md$/.test(file) || /brief[^/]*\.md$/i.test(file);

/**
 * A count of calendar time: a number, then a unit a learner's pace is measured in.
 *
 * **Days, weeks, months and years only.** Minutes and seconds are not pace — Area 4's game loop
 * runs "sixty times a second", which is the subject rather than a claim about the reader — and a
 * rule that swept them up would fail the one lesson that most needs to say it.
 *
 * `next` and `last` are in the number list because they place the reader on a calendar just as
 * firmly as a digit does: "next week is the boss" is false for a learner who takes a fortnight,
 * and "next session" is both true for everybody and the better sentence. `score` is in it because
 * the parent asked for it by name, and was right to — a spelled quantifier is still a count.
 */
const PACE = new RegExp(
  String.raw`\b(?:\d+|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|` +
    String.raw`fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|` +
    String.raw`sixty|seventy|eighty|ninety|hundred|score|dozen|next|last|a few|a couple|several)` +
    String.raw`\b[\s\-]+(?:of\s+)?\b(?:day|week|month|year)s?\b(?!-)`,
  'gi',
);

/**
 * An author saying "I know, and here is why."
 *
 * ADR 0005 refused to make its rule a test because a check that has to be wrong to be strict
 * teaches people to work around it. This rule is tighter than that one but not perfect: a lesson
 * that teaches the review ladder's `+3 days` interval is naming a fact about the system rather
 * than about the reader, and it should be able to say so. The reason is required, so an exception
 * documents itself rather than becoming a silent hole.
 */
const ALLOWED = /<!--\s*pace-ok:\s*\S[^>]*-->/i;

/**
 * Comment out what is not prose before looking for pace in it.
 *
 * A fenced block is code the learner types, and `datetime.timedelta(days=7)` is not a claim about
 * how long an area takes. Stripping fences first is the difference between a rule about writing
 * and a rule about Python.
 */
const prose = (markdown: string): string =>
  markdown.replace(/```[\s\S]*?```/g, (block) => block.replace(/[^\n]/g, ' '));

/**
 * §5.6's Journal and ADR 0006's lessons agree: the game owns pace, the lesson owns teaching.
 *
 * The check is whole-file rather than first-paragraph. All six openings that prompted the ADR
 * were in the first sentence, but three of the five violations this first caught were not —
 * `mandala-brief.md` says "next week is the boss" three quarters of the way down, and it is just
 * as false for a learner who took a fortnight over the rehearsal.
 */
function paceIssues(roots: { curriculum: string; game: string }): ContentIssue[] {
  const trees = roots.curriculum === roots.game ? [roots.curriculum] : [roots.curriculum, roots.game];
  const issues: ContentIssue[] = [];

  for (const root of trees) {
    if (!existsSync(root)) continue;
    const files = readdirSync(root, { recursive: true, withFileTypes: true })
      .filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
      .map((entry) => toPosix(join(entry.parentPath, entry.name).slice(root.length + 1)))
      .filter(readsAsLesson)
      .sort();

    for (const file of files) {
      const lines = prose(readFileSync(join(root, file), 'utf8')).split(/\r?\n/);
      lines.forEach((line, index) => {
        if (ALLOWED.test(line)) return;
        for (const match of line.matchAll(PACE)) {
          issues.push({
            file,
            line: index + 1,
            rule: 'pace-in-lesson',
            message: `"${match[0]}" places the reader on a calendar, and a lesson may only place him in the sequence (ADR 0006)`,
            fix: 'say it in sequence — "next session", "by the end of this area", "the first time you go looking" — or, if the duration is the subject rather than the reader\'s pace, mark the line `<!-- pace-ok: why -->`',
          });
        }
      });
    }
  }

  return issues;
}

/**
 * Every concept an area teaches has a definition, and every definition names a real concept.
 *
 * CLAUDE.md draws this edge already: authored content is validated against `concepts.ts`, and a
 * changed id has to break content rather than drift from it. A glossary is the sharpest case,
 * because the id is not merely referenced — it is the key the definition hangs on.
 *
 * Three ways to drift, all silent without this:
 *
 * * a concept with no definition is a chip the learner clicks and gets nothing from;
 * * a misspelled heading is the same failure, with a definition nobody will ever reach;
 * * a real concept defined in the wrong area's file puts the word on a page he opens before he
 *   has met it, which is the mistake `concept-above-area` already refuses for quests.
 *
 * **An area with no `glossary.md` is not an issue.** Areas are authored one at a time and the
 * file arrives with the teaching; a rule that demanded it everywhere would fail an area whose
 * lesson has not been written yet, which is the state `build.ts` is careful to allow.
 *
 * Medals live in `game/` and are deliberately not checked here. Deleting `game/` has to leave a
 * curriculum that still validates, so a curriculum rule may not depend on a file in it.
 */
function glossaryIssues(roots: { curriculum: string; game: string }): ContentIssue[] {
  const issues: ContentIssue[] = [];
  const areas = new Set(CONCEPTS.map((concept) => concept.area));

  for (const area of [...areas].sort()) {
    const file = `area-${area}/glossary.md`;
    const path = join(roots.curriculum, file);
    if (!existsSync(path)) continue;

    // `parseGlossary` rather than a regex here. The API and the Field Manual read this same file,
    // and a heading rule written three times is three chances to disagree about what a heading
    // is — silently, because each of them would still pass its own tests. `glossary.ts` says why
    // a fenced `##` is the case that makes the difference.
    const defined = [...parseGlossary(readFileSync(path, 'utf8')).keys()];

    const expected = CONCEPTS.filter((concept) => concept.area === area).map((c) => c.id);
    const missing = expected.filter((id) => !defined.includes(id));

    if (missing.length > 0) {
      issues.push({
        file,
        rule: 'glossary-gap',
        message: `no definition for ${missing.join(', ')}`,
        fix: `add a \`## <id>\` section for each, or move the concept in concepts.ts if it belongs to another area`,
      });
    }

    for (const heading of defined) {
      if (expected.includes(heading)) continue;

      const elsewhere = CONCEPTS.find((concept) => concept.id === heading);
      issues.push({
        file,
        rule: 'glossary-gap',
        message:
          elsewhere === undefined
            ? `\`${heading}\` is not a concept`
            : `\`${heading}\` is a concept of area ${elsewhere.area}, not area ${area}`,
        fix:
          elsewhere === undefined
            ? 'use an id from packages/content/src/concepts.ts, or add the concept there if the curriculum really teaches it'
            : `move the section to area-${elsewhere.area}/glossary.md`,
      });
    }
  }

  return issues;
}

/** Spec §5.1a: without a manifest an area has no denominator, so no honest progress display. */
function manifestIssues(
  items: readonly ContentItem[],
  manifests: readonly AreaManifest[],
  files: ReadonlyMap<string, RawRecord>,
  locate: Locator,
): ContentIssue[] {
  const described = new Set(manifests.map((m) => m.area));
  const authored = new Map<number, ContentItem>();
  for (const item of items) if (!authored.has(item.area)) authored.set(item.area, item);

  return [...authored]
    .filter(([area]) => !described.has(area as AreaManifest['area']))
    .map(([area, item]) => ({
      file: files.get(item.id)?.file ?? item.id,
      id: item.id,
      ...locate(files.get(item.id)?.file ?? item.id, ['area']),
      rule: 'missing-area-manifest' as const,
      message: `area ${area} has authored content but no manifest at area-${area}/area.yml`,
      fix: `add area-${area}/area.yml with a title and an authoring status — §5.1a needs a denominator to show "1 of ~5"`,
    }));
}

/* -------------------------------------------------------------------------------------------
 * Reporting
 * ----------------------------------------------------------------------------------------- */

/** Everything wrong with a content root, in file order. Empty means it is good to load. */
export function validateContent(source: ContentSource): ContentIssue[] {
  return [...checkContent(source).issues];
}

/**
 * The report. Grouped by file, because that is the order an author fixes things in, and every
 * line carries somewhere to go: the path, the id, what is wrong, and what to do.
 */
export function formatIssues(issues: readonly ContentIssue[], source: ContentSource): string {
  const roots = resolveRoots(source);
  const label = roots.curriculum === roots.game ? roots.curriculum : dirname(roots.curriculum);

  if (issues.length === 0) return `OK  no problems found in ${toPosix(label)}`;

  /**
   * An issue's `file` is relative to whichever tree it was read from, and the report has to
   * print a path a terminal will let you click. So the tree is recovered by asking which one
   * actually holds the file, rather than by threading a root through every issue: the check is
   * one `existsSync` on a path that was just read, and a wrong guess here costs a broken link
   * in a report rather than a wrong verdict.
   */
  const absolute = (file: string): string => {
    const inGame = join(roots.game, file);
    if (roots.game !== roots.curriculum && existsSync(inGame)) return inGame;
    return join(roots.curriculum, file);
  };

  const byFile = new Map<string, ContentIssue[]>();
  for (const issue of issues) {
    byFile.set(issue.file, [...(byFile.get(issue.file) ?? []), issue]);
  }

  const lines: string[] = [];
  for (const [file, fileIssues] of byFile) {
    // The absolute path first, on its own line, because that is the form a terminal will let
    // you click and an editor will let you jump to.
    lines.push(toPosix(absolute(file)));
    for (const issue of fileIssues) {
      const where =
        issue.line === undefined ? '  ' : `  ${issue.line}:${issue.column ?? 1}  `;
      lines.push(`${where}[${issue.rule}]  ${issue.id ?? '(no id)'}`);
      lines.push(`      ${issue.message}`);
      lines.push(`      fix: ${issue.fix}`);
    }
    lines.push('');
  }

  const files = byFile.size;
  lines.push(
    `FAIL  ${issues.length} problem${issues.length === 1 ? '' : 's'} in ${files} file${files === 1 ? '' : 's'}`,
  );
  return lines.join('\n');
}
