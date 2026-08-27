/**
 * The concept tag registry.
 *
 * Spec §6.10 requires `validate:content` to prove that every concept tag a quest carries is
 * known. This file is that known set. It is authored directly from the tier vocabularies in
 * spec §4 — one entry per vocabulary item — and nothing else may add to it, because an
 * unrecognised tag is exactly the typo the validator exists to catch.
 *
 * Each concept records the tier that first teaches it. That turns a second class of authoring
 * mistake into a caught error: a Tier 3 quest tagged `class` is tagging vocabulary the learner
 * will not meet for eighteen weeks (spec §4, Tier 5), and the prerequisite graph cannot see
 * that on its own.
 *
 * Concepts are also the unit of spaced repetition. Spec §5.4 queues a patrol when a concept
 * passes its review interval untouched, so every id here is a thing that can come back around.
 */

export interface Concept {
  /** Stable kebab-case id. Quests reference this; renaming one is a content migration. */
  readonly id: string;
  /** How the concept renders to a player. */
  readonly label: string;
  /** The tier that first teaches it, per spec §4. */
  readonly tier: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;
}

/**
 * Tier 2 is split across two half-tiers in spec §4 — 2a The Scribe's Rite (git) and 2b Escape
 * the Sandbox (the real toolchain). They share a tier number because they share a boss.
 */
export const CONCEPTS: readonly Concept[] = [
  // Tier 0 — First Light (weeks 1–2)
  { id: 'print', label: 'print', tier: 0 },
  { id: 'variables', label: 'variables', tier: 0 },
  { id: 'int', label: 'int', tier: 0 },
  { id: 'float', label: 'float', tier: 0 },
  { id: 'str', label: 'str', tier: 0 },
  { id: 'bool', label: 'bool', tier: 0 },
  { id: 'input', label: 'input', tier: 0 },
  { id: 'f-strings', label: 'f-strings', tier: 0 },
  { id: 'reading-errors', label: 'reading errors', tier: 0 },

  // Tier 1 — Control (weeks 3–6)
  { id: 'if', label: 'if', tier: 1 },
  { id: 'elif', label: 'elif', tier: 1 },
  { id: 'else', label: 'else', tier: 1 },
  { id: 'comparison-operators', label: 'comparison operators', tier: 1 },
  { id: 'boolean-operators', label: 'boolean operators', tier: 1 },
  { id: 'while', label: 'while', tier: 1 },
  { id: 'for', label: 'for', tier: 1 },
  { id: 'range', label: 'range', tier: 1 },
  { id: 'nesting', label: 'nesting', tier: 1 },
  { id: 'accumulator-pattern', label: 'the accumulator pattern', tier: 1 },

  // Tier 2a — The Scribe's Rite (weeks 6–7)
  { id: 'repository', label: 'what a repository is', tier: 2 },
  { id: 'git-init', label: 'git init', tier: 2 },
  { id: 'git-add', label: 'git add', tier: 2 },
  { id: 'git-commit', label: 'git commit', tier: 2 },
  { id: 'git-log', label: 'the log as a story', tier: 2 },
  { id: 'git-branch', label: 'branches, lightly', tier: 2 },
  { id: 'git-push', label: 'push to origin', tier: 2 },

  // Tier 2b — Escape the Sandbox (weeks 7–8)
  { id: 'files-on-disk', label: 'files on disk', tier: 2 },
  { id: 'running-scripts', label: 'python thing.py', tier: 2 },
  { id: 'vscode', label: 'VS Code', tier: 2 },
  { id: 'venv', label: 'venv', tier: 2 },
  { id: 'pip', label: 'pip', tier: 2 },
  { id: 'tracebacks', label: 'tracebacks', tier: 2 },
  { id: 'main-guard', label: 'if __name__ == "__main__"', tier: 2 },

  // Tier 3 — Collections (weeks 9–14)
  { id: 'list', label: 'list', tier: 3 },
  { id: 'indexing', label: 'indexing', tier: 3 },
  { id: 'slicing', label: 'slicing', tier: 3 },
  { id: 'mutation', label: 'mutation', tier: 3 },
  { id: 'list-methods', label: 'list methods', tier: 3 },
  { id: 'tuple', label: 'tuple', tier: 3 },
  { id: 'dict', label: 'dict', tier: 3 },
  { id: 'dict-methods', label: 'dict methods', tier: 3 },
  { id: 'set', label: 'set', tier: 3 },
  { id: 'iteration', label: 'iteration', tier: 3 },
  { id: 'nested-structures', label: 'nested structures', tier: 3 },
  { id: 'len', label: 'len', tier: 3 },
  { id: 'in', label: 'in', tier: 3 },
  { id: 'sorted', label: 'sorted', tier: 3 },
  { id: 'min', label: 'min', tier: 3 },
  { id: 'max', label: 'max', tier: 3 },

  // Tier 4 — Functions and Decomposition (weeks 15–20)
  { id: 'def', label: 'def', tier: 4 },
  { id: 'parameters', label: 'parameters', tier: 4 },
  { id: 'return', label: 'return', tier: 4 },
  { id: 'default-arguments', label: 'default arguments', tier: 4 },
  { id: 'keyword-arguments', label: 'keyword arguments', tier: 4 },
  { id: 'scope', label: 'scope', tier: 4 },
  { id: 'docstrings', label: 'docstrings', tier: 4 },
  { id: 'pure-vs-side-effecting', label: 'pure versus side-effecting', tier: 4 },
  { id: 'refactoring-a-script', label: 'refactoring a long script', tier: 4 },
  { id: 'import', label: 'import', tier: 4 },
  { id: 'stdlib-random', label: 'random', tier: 4 },
  { id: 'stdlib-math', label: 'math', tier: 4 },
  { id: 'stdlib-time', label: 'time', tier: 4 },
  { id: 'stdlib-pathlib', label: 'pathlib', tier: 4 },
  { id: 'stdlib-json', label: 'json', tier: 4 },

  // Tier 5 — State and Objects (weeks 21–28)
  { id: 'class', label: 'class', tier: 5 },
  { id: 'init', label: '__init__', tier: 5 },
  { id: 'attributes', label: 'attributes', tier: 5 },
  { id: 'methods', label: 'methods', tier: 5 },
  { id: 'repr', label: '__repr__', tier: 5 },
  { id: 'instance-vs-class', label: 'instances versus class', tier: 5 },
  { id: 'composition', label: 'composition', tier: 5 },
  { id: 'inheritance', label: 'light inheritance', tier: 5 },
  { id: 'try-except', label: 'try / except', tier: 5 },
  { id: 'raise', label: 'raise', tier: 5 },
  { id: 'custom-exceptions', label: 'custom exceptions', tier: 5 },

  // Tier 6 — Data and the Outside World (weeks 29–36)
  { id: 'file-read', label: 'file read', tier: 6 },
  { id: 'file-write', label: 'file write', tier: 6 },
  { id: 'context-managers', label: 'context managers', tier: 6 },
  { id: 'json-format', label: 'JSON', tier: 6 },
  { id: 'csv', label: 'CSV', tier: 6 },
  { id: 'http', label: 'HTTP', tier: 6 },
  { id: 'requests', label: 'requests', tier: 6 },
  { id: 'argparse', label: 'argparse', tier: 6 },
  { id: 'dependencies', label: 'dependencies', tier: 6 },

  // Tier 7 — Craft (weeks 37–48)
  { id: 'pytest', label: 'pytest', tier: 7 },
  { id: 'debugger', label: 'the debugger', tier: 7 },
  { id: 'type-hints', label: 'type hints', tier: 7 },
  { id: 'comprehensions', label: 'comprehensions', tier: 7 },
  { id: 'generators', label: 'generators', tier: 7 },
  { id: 'refactoring', label: 'refactoring', tier: 7 },
  { id: 'performance-intuition', label: 'performance intuition', tier: 7 },
  { id: 'branches', label: 'branches', tier: 7 },
  { id: 'pull-requests', label: 'pull requests', tier: 7 },
  { id: 'reading-unfamiliar-code', label: 'reading unfamiliar code', tier: 7 },
] as const;

const BY_ID = new Map<string, Concept>(CONCEPTS.map((c) => [c.id, c]));

/** Every known concept id. The validator's allowed set. */
export const CONCEPT_IDS: ReadonlySet<string> = new Set(BY_ID.keys());

export function isKnownConcept(id: string): boolean {
  return BY_ID.has(id);
}

/** The concept, or `undefined` if the id is not in the registry. */
export function getConcept(id: string): Concept | undefined {
  return BY_ID.get(id);
}

/**
 * The tier that first teaches `id`, or `undefined` for an unknown concept.
 * A quest may not tag a concept whose tier is above its own — see the validator.
 */
export function conceptTier(id: string): Concept['tier'] | undefined {
  return BY_ID.get(id)?.tier;
}
