/**
 * One `journal.md`, split back into the entries the ledger paid for.
 *
 * ADR 0004 put the Journal's prose in his repository and left `journal_entries` as the **ledger
 * of paid journal commits**: a session date, the commit that proved it, and what it paid. This
 * module is the join. The rows say which sessions were paid; the markdown says what he wrote.
 *
 * **The entry boundary is a dated heading, and that is a deliberate choice over the alternatives.**
 * Ruled 2026-08-31, after `journal/entries/session-NN.md` was tried and rejected for the learner's
 * sake: "which one is the journal for that session?" has one answer now, the same every week.
 * That put the burden on this module instead, and it is carried by making the delimiter something
 * **copied rather than composed** —
 *
 * ```markdown
 * ## 2026-08-31 — Session 01
 * ```
 *
 * — which is why `ENTRY_HEADING` can be strict about the date and relaxed about everything after
 * it. The two alternatives were worse in the way that matters: diffing a commit against its parent
 * breaks the moment he revisits an old entry, which the template explicitly invites, and splitting
 * on free-form prose drifts to `Aug 31` and then fails **silently**.
 *
 * There is no I/O here. `gitea.ts` fetches, `server.ts` decides what a 404 means, and this decides
 * only what the text says — which is the boundary that lets every rule below be tested against a
 * string rather than against a repository.
 */

/**
 * `## <ISO date>`, with anything allowed after it.
 *
 * Anchored and multiline so a `##` inside a fenced code block at column 0 is the only false
 * positive available, and a learner writing a fenced markdown example inside a journal entry is
 * a case worth losing to. The date is `\d{4}-\d{2}-\d{2}` exactly, because it is the ledger's
 * `session_date` and a looser match would silently pair an entry with the wrong row.
 *
 * The trailing `\b` matters: without it `## 2026-08-311` would parse as 2026-08-31 and attach a
 * different day's writing to a paid row.
 */
const ENTRY_HEADING = /^##[ \t]+(\d{4}-\d{2}-\d{2})\b.*$/gm;

/** `### DM reply`, at either heading level, because an old entry may carry the `##` form. */
const REPLY_HEADING = /^#{2,4}[ \t]+DM reply\b.*$/im;

/**
 * The template's coaching, removed before anything is measured or returned.
 *
 * `TEMPLATE.md` ships `<!-- ... -->` guidance under every prompt — *"Specific. A stranger reading
 * this should be able to tell which session it was"* — and he has no reason to delete it. It is
 * the curriculum talking to him, not him writing, so it is not part of the entry: shipping it
 * would put the DM's instructions on the learner's own Journal screen.
 *
 * It also decides emptiness, which is the whole reason this runs before the check rather than
 * after. An unanswered `### DM reply` still contains `<!-- Dad writes here. -->`, so a screen
 * testing the raw section for text would render every unanswered entry as answered — and answered
 * with a note addressed to somebody else.
 */
const stripComments = (markdown: string): string => markdown.replace(/<!--[\s\S]*?-->/g, '');

/** Blank once the coaching is gone. Not the same question as "empty string". */
const isBlank = (markdown: string): boolean => stripComments(markdown).trim() === '';

export interface JournalSection {
  /** The entry as he wrote it, without the dated heading and without the reply. */
  readonly body: string;
  /** The DM's answer, if the file carries one. */
  readonly reply: string | undefined;
}

/**
 * Split one section's text into what he wrote and what the DM answered.
 *
 * The reply is lifted out rather than left in `body` because the two have different authors and
 * the screen renders them differently — §5.6's reply is the half that makes the Journal a
 * conversation rather than a diary, and a payload that concatenated them would make that
 * distinction the client's problem to re-derive by parsing markdown a second time.
 */
function sectionOf(text: string): JournalSection {
  const match = REPLY_HEADING.exec(text);
  if (match === null || match.index === undefined) {
    return { body: stripComments(text).trim(), reply: undefined };
  }
  const body = text.slice(0, match.index);
  const reply = text.slice(match.index + match[0].length);
  return {
    body: stripComments(body).trim(),
    reply: isBlank(reply) ? undefined : stripComments(reply).trim(),
  };
}

/**
 * Every dated entry in one `journal.md`, by session date.
 *
 * A `Map` rather than an array because the caller joins it against ledger rows keyed on
 * `session_date`, and the lookup is the entire point of the return value.
 *
 * **Text before the first dated heading is dropped**, which is how his `# Journal` title and any
 * preamble stay out of entry one. **A repeated date keeps the last section**, on the grounds that
 * a second `## 2026-08-31` is nearly always him continuing the same evening rather than starting
 * a new session — and the ledger's `PRIMARY KEY (player_id, session_date)` cannot hold two rows
 * for the day anyway, so there is no second row for a first section to belong to.
 */
export function splitEntries(markdown: string): Map<string, JournalSection> {
  const found = new Map<string, JournalSection>();
  const headings = [...markdown.matchAll(ENTRY_HEADING)];

  headings.forEach((heading, index) => {
    const date = heading[1];
    if (date === undefined || heading.index === undefined) return;
    const from = heading.index + heading[0].length;
    const to = headings[index + 1]?.index ?? markdown.length;
    found.set(date, sectionOf(markdown.slice(from, to)));
  });

  return found;
}
