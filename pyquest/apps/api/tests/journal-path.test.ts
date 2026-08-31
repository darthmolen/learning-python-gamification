import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { giteaSettings } from '../src/gitea.ts';

/**
 * The api's journal path and the curriculum's instruction, checked against each other.
 *
 * **This is the test that was missing, and its absence cost the Journal its XP.** From
 * 2026-08-29 to 2026-08-31 `DEFAULT_JOURNAL_PATH` was `journal.md` while
 * `curriculum/area-0/journal/` told the learner to write `journal/entries/session-NN.md`.
 * `gitsignal` passes that path to Gitea as `git log -- <path>`, so no commit he could ever make
 * would match it: `git-signal: journal-entry` could not fire and §5.6's ten XP an entry could
 * never be paid. **Both sides were green the whole time** — the api suite asserted the filter was
 * passed, `validate:content` asserted the template existed, and neither knew the other's string.
 *
 * Two documents, each internally consistent, disagreeing at a seam no test spanned. It is the
 * third failure of that exact shape in two days, after `PLAYER_ID = 'peer'` against a uuid column
 * and the SPA's fixtures against the api's payloads.
 *
 * **So this test spans the seam on purpose, and it is the only one that does.** It reads the
 * curriculum as the learner is told to read it and requires the api to be filtering on the file
 * the learner is actually told to write. It is deliberately in `apps/api` rather than in the
 * content validator: `validate:content` is Lane B's gate and knows nothing about Gitea settings,
 * and a check that needs both halves belongs on the side that would otherwise drift silently.
 */

const REPO_ROOT = fileURLToPath(new URL('../../../..', import.meta.url));

/** The api's answer, taken the way the server takes it rather than from a private constant. */
const journalPath = (): string => {
  const settings = giteaSettings({ GITEA_TOKEN: 'not-a-real-token' });
  if (settings === undefined) throw new Error('giteaSettings refused a token it was given');
  return settings.journalPath;
};

/**
 * The curriculum's answer, read out of the block the DM is shown under *Where the entries live*.
 *
 * The first non-blank line of that fence is the path, which is the whole reason the block is one
 * line long. A looser search — "does the file mention journal.md anywhere" — would pass on the
 * prose that merely discusses the old layout, and this file has to keep saying what changed.
 */
const curriculumPath = (): string => {
  const prompt = readFileSync(
    `${REPO_ROOT}/curriculum/area-0/journal/entry-01-prompt.md`,
    'utf8',
  );
  const section = prompt.split('## Where the entries live')[1];
  if (section === undefined) throw new Error('area-0 no longer has a "Where the entries live"');
  /*
   * Two things here are scar tissue from watching this test fail wrongly, twice.
   *
   * **The fence's language is optional.** Requiring ```text made it fail with "no text block"
   * against the old layout rather than with the mismatch it exists to report — red for the wrong
   * reason, so the next person fixes the fence and the real disagreement survives.
   *
   * **And the line endings are `\r?\n`.** This repository checks out CRLF on Windows, so a bare
   * `\n` after the fence matched nothing and the test again failed with the wrong message. A
   * check whose own parsing is platform-dependent is exactly the silent mismatch this file is
   * here to catch, which made it a fitting way to lose ten minutes.
   */
  const fence = /```(?:text)?\r?\n([\s\S]*?)```/.exec(section);
  if (fence?.[1] === undefined) throw new Error('that section no longer opens with a code block');
  const [first] = fence[1].split(/\r?\n/).filter((line) => line.trim() !== '');
  return (first ?? '').trim().split(/\s+/)[0] ?? '';
};

describe('the journal path the api watches', () => {
  it('is the file the curriculum tells him to write', () => {
    expect(journalPath()).toBe(curriculumPath());
  });

  it('is a file rather than a directory, because the entries are sections of one document', () => {
    expect(journalPath()).not.toMatch(/\/$/);
    expect(curriculumPath()).toBe('journal.md');
  });

  /**
   * Case is load-bearing and silent when wrong. Gitea runs on Linux and its `?path=` filter is
   * case-sensitive, so `Journal.md` and `journal.md` are two different files and the wrong one
   * pays nothing — with no error anywhere, which is the failure mode this whole file exists for.
   */
  it('agrees on case, which Gitea does not forgive', () => {
    expect(journalPath()).toBe(journalPath().toLowerCase());
  });
});
