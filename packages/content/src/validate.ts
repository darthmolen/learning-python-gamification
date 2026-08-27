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
import { join, resolve } from 'node:path';
import { LineCounter, parseDocument, type Document } from 'yaml';
import { z } from 'zod';
import { conceptTier } from './concepts.ts';
import {
  parseContentItem,
  parseTierManifest,
  type ContentItem,
  type TierManifest,
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
  | 'concept-above-tier'
  | 'missing-tier-manifest';

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

/** What a content root holds, once read. */
export interface ContentSet {
  readonly root: string;
  /** Items that satisfied the schema. Everything downstream reads only these. */
  readonly items: readonly ContentItem[];
  readonly manifests: readonly TierManifest[];
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
export function checkContent(root: string): ContentSet {
  const abs = resolve(root);
  const issues: ContentIssue[] = [];
  const items: ContentItem[] = [];
  const manifests: TierManifest[] = [];
  const records: RawRecord[] = [];
  const sources = new Map<string, { doc: Document; counter: LineCounter }>();

  for (const file of yamlFilesUnder(abs)) {
    const counter = new LineCounter();
    const doc = parseDocument(readFileSync(join(abs, file), 'utf8'), { lineCounter: counter });
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
    const isManifest = file.startsWith('tiers/');
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
      if (isManifest) manifests.push(parseTierManifest(raw));
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
  issues.push(...referenceIssues(abs, items, byId(records), locate));
  issues.push(...conceptTierIssues(items, byId(records), locate));
  issues.push(...manifestIssues(items, manifests, byId(records), locate));

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
  root: string,
  items: readonly ContentItem[],
  files: ReadonlyMap<string, RawRecord>,
  locate: Locator,
): ContentIssue[] {
  const issues: ContentIssue[] = [];

  for (const item of items) {
    const referenced: Array<[PropertyKey[], string]> = [[['brief'], item.brief]];
    if (item.verifier.type === 'hidden-tests') {
      referenced.push([['verifier', 'starter'], item.verifier.starter]);
      referenced.push([['verifier', 'tests'], item.verifier.tests]);
    }
    // A `local-repo` verifier's `path` names a directory in *his* repository, which this
    // machine cannot see; only the pytest specification lives here.
    if (item.verifier.type === 'local-repo') {
      referenced.push([['verifier', 'tests'], item.verifier.tests]);
    }
    for (const [index, transcript] of (item.transcripts ?? []).entries()) {
      referenced.push([['transcripts', index], transcript]);
    }

    for (const [path, relative] of referenced) {
      if (existsSync(join(root, relative))) continue;
      const file = files.get(item.id)?.file ?? item.id;
      issues.push({
        file,
        id: item.id,
        ...locate(file, path),
        rule: 'missing-file',
        message: `${pathLabel(path)} points at "${relative}", which does not exist in the content root`,
        fix: `create the file, or correct the path — it is relative to the content root, not to the YAML file`,
      });
    }
  }

  return issues;
}

/**
 * A quest may not tag vocabulary from a tier above its own. Spec §4 orders the vocabulary, and
 * a Tier 3 quest tagged `class` is tagging something the learner does not meet for eighteen
 * weeks — which would also queue a patrol (§5.4) for a concept never taught.
 */
function conceptTierIssues(
  items: readonly ContentItem[],
  files: ReadonlyMap<string, RawRecord>,
  locate: Locator,
): ContentIssue[] {
  const issues: ContentIssue[] = [];

  for (const item of items) {
    for (const [index, concept] of item.concepts.entries()) {
      const taught = conceptTier(concept);
      if (taught === undefined || taught <= item.tier) continue;
      const file = files.get(item.id)?.file ?? item.id;
      issues.push({
        file,
        id: item.id,
        ...locate(file, ['concepts', index]),
        rule: 'concept-above-tier',
        message: `tags "${concept}", first taught in tier ${taught}, but this item is tier ${item.tier}`,
        fix: `drop the tag, or move the item to tier ${taught} — spec §4 orders the vocabulary and the learner has not met this one yet`,
      });
    }
  }

  return issues;
}

/** Spec §5.1a: without a manifest a tier has no denominator, so no honest progress display. */
function manifestIssues(
  items: readonly ContentItem[],
  manifests: readonly TierManifest[],
  files: ReadonlyMap<string, RawRecord>,
  locate: Locator,
): ContentIssue[] {
  const described = new Set(manifests.map((m) => m.tier));
  const authored = new Map<number, ContentItem>();
  for (const item of items) if (!authored.has(item.tier)) authored.set(item.tier, item);

  return [...authored]
    .filter(([tier]) => !described.has(tier as TierManifest['tier']))
    .map(([tier, item]) => ({
      file: files.get(item.id)?.file ?? item.id,
      id: item.id,
      ...locate(files.get(item.id)?.file ?? item.id, ['tier']),
      rule: 'missing-tier-manifest' as const,
      message: `tier ${tier} has authored content but no manifest at tiers/tier-${tier}.yml`,
      fix: `add tiers/tier-${tier}.yml with a title and an authoring status — §5.1a needs a denominator to show "1 of ~5"`,
    }));
}

/* -------------------------------------------------------------------------------------------
 * Reporting
 * ----------------------------------------------------------------------------------------- */

/** Everything wrong with a content root, in file order. Empty means it is good to load. */
export function validateContent(root: string): ContentIssue[] {
  return [...checkContent(root).issues];
}

/**
 * The report. Grouped by file, because that is the order an author fixes things in, and every
 * line carries somewhere to go: the path, the id, what is wrong, and what to do.
 */
export function formatIssues(issues: readonly ContentIssue[], root: string): string {
  if (issues.length === 0) return `OK  no problems found in ${toPosix(resolve(root))}`;

  const byFile = new Map<string, ContentIssue[]>();
  for (const issue of issues) {
    byFile.set(issue.file, [...(byFile.get(issue.file) ?? []), issue]);
  }

  const lines: string[] = [];
  for (const [file, fileIssues] of byFile) {
    // The absolute path first, on its own line, because that is the form a terminal will let
    // you click and an editor will let you jump to.
    lines.push(toPosix(resolve(root, file)));
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
