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
  contentRootsFrom,
} from '@pyquest/content';
import type { ScaledXpKind } from '@pyquest/engine';

import { ApiFailure } from './errors.ts';

/**
 * Content's `Kind` narrowed to the two kinds §5.1 prices from a DC.
 *
 * The engine's medal functions take a `ScaledXpKind` — `quest | boss` — because §5.1 prices an
 * invasion flat at 5 and §5.10 puts no medals on one. Content's `Kind` has the third member, so
 * this is the one place the two vocabularies are reconciled, and it is a function rather than a
 * cast so that the impossible case has somewhere to go.
 *
 * It throws, and the throw is not defensive dressing: an invasion reaching a medal price means a
 * caller has mixed up two kinds of item, and paying it *something* would write a wrong number
 * into a row §5.10 never re-prices. Refusing is the only answer that cannot be silently wrong.
 */
export function pricedKind(item: ContentItem): ScaledXpKind {
  if (item.kind === 'invasion') {
    throw new ApiFailure(
      'content-invalid',
      `${item.id} is an invasion — §5.1 prices one flat and §5.10 puts no medals on it`,
    );
  }
  return item.kind;
}

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
  /**
   * Whether that file is there, through the same escape check.
   *
   * Separate from `read` rather than a try/catch around it, because a catch cannot tell an
   * absent file from an unreadable one — a permissions fault, a directory where a file was
   * expected, a truncated mount — and swallowing all three as "not authored yet" is how a
   * broken content root comes to look like an empty one.
   */
  exists(relativePath: string): boolean;
  /**
   * A file under `game/`, or `undefined` when it is not there.
   *
   * Separate from `read` because the two roots are separate, and deliberately the only way in:
   * `read` and `exists` are rooted at `curriculum/` and nothing that serves curriculum content
   * may reach the overlay by accident. CLAUDE.md's rule runs the other way too — `game/` is the
   * overlay, and a curriculum that depended on it would break the deletion test — so the one
   * caller of this is the medals route, which is game content by name.
   *
   * **Absent is a return value, not an error.** Deleting `game/` is a supported state, and
   * `loadContentRoot` already declines to treat a missing overlay as a misconfiguration. A
   * caller gets `undefined` and decides; the medals route decides on an empty list.
   */
  readGame(relativePath: string): string | undefined;
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
 *
 * `base` is the directory holding `curriculum/` and `game/` as siblings — the repository root in
 * a checkout, and whatever `CONTENT_ROOT` names in the container. The existence check is on
 * `curriculum/` rather than on `base`, because a base with no curriculum is the
 * misconfiguration worth naming while a missing `game/` is a supported state: a curriculum
 * without the overlay is the thing this split exists to make possible.
 */
export function loadContentRoot(base: string): ContentRoot {
  const absolute = resolve(base);
  const roots = contentRootsFrom(absolute);

  if (!existsSync(roots.curriculum)) {
    throw new ContentRootError(
      absolute,
      [],
      `there is no curriculum/ directory there. Set CONTENT_ROOT to the directory holding curriculum/ and game/, or mount them into the container.`,
    );
  }

  const { items, manifests, issues } = checkContent(roots);

  if (issues.length > 0) {
    // `roots`, not `absolute`: the report resolves each file against the tree it was read
    // from, and the base directory is neither of them.
    throw new ContentRootError(absolute, issues, formatIssues(issues, roots));
  }

  const byId = new Map(items.map((item) => [item.id, item]));
  const byArea = new Map(manifests.map((manifest) => [manifest.area, manifest]));

  return {
    root: absolute,
    items,
    manifests,
    item: (id) => byId.get(id),
    manifest: (area) => byArea.get(area),
    /**
     * Item paths are relative to the *curriculum* root, not to `base` — a brief reads
     * `area-1/exercises/the-countdown/BRIEF.md`. Resolving against `base` would look one
     * directory too high and, worse, would put the whole repository inside the escape check's
     * idea of "inside".
     */
    read: (relativePath) => readFileSync(resolveInside(roots.curriculum, relativePath), 'utf8'),
    /** Same root and the same escape check, so a path this accepts is one `read` will take. */
    exists: (relativePath) => {
      try {
        return existsSync(resolveInside(roots.curriculum, relativePath));
      } catch (cause) {
        /* A path that leaves the root does not "not exist" — it is a caller bug. But a caller
         * asking whether a file is there is asking a yes/no question, and the honest answer for
         * something outside the tree is no. `read` still throws, which is where it matters. */
        if (cause instanceof ContentPathError) return false;
        throw cause;
      }
    },
    /**
     * The overlay, through the same escape check against the other root.
     *
     * The whole directory being absent and one file in it being absent are the same answer here,
     * and that is right rather than lazy: both mean "the game text is not available", and the one
     * caller does the same thing for either. What is *not* folded in is an unreadable file — a
     * permissions fault or a directory where a file was expected still throws, for the reason
     * `exists` gives above.
     */
    readGame: (relativePath) => {
      let path: string;
      try {
        path = resolveInside(roots.game, relativePath);
      } catch (cause) {
        if (cause instanceof ContentPathError) return undefined;
        throw cause;
      }
      return existsSync(path) ? readFileSync(path, 'utf8') : undefined;
    },
  };
}
