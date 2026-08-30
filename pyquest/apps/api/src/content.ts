/**
 * The content root, read from git once at boot and never afterwards.
 *
 * §6.7 draws the line this file sits on: content lives in git, progress lives in Postgres, and
 * the two never mix. So there is no content in the database and no endpoint that writes a quest.
 * §6.10 makes authoring a CLI, and `infra/compose/api.yml` mounts `/content` read-only, which is
 * the same decision expressed where an accident could otherwise happen.
 *
 * **Loading is whole-corpus and fail-fast, and that is the ruling this module exists to hold.**
 * Every YAML file parses, every prerequisite resolves, the graph is acyclic and every referenced
 * brief, starter and test file is on disk — or the process refuses to start and says which file.
 * A half-loaded campaign shows an 11–14-year-old a map with a hole in it and gives him no way to
 * tell the hole from something he has not unlocked yet, and he will conclude he did something
 * wrong. Stopping is louder and kinder.
 *
 * The validation itself is `checkContent` from `@pyquest/content`, which is the same code
 * `npm run validate:content` runs. Two validators would be two answers.
 */

import { existsSync, readFileSync } from 'node:fs';
import { isAbsolute, relative, resolve, sep } from 'node:path';
import {
  checkContent,
  formatIssues,
  type Area,
  type AreaManifest,
  type ContentIssue,
  type ContentItem,
} from '@pyquest/content';

/**
 * The boot refused, with the issues that refused it.
 *
 * Carries the list rather than only a message so a test can assert on the reason and an operator
 * can read the same report `validate:content` prints. Nothing catches this: it is thrown before
 * the server listens, on purpose.
 */
export class ContentRootError extends Error {
  /**
   * Fields are declared and assigned rather than written as constructor parameter properties.
   *
   * The api runs from source under Node's `--experimental-strip-types`, which is strip-only: it
   * erases annotations and refuses any syntax that would need code generated for it. A parameter
   * property is exactly that, and it fails at *boot* with `ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX` —
   * typechecked clean, fully tested, and dead in the container. Found by running it, which is why
   * the end-to-end run is worth the trouble even when every suite is green.
   */
  readonly root: string;
  readonly issues: readonly ContentIssue[];

  constructor(root: string, issues: readonly ContentIssue[], detail: string) {
    super(`the content root at ${root} will not load\n\n${detail}`);
    this.name = 'ContentRootError';
    this.root = root;
    this.issues = issues;
  }
}

/** A path that tried to leave the content root. Refused rather than normalised. */
export class ContentPathError extends Error {
  readonly requested: string;

  constructor(requested: string) {
    super(`"${requested}" resolves outside the content root`);
    this.name = 'ContentPathError';
    this.requested = requested;
  }
}

/**
 * The loaded corpus, indexed.
 *
 * Indexed because the alternative is a linear scan of every item on every request, and the shape
 * of that mistake is a map screen that gets slower as the curriculum gets longer — which is to
 * say, as the project succeeds.
 */
export interface ContentRoot {
  readonly root: string;
  readonly items: readonly ContentItem[];
  readonly manifests: readonly AreaManifest[];
  /** One item by id, or `undefined`. Quest ids in progress rows are resolved through this. */
  item(id: string): ContentItem | undefined;
  manifest(area: Area): AreaManifest | undefined;
  /** A repository-relative file's text. Refuses anything that escapes the root. */
  read(relativePath: string): string;
}

/**
 * Resolve a content-relative path, and refuse one that leaves the root.
 *
 * `RelativePathSchema` already refuses `..` and absolute paths in *authored* content, so this is
 * the second lock rather than the first. It is here because the argument does not always come
 * from content: a handler that ever passes a quest id or a client string through this function
 * must not be the thing that turns a read into an arbitrary file read on the parent's machine.
 */
function resolveInside(root: string, relativePath: string): string {
  if (isAbsolute(relativePath)) throw new ContentPathError(relativePath);
  const absolute = resolve(root, relativePath);
  const inside = relative(root, absolute);
  if (inside === '' || inside.startsWith('..') || isAbsolute(inside)) {
    throw new ContentPathError(relativePath);
  }
  if (inside.split(sep).includes('..')) throw new ContentPathError(relativePath);
  return absolute;
}

/**
 * Load and validate a content root, or throw.
 *
 * Called once, from `main.ts`, before the server listens. There is no reload endpoint and no
 * watcher: content is immutable at runtime, so a change to a quest is a restart, which is also
 * what makes "what the API served" answerable from a commit sha.
 */
export function loadContentRoot(root: string): ContentRoot {
  const absolute = resolve(root);

  if (!existsSync(absolute)) {
    throw new ContentRootError(
      absolute,
      [],
      'there is no directory there. Set CONTENT_ROOT, or mount content/ into the container.',
    );
  }

  const { items, manifests, issues } = checkContent(absolute);

  if (issues.length > 0) {
    throw new ContentRootError(absolute, issues, formatIssues(issues, absolute));
  }

  const byId = new Map(items.map((item) => [item.id, item]));
  const byArea = new Map(manifests.map((manifest) => [manifest.area, manifest]));

  return {
    root: absolute,
    items,
    manifests,
    item: (id) => byId.get(id),
    manifest: (area) => byArea.get(area),
    read: (relativePath) => readFileSync(resolveInside(absolute, relativePath), 'utf8'),
  };
}
