/**
 * The concept tag registry.
 *
 * Spec §6.10 requires `validate:content` to prove that every concept tag a quest carries is
 * known. This file is that known set. It is authored directly from the area vocabularies in
 * spec §4 — one entry per vocabulary item — and nothing else may add to it, because an
 * unrecognised tag is exactly the typo the validator exists to catch.
 *
 * Each concept records the area that first teaches it. That turns a second class of authoring
 * mistake into a caught error: an Area 3 quest tagged `class` is tagging vocabulary the learner
 * will not meet for eighteen weeks (spec §4, Area 5), and the prerequisite graph cannot see
 * that on its own.
 *
 * Concepts are also the unit of spaced repetition. Spec §5.4 queues an invasion when a concept
 * passes its review interval untouched, so every id here is a thing that can come back around.
 */

export interface Concept {
  /** Stable kebab-case id. Quests reference this; renaming one is a content migration. */
  readonly id: string;
  /** How the concept renders to a player. */
  readonly label: string;
  /** The area that first teaches it, per spec §4. */
  readonly area: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;
}

/**
 * Area 2 is split across two half-areas in spec §4 — 2a The Scribe's Rite (git) and 2b Escape
 * the Sandbox (the real toolchain). They share an area number because they share a boss.
 */
export const CONCEPTS: readonly Concept[] = [
  // Area 0 — First Light (weeks 1–2)
  { id: 'print', label: 'print', area: 0 },
  { id: 'variables', label: 'variables', area: 0 },
  { id: 'int', label: 'int', area: 0 },
  { id: 'float', label: 'float', area: 0 },
  { id: 'str', label: 'str', area: 0 },
  { id: 'bool', label: 'bool', area: 0 },
  { id: 'input', label: 'input', area: 0 },
  { id: 'f-strings', label: 'f-strings', area: 0 },
  { id: 'reading-errors', label: 'reading errors', area: 0 },

  // Area 1 — Control (weeks 3–6)
  { id: 'if', label: 'if', area: 1 },
  { id: 'elif', label: 'elif', area: 1 },
  { id: 'else', label: 'else', area: 1 },
  { id: 'comparison-operators', label: 'comparison operators', area: 1 },
  { id: 'boolean-operators', label: 'boolean operators', area: 1 },
  { id: 'while', label: 'while', area: 1 },
  { id: 'for', label: 'for', area: 1 },
  { id: 'range', label: 'range', area: 1 },
  { id: 'nesting', label: 'nesting', area: 1 },
  { id: 'accumulator-pattern', label: 'the accumulator pattern', area: 1 },

  // Area 2a — The Scribe's Rite (weeks 6–7)
  { id: 'repository', label: 'what a repository is', area: 2 },
  { id: 'git-init', label: 'git init', area: 2 },
  { id: 'git-add', label: 'git add', area: 2 },
  { id: 'git-commit', label: 'git commit', area: 2 },
  { id: 'git-log', label: 'the log as a story', area: 2 },
  { id: 'git-branch', label: 'branches, lightly', area: 2 },
  { id: 'git-push', label: 'push to origin', area: 2 },

  // Area 2b — Escape the Sandbox (weeks 7–8)
  { id: 'files-on-disk', label: 'files on disk', area: 2 },
  { id: 'running-scripts', label: 'python thing.py', area: 2 },
  { id: 'vscode', label: 'VS Code', area: 2 },
  { id: 'venv', label: 'venv', area: 2 },
  { id: 'pip', label: 'pip', area: 2 },
  { id: 'tracebacks', label: 'tracebacks', area: 2 },
  { id: 'main-guard', label: 'if __name__ == "__main__"', area: 2 },

  // Area 3 — Collections (weeks 9–14)
  { id: 'list', label: 'list', area: 3 },
  { id: 'indexing', label: 'indexing', area: 3 },
  { id: 'slicing', label: 'slicing', area: 3 },
  { id: 'mutation', label: 'mutation', area: 3 },
  { id: 'list-methods', label: 'list methods', area: 3 },
  { id: 'tuple', label: 'tuple', area: 3 },
  { id: 'dict', label: 'dict', area: 3 },
  { id: 'dict-methods', label: 'dict methods', area: 3 },
  { id: 'set', label: 'set', area: 3 },
  { id: 'iteration', label: 'iteration', area: 3 },
  { id: 'nested-structures', label: 'nested structures', area: 3 },
  { id: 'len', label: 'len', area: 3 },
  { id: 'in', label: 'in', area: 3 },
  { id: 'sorted', label: 'sorted', area: 3 },
  { id: 'min', label: 'min', area: 3 },
  { id: 'max', label: 'max', area: 3 },
  { id: 'breakpoints', label: 'breakpoints', area: 3 },

  // Area 4 — Functions and Decomposition (weeks 15–20)
  { id: 'def', label: 'def', area: 4 },
  { id: 'parameters', label: 'parameters', area: 4 },
  { id: 'return', label: 'return', area: 4 },
  { id: 'default-arguments', label: 'default arguments', area: 4 },
  { id: 'keyword-arguments', label: 'keyword arguments', area: 4 },
  { id: 'scope', label: 'scope', area: 4 },
  { id: 'docstrings', label: 'docstrings', area: 4 },
  { id: 'pure-vs-side-effecting', label: 'pure versus side-effecting', area: 4 },
  { id: 'refactoring-a-script', label: 'refactoring a long script', area: 4 },
  { id: 'import', label: 'import', area: 4 },
  { id: 'stdlib-random', label: 'random', area: 4 },
  { id: 'stdlib-math', label: 'math', area: 4 },
  { id: 'stdlib-time', label: 'time', area: 4 },
  { id: 'stdlib-pathlib', label: 'pathlib', area: 4 },
  { id: 'stdlib-json', label: 'json', area: 4 },

  // Area 5 — State and Objects (weeks 21–28)
  { id: 'class', label: 'class', area: 5 },
  { id: 'init', label: '__init__', area: 5 },
  { id: 'attributes', label: 'attributes', area: 5 },
  { id: 'methods', label: 'methods', area: 5 },
  { id: 'repr', label: '__repr__', area: 5 },
  { id: 'instance-vs-class', label: 'instances versus class', area: 5 },
  { id: 'composition', label: 'composition', area: 5 },
  { id: 'inheritance', label: 'light inheritance', area: 5 },
  { id: 'try-except', label: 'try / except', area: 5 },
  { id: 'raise', label: 'raise', area: 5 },
  { id: 'custom-exceptions', label: 'custom exceptions', area: 5 },

  // Area 6 — Data and the Outside World (weeks 29–36)
  { id: 'file-read', label: 'file read', area: 6 },
  { id: 'file-write', label: 'file write', area: 6 },
  { id: 'context-managers', label: 'context managers', area: 6 },
  { id: 'json-format', label: 'JSON', area: 6 },
  { id: 'csv', label: 'CSV', area: 6 },
  { id: 'http', label: 'HTTP', area: 6 },
  { id: 'requests', label: 'requests', area: 6 },
  { id: 'argparse', label: 'argparse', area: 6 },
  { id: 'dependencies', label: 'dependencies', area: 6 },

  // Area 7 — Craft (weeks 37–48)
  { id: 'pytest', label: 'pytest', area: 7 },
  { id: 'debugger', label: 'the debugger', area: 7 },
  { id: 'type-hints', label: 'type hints', area: 7 },
  { id: 'comprehensions', label: 'comprehensions', area: 7 },
  { id: 'generators', label: 'generators', area: 7 },
  { id: 'refactoring', label: 'refactoring', area: 7 },
  { id: 'performance-intuition', label: 'performance intuition', area: 7 },
  { id: 'branches', label: 'branches', area: 7 },
  { id: 'pull-requests', label: 'pull requests', area: 7 },
  { id: 'reading-unfamiliar-code', label: 'reading unfamiliar code', area: 7 },
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
 * The area that first teaches `id`, or `undefined` for an unknown concept.
 * A quest may not tag a concept whose area is above its own — see the validator.
 */
export function conceptArea(id: string): Concept['area'] | undefined {
  return BY_ID.get(id)?.area;
}
