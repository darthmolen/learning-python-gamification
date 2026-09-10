/**
 * What may travel to a learner's machine.
 *
 * Two halves, and only one is written by hand.
 *
 * `tools/learner-setup/manifest.txt` still names the toolchain instructions, because no property
 * of `tools/python/README.md` says a learner should have it — a person decided that. The
 * curriculum half is derived: every document under an area declares an `audience:`, so "may a
 * learner have this?" is a question the tree answers, and a new area needs no edit anywhere.
 *
 * ## An allow-list, deliberately
 *
 * Three things must never reach a learner: `dm-guide.md`, `reference/` — the Datamine answer
 * keys, whose README opens *"This directory is yours, not the learner's"* — and `hidden/`, whose
 * every file opens *"Spec §6.3: these never reach the browser"*.
 *
 * A deny-list naming those three is one forgotten entry away from shipping all three, and the
 * mistake cannot be taken back: you cannot un-see an answer key. So nothing ships unless a rule
 * here names it, and `audienceOf` answers `dm` for anything unmarked.
 *
 * This lives beside the validator rather than inside the CLI so that the rules can be asserted
 * against the real curriculum. A packing rule nobody can test is a packing rule nobody can trust.
 */

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { audienceOf } from './schema.ts';

const toPosix = (p: string): string => p.split('\\').join('/');

/**
 * Normalize the repository root before anything measures its length.
 *
 * The walk below turns an absolute path into a relative one by slicing `root.length + 1`, which
 * is off by one the moment `root` already ends in a separator — and
 * `fileURLToPath(new URL('../../../..'))` hands back exactly that. It cost two debugging rounds
 * in one afternoon, once in the CLI and once in the test, both reporting a missing
 * `urriculum/area-0/dm-guide.md`. Normalizing here fixes it for every caller instead of asking
 * each one to remember.
 */
const normalize = (root: string): string => resolve(root);

/** Every file under `dir`, relative to `root`, posix-separated. An absent directory yields none. */
function filesUnder(root: string, dir: string): string[] {
  const at = join(root, dir);
  if (!existsSync(at)) return [];
  return readdirSync(at, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => toPosix(join(entry.parentPath, entry.name).slice(root.length + 1)));
}

/**
 * The hand-written half.
 *
 * Read with `pack.sh`'s own rules — strip from a `#` to the end of the line, drop trailing
 * whitespace, discard what is left empty — so the two cannot disagree about what a comment is.
 */
export function manifestEntries(input: string): string[] {
  const root = normalize(input);
  const path = join(root, 'tools/learner-setup/manifest.txt');
  if (!existsSync(path)) return [];
  return readFileSync(path, 'utf8')
    .split(/\r?\n/)
    .map((line) => line.replace(/#.*/, '').trimEnd())
    .filter((line) => line !== '');
}

/**
 * The derived half: what an area may hand over.
 *
 * `verify.py` ships because `practices/README.md` tells the learner to run it, and since
 * 2026-09-10 it names the search roots it could not find rather than quietly shrinking its
 * denominator — so it is honest on a machine that has no `reference/`.
 *
 * `practices.yml` ships because it is the order. `how-to-learn.md` tells the learner the
 * practices run in sequence and that the sequence is the one rule of the whole curriculum; this
 * is the file that makes that checkable away from the app.
 *
 * `area.yml` does **not** ship. Weeks and an estimated quest count are a calendar's business and
 * the game's, and ADR 0006 keeps both out of what the learner reads.
 */
export function curriculumEntries(input: string): string[] {
  const root = normalize(input);
  const out: string[] = [];
  const curriculum = join(root, 'curriculum');
  if (!existsSync(curriculum)) return out;

  const areas = readdirSync(curriculum, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && /^area-\d+$/.test(entry.name))
    .map((entry) => entry.name)
    .sort();

  for (const area of areas) {
    for (const file of filesUnder(root, join('curriculum', area))) {
      const withinArea = file.slice(`curriculum/${area}/`.length);

      // 0. Build debris. Not secret, just worthless — and a `.pyc` compiled by one machine's
      //    interpreter landing in another machine's checkout fails once, confusingly, and
      //    teaches nothing.
      if (/(^|\/)(__pycache__|\.ruff_cache|\.pytest_cache)\//.test(withinArea)) continue;

      // 1. Never, whatever else says otherwise. Stated first so it cannot be reached past.
      //
      //    **These two are redundant today and are kept anyway.** Deleting them changes nothing:
      //    the markdown in `reference/` is marked `dm` so rule 2 refuses it, and its `.py` files
      //    match no allow rule below. A mutant proved exactly that — removing this line left all
      //    nine assertions green. What it buys is the case that has not happened yet: the day
      //    somebody adds a rule shipping `.py` from an area, `reference/r5_ask_and_draw.py` is a
      //    worked solution and `hidden/test.py` is the test it answers. The allow-list is the
      //    guard; this is the belt beside it, for the one failure that cannot be undone.
      if (withinArea.startsWith('reference/')) continue;
      if (withinArea.includes('/hidden/') || withinArea.startsWith('hidden/')) continue;

      // 2. Markdown ships when the document itself says a learner may have it.
      if (file.endsWith('.md')) {
        if (audienceOf(readFileSync(join(root, file), 'utf8')) === 'learner') out.push(file);
        continue;
      }

      // 3. The harness the learner is told to run.
      if (withinArea === 'verify.py') {
        out.push(file);
        continue;
      }

      // 4. The spine — the order the work is done in.
      if (withinArea === 'practices.yml') {
        out.push(file);
        continue;
      }

      // 5. The files the work is done to: the drills beside each practice plan, and the starter
      //    an exercise begins from. A brief with no starter is a brief you cannot begin.
      if (/^practices\/practice-\d+\//.test(withinArea)) {
        out.push(file);
        continue;
      }
      if (/^exercises\/[^/]+\/starter\//.test(withinArea)) {
        out.push(file);
        continue;
      }
    }
  }

  return out;
}

/** Both halves, deduplicated and sorted. The order is stable so a diff of two runs is readable. */
export function payloadPaths(input: string): string[] {
  const root = normalize(input);
  return [...new Set([...manifestEntries(root), ...curriculumEntries(root)])].sort();
}
