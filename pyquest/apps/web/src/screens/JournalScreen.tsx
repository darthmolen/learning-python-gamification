import { useCallback, useState } from 'react';
import type { JournalEntry, JournalTemplate } from '@pyquest/contract';
import { color, eyebrow, font } from '../design/tokens';
import { getJournal, getJournalTemplate } from '../gateway/index.ts';
import { usePlayer } from '../session/SessionProvider.tsx';
import { useResource } from '../gateway/useResource.ts';
import { journalPayout } from '../present/index.ts';
import { Awaiting } from '../shell/Loading';
import { Eyebrow, Mono, Panel } from '../shell/ui';

/**
 * §5.6's Journal — `docs/design/pyquest/Journal.dc.html`.
 *
 * **It reads and it does not write, and that is ADR 0004 rather than a gap.** The prose lives in
 * his repository; he writes `journal.md` and commits it, and that *is* the post — §6.4 makes push
 * the verification mechanism, so a second way to author one artifact would only give the two
 * something to disagree about. `POST /journal` was removed from the contract on 2026-08-31.
 *
 * So the artboard's draft editor is not built. What replaces it is the thing a learner staring at
 * an empty Journal in week 1 actually needs: **the entry to copy, and where to put it** — served
 * from the curriculum rather than written into this file, because the template is authored
 * content that differs per area and grows.
 */
export function JournalScreen() {
  const playerId = usePlayer();

  /*
   * Two resources, and they fail independently on purpose. Only areas 0 and 1 have a
   * `TEMPLATE.md` today, so the template is the call most likely to fail — and a learner whose
   * own writing is on screen must never lose it because a coaching file is unauthored.
   */
  const loadEntries = useCallback(() => getJournal(playerId), [playerId]);
  const entries = useResource(loadEntries, [playerId]);

  const loadTemplate = useCallback(() => getJournalTemplate(playerId), [playerId]);
  const template = useResource(loadTemplate, [playerId]);

  return (
    <Awaiting resource={entries} label="your journal">
      {(written) => <Journal entries={written} template={template} />}
    </Awaiting>
  );
}

/** Newest first. The list is a way back into what he wrote, not a chronology to read forwards. */
const newestFirst = (entries: JournalEntry[]): JournalEntry[] =>
  [...entries].sort((a, b) => b.sessionDate.localeCompare(a.sessionDate));

function Journal({
  entries,
  template,
}: {
  entries: JournalEntry[];
  template: ReturnType<typeof useResource<JournalTemplate>>;
}) {
  const ordered = newestFirst(entries);
  const [selected, setSelected] = useState(0);
  const current = ordered[selected];

  return (
    <div style={{ display: 'flex', flexGrow: 1, minHeight: 0 }}>
      {/* The artboard's 296px column. */}
      <div
        style={{
          width: '296px',
          flexShrink: 0,
          borderRight: `1px solid ${color.borderStrong}`,
          background: color.panel,
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
        }}
      >
        <div style={{ padding: '24px 24px 16px', borderBottom: `1px solid ${color.border}` }}>
          <h1 style={{ margin: '0 0 4px', fontFamily: font.display, fontSize: '22px', letterSpacing: '-.015em' }}>
            The Journal
          </h1>
          <Mono style={{ fontSize: '11px' }}>
            {entries.length === 1 ? '1 entry' : `${entries.length} entries`}
          </Mono>
        </div>

        <div style={{ flexGrow: 1, overflow: 'auto', padding: '12px 0' }}>
          {ordered.length === 0 ? (
            <div style={{ padding: '12px 24px' }}>
              <Mono>Nothing yet.</Mono>
            </div>
          ) : (
            <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {ordered.map((entry, index) => (
                <li key={entry.sessionDate}>
                  <EntryButton
                    entry={entry}
                    current={index === selected}
                    onSelect={() => setSelected(index)}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* The entry itself, and the template under it. */}
      <div style={{ flexGrow: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
        {current === undefined ? <NothingWritten /> : <Entry entry={current} />}
        <div style={{ padding: '0 44px 40px' }}>
          <TemplatePanel template={template} />
        </div>
      </div>

      {/* The reply column — §5.6's half that makes this a conversation rather than a diary. */}
      <div
        style={{
          width: '404px',
          flexShrink: 0,
          borderLeft: `1px solid ${color.borderStrong}`,
          background: color.panel,
          padding: '24px 28px',
          overflow: 'auto',
        }}
      >
        <Eyebrow style={{ marginBottom: '16px' }}>DM reply</Eyebrow>
        {current?.reply === undefined ? (
          /*
           * The artboard writes "Dad replied". The lexicon says `dm`, and roles are not people
           * (§5.11) — the same seat is held by whoever is holding it.
           */
          <Mono style={{ display: 'block' }}>
            No reply yet. A reply lands after the entry, so this is the ordinary state.
          </Mono>
        ) : (
          <div style={{ borderLeft: `2px solid ${color.info}`, paddingLeft: '14px' }}>
            <p style={{ margin: 0, color: color.fgBright, fontSize: '13px', lineHeight: 1.7 }}>
              {current.reply}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * One row in the list: the date, what it paid, and whether it was answered.
 *
 * A button rather than a clickable `div`, so it is reachable by keyboard and announced as
 * something that can be pressed. `aria-current` is what tells a screen reader which entry is
 * open, since the visual answer is a background colour.
 */
function EntryButton({
  entry,
  current,
  onSelect,
}: {
  entry: JournalEntry;
  current: boolean;
  onSelect: () => void;
}) {
  const answered = entry.reply !== undefined;

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-current={current ? 'true' : undefined}
      style={{
        display: 'block',
        width: '100%',
        textAlign: 'left',
        padding: '11px 24px',
        background: current ? color.avatarBg : 'transparent',
        borderLeft: `2px solid ${current ? color.accent : color.crumbRule}`,
        borderTop: 0,
        borderRight: 0,
        borderBottom: 0,
        color: current ? color.fg : color.secondary,
        fontFamily: font.sans,
        fontSize: '12.5px',
        cursor: 'pointer',
      }}
    >
      <span style={{ display: 'flex', alignItems: 'baseline', gap: '9px' }}>
        <span style={{ fontWeight: current ? 600 : 400 }}>{entry.sessionDate}</span>
        <span style={{ flexGrow: 1 }} />
        {/*
          * The artboard's speech bubble, and it carries a name. An icon with no accessible name
          * is a mark only sighted readers get, and "the DM answered this one" is exactly the
          * kind of thing a learner scans the list for.
          */}
        {answered && (
          <svg width="12" height="12" viewBox="0 0 12 12" role="img" aria-label="answered">
            <path d="M1 2h10v6H5.5L3 10.5V8H1z" fill="none" stroke={color.info} strokeWidth="1.2" />
          </svg>
        )}
      </span>
      <span style={{ ...eyebrow, display: 'block', marginTop: '4px', fontSize: '10px' }}>
        {journalPayout(entry.xpAwarded)}
      </span>
    </button>
  );
}

/**
 * No entries at all, which is the state the campaign spends its first eight weeks in.
 *
 * §5.6 starts the Journal in week 1 as plain markdown and only commits it at Area 2a, so there is
 * genuinely nothing to read for two months. Saying so plainly is the difference between a screen
 * that is waiting for him and one that looks broken.
 */
function NothingWritten() {
  return (
    <div style={{ padding: '30px 44px 22px' }}>
      <h2 style={{ margin: 0, fontFamily: font.display, fontSize: '28px', letterSpacing: '-.015em' }}>
        Nothing written yet
      </h2>
      <p style={{ margin: '14px 0 0', color: color.secondary, maxWidth: '620px' }}>
        Entries appear here once one has been committed and paid for. Ten XP an entry, paid for
        substance — the template below is what to copy.
      </p>
    </div>
  );
}

function Entry({ entry }: { entry: JournalEntry }) {
  return (
    <>
      <div style={{ padding: '30px 44px 22px', borderBottom: `1px solid ${color.border}` }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '14px' }}>
          <Eyebrow>{journalPayout(entry.xpAwarded)}</Eyebrow>
          <div style={{ flexGrow: 1 }} />
          {/* The commit is the join between a paid row and the prose it paid for. */}
          <Mono style={{ fontSize: '11px' }}>{entry.commitSha}</Mono>
        </div>
        <h2 style={{ margin: '10px 0 0', fontFamily: font.display, fontSize: '28px', letterSpacing: '-.015em' }}>
          {entry.sessionDate}
        </h2>
      </div>

      <div style={{ padding: '28px 44px' }}>
        {/*
          * His markdown, as he wrote it, whitespace and headings intact. Not rendered through a
          * markdown library: what is on screen should be what is in his file, because the file is
          * the thing he is learning to keep.
          */}
        <pre
          style={{
            margin: 0,
            maxWidth: '720px',
            fontFamily: font.sans,
            fontSize: '14px',
            lineHeight: 1.65,
            color: color.fgBright,
            whiteSpace: 'pre-wrap',
          }}
        >
          {entry.body}
        </pre>
      </div>
    </>
  );
}

/**
 * The entry to copy, expanded **in place**.
 *
 * The Tome's rule is the app's rule: no pop-over, nothing covered, nothing lost. It pushes the
 * page down, so the entry he was reading stays where it was.
 *
 * The label does not change on the second press. A button reading "Hide" once it is open is the
 * same mistake as "Take it cold" on a screen showing three quests cleared — `aria-expanded`
 * carries the state, which is what it is for.
 */
function TemplatePanel({ template }: { template: ReturnType<typeof useResource<JournalTemplate>> }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const markdown = template.status === 'ready' ? template.value.markdown : '';

  const copy = () => {
    /* `navigator.clipboard` is absent over plain HTTP on anything but localhost, and §6.4 puts
     * this app on a LAN address. So the failure is expected rather than exceptional, and what
     * happens then is that the text is already on screen and selectable. */
    void navigator.clipboard?.writeText(markdown).then(
      () => setCopied(true),
      () => setCopied(false),
    );
  };

  return (
    <div style={{ marginTop: '28px' }}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-controls="journal-template"
        style={{
          padding: '10px 22px',
          background: 'transparent',
          border: `1px solid ${color.accentMid}`,
          color: color.accent,
          fontFamily: font.sans,
          fontWeight: 700,
          fontSize: '13px',
          cursor: 'pointer',
        }}
      >
        Tonight's entry — the template
      </button>

      {open && (
        <div id="journal-template" style={{ marginTop: '16px' }}>
          {template.status === 'loading' && <Mono>loading the template</Mono>}

          {/*
            * A template that could not be fetched says so here and nowhere else. His entries are
            * already on the page above and stay there — which is the whole reason this is a
            * second resource rather than one request carrying both.
            */}
          {template.status === 'failed' && (
            <Panel>
              <Mono style={{ display: 'block' }}>
                No template for this area yet — it is authored per area, and this one is not
                written. Copy the shape of an earlier entry instead.
              </Mono>
            </Panel>
          )}

          {template.status === 'ready' && (
            <Panel style={{ padding: '18px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', marginBottom: '14px' }}>
                {/* Which area's template this is. A guess the reader can see is one they can
                  * correct; a silent one is not. */}
                <Eyebrow>{`Area ${template.value.area}`}</Eyebrow>
                <div style={{ flexGrow: 1 }} />
                <button
                  type="button"
                  onClick={copy}
                  style={{
                    padding: '6px 16px',
                    background: color.border,
                    border: 'none',
                    color: color.fg,
                    fontFamily: font.sans,
                    fontSize: '12px',
                    cursor: 'pointer',
                  }}
                >
                  Copy
                </button>
                {/* Beside the button, never inside its label. A live region so the confirmation
                  * is announced rather than only appearing. */}
                <span
                  role="status"
                  aria-live="polite"
                  style={{ fontFamily: font.mono, fontSize: '11px', color: color.muted, minWidth: '54px' }}
                >
                  {copied ? 'copied' : ''}
                </span>
              </div>

              <p style={{ margin: '0 0 14px', color: color.secondary, fontSize: '13px', lineHeight: 1.6 }}>
                Paste it at the <strong>bottom</strong> of <Mono>{template.value.path}</Mono> in your
                own repository, fill it in, then commit and push. The date on the heading is what
                the game reads, so it goes in as <Mono>YYYY-MM-DD</Mono> — copy it rather than
                retyping it.
              </p>

              <pre
                style={{
                  margin: 0,
                  padding: '14px 16px',
                  background: color.bg,
                  border: `1px solid ${color.border}`,
                  fontFamily: font.mono,
                  fontSize: '12px',
                  lineHeight: 1.6,
                  color: color.fgBright,
                  whiteSpace: 'pre-wrap',
                  maxHeight: '380px',
                  overflow: 'auto',
                }}
              >
                {template.value.markdown}
              </pre>
            </Panel>
          )}
        </div>
      )}
    </div>
  );
}
