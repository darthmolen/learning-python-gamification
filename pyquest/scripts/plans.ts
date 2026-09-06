/**
 * The planning board, as a schema a machine can check.
 *
 * Pure: no filesystem, no `process`. The CLI does the walking and hands the documents here, for
 * the same reason `packages/content` splits `validate.ts` from `cli/validate.ts` — the part that
 * has to be right is the part that is trivially testable.
 *
 * **Why this exists at all.** Before it, a document's status lived in three places that could
 * disagree: its directory, its filename prefix, and a prose `**Status:**` line written 24
 * different ways across 109 files. Frontmatter alone would not have fixed that — the same 24
 * shapes reappear in YAML inside a month. The enum plus this checker is the whole of the fix, and
 * either half without the other is markdown with more punctuation.
 *
 * **References are names, not paths** (decided 2026-09-04). A document's identity is
 * `<slug>_<date>`, and where it lives is its *status* — so a stored path is wrong the moment the
 * thing it names moves, which is the normal life of a plan. A name never goes stale. The cost is
 * that two documents can share one: a stub promoted the same day it was filed shares slug and
 * date with the plan it became. `kind` resolves every such pair, and anything it does not resolve
 * is a validation error naming both candidates rather than a silent wrong target.
 */

export type Kind = 'plan' | 'stub' | 'reminder' | 'review' | 'wave'

export const KINDS: readonly Kind[] = ['plan', 'stub', 'reminder', 'review', 'wave']

/**
 * Status by kind. Two vocabularies, because there genuinely are two: forcing a reminder into the
 * plan enum would be a lie about what a reminder is.
 */
export const STATUSES: Readonly<Record<Kind, readonly string[]>> = {
  plan: ['queued', 'in-progress', 'completed', 'not-implemented', 'blocked'],
  stub: ['open', 'promoted', 'closed'],
  // `dropped` is the skill's word and the extension's: a reminder that stopped mattering is not
  // the same answer as one that was carried out, and the Journal wants to be able to tell them
  // apart. Omitting it would have failed the board the first time anyone used the Drop button.
  reminder: ['open', 'done', 'dropped'],
  review: ['open', 'done'],
  wave: ['open', 'done'],
}

/** `not-implemented` is the second terminal state, and each reason must name something. */
export const REASONS: Readonly<Record<string, string>> = {
  superseded: 'superseded_by',
  'folded-in': 'folded_into',
  obsoleted: 'obsoleted_by',
  abandoned: 'learned',
}

/**
 * Which fields a status requires, and which of those name another document.
 *
 * `obsoleted_by` and `learned` are deliberately free text: "the ground moved" and "what was
 * learned" are not documents, and demanding a reference for them would push authors into
 * inventing one.
 */
const REQUIRED: Readonly<Record<string, readonly string[]>> = {
  completed: ['completed'],
  blocked: ['blocked_on'],
  promoted: ['promoted_to'],
  'not-implemented': ['reason'],
}

/**
 * Reference fields, and the kind each one expects to find.
 *
 * `promoted_from` takes a plan as well as a stub, and that is not a loosening. An item is
 * promoted out of whatever was holding it, and in this corpus that is sometimes another plan's
 * *Anticipated Backlog* section rather than a filed stub —
 * `ursina-version-pinning-policy_2026-08-27` grew out of the tier-3 spike exactly that way. The
 * price is that a name shared by a stub and a plan is ambiguous here, which the checker reports
 * with both candidates rather than silently picking one.
 */
const REFERENCES: Readonly<Record<string, readonly Kind[]>> = {
  promoted_to: ['plan'],
  promoted_from: ['stub', 'plan'],
  superseded_by: ['plan'],
  folded_into: ['plan'],
  closed_by: ['plan', 'stub'],
  // A reminder's `plan:` — the work it belongs to. It takes a stub as well as a plan, because a
  // reminder routinely outlives the promotion of the thing that raised it.
  plan: ['plan', 'stub'],
}

/**
 * Where a status lives. The directory is the status, so the two must agree — this is the check
 * that stops a `completed` plan sitting in the queue root telling a reader it is ready to start.
 *
 * A closed reminder is the one case with two homes, and deliberately. **Closing and filing are
 * two acts**: the VS Code extension closes a reminder in place from the status bar, and a person
 * files it into `completed/` afterwards. Demanding the move at close time would fail the board
 * the moment anybody used the button the extension exists to provide.
 */
const DIRECTORY: Readonly<Record<string, readonly string[]>> = {
  'plan/queued': ['planning'],
  'plan/in-progress': ['planning/in-progress'],
  'plan/completed': ['planning/completed'],
  'plan/not-implemented': ['planning/not-implemented'],
  'plan/blocked': ['planning/blocked'],
  'stub/open': ['planning/backlog'],
  'stub/promoted': ['planning/backlog'],
  'stub/closed': ['planning/backlog'],
  'reminder/open': ['planning/reminders'],
  'reminder/done': ['planning/reminders/completed', 'planning/reminders'],
  'reminder/dropped': ['planning/reminders/completed', 'planning/reminders'],
  'wave/open': ['planning/waves'],
  'wave/done': ['planning/waves'],
}

/**
 * Filename prefix by stub status. Redundant with the field on purpose: `ls planning/backlog/`
 * reading as a status board is a real affordance frontmatter does not give back, and redundancy
 * that is checked is a second opinion rather than drift.
 */
const PREFIX: Readonly<Record<string, string>> = {
  open: 'feature',
  promoted: 'promoted',
  closed: 'closed',
}

/** Only status prefixes are stripped from an identity. A reminder's `verify_` is a category. */
const STATUS_PREFIXES: readonly string[] = ['feature', 'promoted', 'closed']

export interface Doc {
  /** Repo-relative, POSIX separators. `planning/backlog/feature_x_2026-09-04.md`. */
  readonly path: string
  readonly text: string
}

export interface Issue {
  readonly file: string
  readonly rule: string
  readonly message: string
  readonly fix: string
}

export interface Parsed {
  readonly path: string
  readonly name: string
  readonly directory: string
  readonly prefix: string | undefined
  readonly fields: ReadonlyMap<string, string>
  readonly present: boolean
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

/**
 * The frontmatter block, as a flat map.
 *
 * A deliberately small subset of YAML — `key: value`, one per line, no nesting and no lists,
 * because that is the whole of what the schema needs. A real YAML parser would accept documents
 * this checker has no rules for, and the first one written would be the one nobody validates.
 */
export function splitFrontmatter(text: string): { fields: Map<string, string>; present: boolean } {
  const lines = text.split(/\r?\n/)
  const fields = new Map<string, string>()
  if (lines[0]?.trim() !== '---') return { fields, present: false }

  const end = lines.findIndex((line, i) => i > 0 && line.trim() === '---')
  if (end === -1) return { fields, present: false }

  for (const line of lines.slice(1, end)) {
    if (line.trim() === '' || line.trimStart().startsWith('#')) continue
    const at = line.indexOf(':')
    if (at === -1) continue
    const key = line.slice(0, at).trim()
    // Trailing `# comment` is stripped, then surrounding quotes. Both appear in hand-written
    // frontmatter and neither is part of the value.
    const value = line
      .slice(at + 1)
      .replace(/\s+#.*$/, '')
      .trim()
      .replace(/^["']|["']$/g, '')
    if (key !== '') fields.set(key, value)
  }

  return { fields, present: true }
}

/** A document's identity: basename, minus a status prefix, minus `.md`. */
export function identity(path: string): { name: string; prefix: string | undefined } {
  const base = (path.split('/').pop() ?? '').replace(/\.md$/, '')
  const at = base.indexOf('_')
  if (at === -1) return { name: base, prefix: undefined }

  const prefix = base.slice(0, at)
  if (!STATUS_PREFIXES.includes(prefix)) return { name: base, prefix: undefined }
  return { name: base.slice(at + 1), prefix }
}

export function parseDoc(doc: Doc): Parsed {
  const { fields, present } = splitFrontmatter(doc.text)
  const { name, prefix } = identity(doc.path)
  return {
    path: doc.path,
    name,
    prefix,
    directory: doc.path.split('/').slice(0, -1).join('/'),
    fields,
    present,
  }
}

const issue = (file: string, rule: string, message: string, fix: string): Issue => ({
  file,
  rule,
  message,
  fix,
})

/**
 * Every rule, over the whole corpus at once.
 *
 * Whole-corpus rather than per-file because three of the checks are relational — a reference
 * resolves against the other documents, and "one in-progress plan per track" is a statement about
 * the set. A per-file validator could not have caught the dangling pointer this was written for.
 */
export function checkPlans(docs: readonly Doc[]): Issue[] {
  const parsed = docs.map(parseDoc)
  const issues: Issue[] = []

  // Indexed by name, then filtered by kind at the point of use — the collision between a stub and
  // the plan it became is expected, and `kind` is what tells them apart.
  const byName = new Map<string, Parsed[]>()
  for (const doc of parsed) {
    byName.set(doc.name, [...(byName.get(doc.name) ?? []), doc])
  }

  const inProgress = new Map<string, string[]>()

  for (const doc of parsed) {
    const { path, fields } = doc

    if (!doc.present) {
      issues.push(
        issue(
          path,
          'frontmatter',
          'no frontmatter block',
          'add a `---` fenced block as the first thing in the file, with at least `kind:` and `status:`',
        ),
      )
      continue
    }

    const kind = fields.get('kind')
    if (kind === undefined || !KINDS.includes(kind as Kind)) {
      issues.push(
        issue(
          path,
          'kind',
          `kind is ${kind === undefined ? 'missing' : `\`${kind}\``}`,
          `set kind to one of: ${KINDS.join(' · ')}`,
        ),
      )
      continue
    }

    const allowed = STATUSES[kind as Kind]
    const status = fields.get('status')
    if (status === undefined || !allowed.includes(status)) {
      issues.push(
        issue(
          path,
          'status',
          `status is ${status === undefined ? 'missing' : `\`${status}\``}, which is not a ${kind} status`,
          `set status to one of: ${allowed.join(' · ')}`,
        ),
      )
      continue
    }

    const date = fields.get('date')
    if (date === undefined || !ISO_DATE.test(date)) {
      issues.push(
        issue(
          path,
          'date',
          `date is ${date === undefined ? 'missing' : `\`${date}\``}`,
          'set date to the day the document was authored, as YYYY-MM-DD',
        ),
      )
    }

    for (const field of REQUIRED[status] ?? []) {
      const value = fields.get(field)
      if (value === undefined || value === '') {
        issues.push(
          issue(path, 'required-field', `status \`${status}\` requires \`${field}:\``, `add \`${field}:\``),
        )
      }
    }

    if (status === 'completed') {
      const completed = fields.get('completed')
      if (completed !== undefined && !ISO_DATE.test(completed)) {
        issues.push(
          issue(path, 'date', `completed is \`${completed}\``, 'write the completion date as YYYY-MM-DD'),
        )
      }
    }

    if (status === 'not-implemented') {
      const reason = fields.get('reason')
      if (reason !== undefined && !(reason in REASONS)) {
        issues.push(
          issue(
            path,
            'reason',
            `reason is \`${reason}\``,
            `set reason to one of: ${Object.keys(REASONS).join(' · ')}`,
          ),
        )
      } else if (reason !== undefined) {
        const names = REASONS[reason] as string
        if ((fields.get(names) ?? '') === '') {
          issues.push(
            issue(
              path,
              'required-field',
              `reason \`${reason}\` must name something, via \`${names}:\``,
              `add \`${names}:\``,
            ),
          )
        }
      }
    }

    if (status === 'closed' && (fields.get('closed_by') ?? fields.get('closed_reason') ?? '') === '') {
      issues.push(
        issue(
          path,
          'required-field',
          'status `closed` requires `closed_by:` or `closed_reason:`',
          'add whichever fits — a document that closed it, or the reason it was dropped',
        ),
      )
    }

    for (const [field, kinds] of Object.entries(REFERENCES)) {
      const value = fields.get(field)
      if (value === undefined || value === '') continue

      if (value.includes('/') || value.endsWith('.md')) {
        issues.push(
          issue(
            path,
            'reference',
            `\`${field}\` is a path, not a name: \`${value}\``,
            'references name a document — drop the directory and the `.md`, keeping `<slug>_<date>`',
          ),
        )
        continue
      }

      const candidates = (byName.get(value) ?? []).filter((other) => {
        // A document is never promoted from, superseded by, or closed by itself. Excluding the
        // referrer is what resolves the corpus's one real collision shape: a stub promoted the
        // day it was filed shares slug and date with the plan it became, so that plan's
        // `promoted_from` names two documents, one of which is the plan itself.
        if (other.path === doc.path) return false
        const otherKind = other.fields.get('kind')
        return otherKind !== undefined && kinds.includes(otherKind as Kind)
      })

      if (candidates.length === 0) {
        issues.push(
          issue(
            path,
            'reference',
            `\`${field}: ${value}\` resolves to no ${kinds.join(' or ')}`,
            'check the name, or file the document it should be naming',
          ),
        )
      } else if (candidates.length > 1) {
        issues.push(
          issue(
            path,
            'reference',
            `\`${field}: ${value}\` is ambiguous — ${candidates.map((c) => c.path).join(', ')}`,
            'rename one of them, so a name identifies one document',
          ),
        )
      }
    }

    const expected = DIRECTORY[`${kind}/${status}`]
    if (expected !== undefined && !expected.includes(doc.directory)) {
      const where = expected.map((d) => `${d}/`).join(' or ')
      issues.push(
        issue(
          path,
          'directory',
          `status \`${status}\` belongs in ${where}, not ${doc.directory}/`,
          `git mv the file to ${expected[0] as string}/, or correct its status`,
        ),
      )
    }

    if (kind === 'stub') {
      const wanted = PREFIX[status]
      if (wanted !== undefined && doc.prefix !== wanted) {
        issues.push(
          issue(
            path,
            'prefix',
            `status \`${status}\` wants the \`${wanted}_\` filename prefix, found \`${doc.prefix ?? 'none'}_\``,
            `git mv the file to ${wanted}_${doc.name}.md, or correct its status`,
          ),
        )
      }
    }

    if (kind === 'plan') {
      const track = fields.get('track')
      if (track === undefined || track === '') {
        issues.push(
          issue(path, 'track', 'a plan declares a `track:`', 'add `track: main` unless a sub-agent owns it'),
        )
      } else if (status === 'in-progress') {
        inProgress.set(track, [...(inProgress.get(track) ?? []), path])
      }
    }
  }

  for (const [track, paths] of inProgress) {
    if (paths.length > 1) {
      issues.push(
        issue(
          paths[1] as string,
          'track',
          `track \`${track}\` has ${paths.length} plans in progress — ${paths.join(', ')}`,
          'in-progress/ holds one plan per track; return all but one to planning/',
        ),
      )
    }
  }

  return issues
}

/** The report. Same shape as `validate:content`'s, because a second dialect is a second thing to learn. */
export function formatIssues(issues: readonly Issue[], root: string): string {
  if (issues.length === 0) return `OK  no problems found in ${root}`

  const byFile = new Map<string, Issue[]>()
  for (const one of issues) {
    byFile.set(one.file, [...(byFile.get(one.file) ?? []), one])
  }

  const lines: string[] = []
  for (const [file, fileIssues] of byFile) {
    lines.push(`${root}/${file}`)
    for (const one of fileIssues) {
      lines.push(`  [${one.rule}]`)
      lines.push(`      ${one.message}`)
      lines.push(`      fix: ${one.fix}`)
    }
    lines.push('')
  }

  const plural = (n: number, noun: string): string => `${n} ${noun}${n === 1 ? '' : 's'}`
  lines.push(`FAIL  ${plural(issues.length, 'problem')} in ${plural(byFile.size, 'file')}`)
  return lines.join('\n')
}
