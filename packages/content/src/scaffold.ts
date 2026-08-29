/**
 * The authoring scaffolder.
 *
 * Spec §6.10: the parent will do this more than 150 times and it should take two minutes. That
 * sets the bar precisely — **the scaffold must validate on the way out**. A template with three
 * placeholders the author has to notice and fix is not a two-minute quest, it is a two-minute
 * quest plus a run of the validator plus a hunt.
 *
 * So everything generated here is legal content: a real area manifest if the area is new, a
 * real brief, real starter and test files where the verifier needs them, and theme framings
 * already present on a boss (§5.2). The placeholders are all *prose*, which the validator
 * cannot check and a person will replace anyway.
 */

import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { z } from 'zod';
import { conceptArea } from './concepts.ts';
import { checkContent } from './validate.ts';
import { parseContentItem, type Kind, type Area } from './schema.ts';

/** The verifier kinds a scaffold can wire up, by their §6.3 names. */
export type VerifierType = 'hidden-tests' | 'local-repo' | 'peer-signoff' | 'git-signal';

export interface ScaffoldOptions {
  readonly root: string;
  readonly id: string;
  readonly title: string;
  readonly area: Area;
  readonly concepts: readonly string[];
  readonly kind?: Kind;
  readonly dc?: number;
  readonly requires?: readonly string[];
  readonly verifier?: VerifierType;
  readonly themes?: readonly string[];
  /** Overwrite files that already exist. Off by default: content is hand-written work. */
  readonly force?: boolean;
}

export interface ScaffoldResult {
  /** Paths created, relative to the content root, in the order they were written. */
  readonly created: readonly string[];
}

/** A refusal the author can act on. Carries no stack worth showing at a prompt. */
export class ScaffoldError extends Error {}

/**
 * Spec §6.3 maps verifier to phase: hidden-tests for the Area 0–1 drills, local-repo from Area
 * 2b onward once his code reaches the server by push, and peer-signoff for a boss, which has no
 * starter to run.
 */
function defaultVerifier(kind: Kind, area: Area): VerifierType {
  if (kind === 'boss') return 'peer-signoff';
  return area <= 1 ? 'hidden-tests' : 'local-repo';
}

const DEFAULT_DC = 10;

/** Spec §5.2 — a boss offers two or three framings and the player chooses which to build. */
const PLACEHOLDER_THEMES = [
  'First framing - replace with something he would choose',
  'Second framing - replace with something else he would choose',
  'Third framing - or delete this line; two framings is legal',
];

/* -------------------------------------------------------------------------------------------
 * Templates
 * ----------------------------------------------------------------------------------------- */

function questYaml(o: Required<Pick<ScaffoldOptions, 'id' | 'title' | 'area' | 'concepts'>> & {
  kind: Kind;
  dc: number;
  requires: readonly string[];
  verifier: VerifierType;
  themes: readonly string[] | undefined;
}): string {
  const lines = [
    `id: ${o.id}`,
    `title: ${JSON.stringify(o.title)}`,
    `kind: ${o.kind}`,
    `area: ${o.area}`,
    `concepts: [${o.concepts.join(', ')}]`,
  ];
  if (o.requires.length > 0) lines.push(`requires: [${o.requires.join(', ')}]`);
  lines.push(`dc: ${o.dc}                # XP and the risk label both derive from this (§5.1)`);
  lines.push(`brief: briefs/${o.id}.md`);

  if (o.themes) {
    lines.push('', '# Spec §5.2 - he chooses the framing. Two or three, and make them his.', 'themes:');
    for (const theme of o.themes) lines.push(`  - ${JSON.stringify(theme)}`);
  }

  lines.push('', 'verifier:');
  switch (o.verifier) {
    case 'hidden-tests':
      lines.push('  type: hidden-tests');
      lines.push(`  starter: starters/${o.id}.py`);
      lines.push(`  tests: tests/${o.id}_test.py`);
      break;
    case 'local-repo':
      lines.push('  type: local-repo');
      lines.push(`  tests: tests/${o.id}_test.py`);
      break;
    case 'peer-signoff':
      lines.push('  type: peer-signoff');
      lines.push('  by: peer');
      break;
    case 'git-signal':
      lines.push('  type: git-signal');
      lines.push('  signal: commit');
      break;
  }

  return `${lines.join('\n')}\n`;
}

function briefMarkdown(title: string, kind: Kind, concepts: readonly string[]): string {
  const heading = kind === 'boss' ? `Boss - ${title}` : title;
  const bossRules = kind === 'boss'
    ? '\nNo scaffolding, no hints, and Socratic questions only (§5.3). Pick one of the framings\noffered on the card; the program underneath is the same either way.\n'
    : '';

  return `# ${heading}
${bossRules}
## What it must do

1. Describe the first observable behaviour.
2. Describe the second.

Be concrete about the output. "Prints a summary" is a specification he can get wrong three
different ways and still believe he was right.

## The tools you need

${concepts.map((c) => `- \`${c}\``).join('\n')}

## When you are stuck

Read the error message before changing anything. It names the line.
`;
}

function starterPython(title: string): string {
  return `"""${title}.

Fill in the body. Run costs nothing -- it happens in your browser. Submit sends it to the
server, which has tests you cannot read (spec §6.3).
"""


def main() -> None:
    ...


if __name__ == "__main__":
    main()
`;
}

function testsPython(id: string): string {
  return `"""Hidden tests for ${id}. Spec §6.3: these never reach the browser.

Scaffolded, not written. The failure below is deliberate -- a quest whose tests pass before
anyone has written them awards XP for nothing.
"""


def test_hidden_tests_have_not_been_written_yet() -> None:
    raise AssertionError("write the hidden tests for ${id}")
`;
}

function areaManifestYaml(area: Area): string {
  return `# Spec §5.1a - this is the denominator every progress display reads. \`partial\` means the
# total below is an estimate, and the UI must render it with a tilde: "1 of ~5".
area: ${area}
title: "Area ${area}"
authoring: partial
estimatedQuests: 5
`;
}

/* -------------------------------------------------------------------------------------------
 * Scaffolding
 * ----------------------------------------------------------------------------------------- */

function write(root: string, relative: string, contents: string, force: boolean): string {
  const absolute = join(root, relative);
  if (existsSync(absolute) && !force) {
    throw new ScaffoldError(
      `${relative} already exists. Pass --force to overwrite it, or choose a different id.`,
    );
  }
  mkdirSync(dirname(absolute), { recursive: true });
  writeFileSync(absolute, contents, 'utf8');
  return relative;
}

/**
 * Write a new content item and everything it references. Throws `ScaffoldError` — with a
 * sentence, not a stack — before writing anything, if the request would not validate.
 */
export function scaffoldQuest(options: ScaffoldOptions): ScaffoldResult {
  const root = resolve(options.root);
  const kind = options.kind ?? 'quest';
  const dc = options.dc ?? DEFAULT_DC;
  const requires = options.requires ?? [];
  const verifier = options.verifier ?? defaultVerifier(kind, options.area);
  const themes = kind === 'boss' ? (options.themes ?? PLACEHOLDER_THEMES) : options.themes;

  /* Refuse before writing. A half-written quest is worse than a rejected one. */

  if (options.concepts.length === 0) {
    throw new ScaffoldError('a quest needs at least one concept tag — it is the unit of review (§5.4)');
  }

  for (const concept of options.concepts) {
    const taught = conceptArea(concept);
    if (taught === undefined) {
      throw new ScaffoldError(
        `"${concept}" is not a known concept tag. Pick one from packages/content/src/concepts.ts, ` +
          'or add it there if the curriculum really teaches it.',
      );
    }
    if (taught > options.area) {
      throw new ScaffoldError(
        `"${concept}" is first taught in area ${taught}, so an area ${options.area} item may not tag it. ` +
          `Drop the tag, or author this as an area ${taught} item.`,
      );
    }
  }

  const item = {
    id: options.id,
    title: options.title,
    kind,
    area: options.area,
    concepts: [...options.concepts],
    ...(requires.length > 0 ? { requires: [...requires] } : {}),
    dc,
    brief: `briefs/${options.id}.md`,
    ...(themes ? { themes: [...themes] } : {}),
    verifier:
      verifier === 'hidden-tests'
        ? { type: verifier, starter: `starters/${options.id}.py`, tests: `tests/${options.id}_test.py` }
        : verifier === 'local-repo'
          ? { type: verifier, tests: `tests/${options.id}_test.py` }
          : verifier === 'peer-signoff'
            ? { type: verifier, by: 'peer' }
            : { type: verifier, signal: 'commit' },
  };

  try {
    parseContentItem(item);
  } catch (error) {
    if (!(error instanceof z.ZodError)) throw error;
    const first = error.issues[0]!;
    throw new ScaffoldError(
      `that would not validate: ${first.path.join('.') || '(root)'} ${first.message}`,
    );
  }

  if (existsSync(join(root, 'quests', `${options.id}.yml`)) && !options.force) {
    throw new ScaffoldError(
      `quests/${options.id}.yml already exists. Choose a different id, or pass --force.`,
    );
  }
  if (existsSync(root) && checkContent(root).items.some((existing) => existing.id === options.id)) {
    throw new ScaffoldError(`the id "${options.id}" already exists in this content root.`);
  }

  /* Write. */

  const force = options.force ?? false;
  const yaml = questYaml({
    id: options.id,
    title: options.title,
    area: options.area,
    concepts: [...options.concepts],
    kind,
    dc,
    requires,
    verifier,
    themes,
  });

  const created: string[] = [
    write(root, `quests/${options.id}.yml`, yaml, force),
    write(root, `briefs/${options.id}.md`, briefMarkdown(options.title, kind, options.concepts), force),
  ];

  if (verifier === 'hidden-tests') {
    created.push(write(root, `starters/${options.id}.py`, starterPython(options.title), force));
  }
  if (verifier === 'hidden-tests' || verifier === 'local-repo') {
    created.push(write(root, `tests/${options.id}_test.py`, testsPython(options.id), force));
  }

  // Without a manifest the area has no denominator (§5.1a) and the validator says so, which
  // would break the promise that a fresh scaffold validates.
  const manifest = `areas/area-${options.area}.yml`;
  if (!existsSync(join(root, manifest))) {
    created.push(write(root, manifest, areaManifestYaml(options.area), force));
  }

  return { created };
}
