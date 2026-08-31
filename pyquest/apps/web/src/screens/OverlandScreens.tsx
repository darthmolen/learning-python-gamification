import { font } from '../design/tokens';
import { Mono, Panel } from '../shell/ui';

/**
 * The one overland destination whose content is not in the contract yet.
 *
 * The Journal's entry text is required by `JournalEntrySchema` and held by no column, so this
 * renders its frame and says what is missing rather than inventing a body.
 *
 * **The Console left this file on 2026-08-31, and its leaving is worth a line.** The two were
 * paired here because they looked alike, and the pairing hid the fact that only one of them was
 * blocked: `GET /api/signoffs` was served the whole time. See
 * `apps/web/src/screens/ConsoleScreen.tsx`.
 *
 * The copy below is owed a correction of its own — the ruling of 2026-08-31 is that markdown in
 * his repository is the system of record and Postgres is not, which is a different sentence than
 * "rows the API owes". That belongs to whoever takes
 * `planning/backlog/feature_journal-text-has-no-column_2026-08-29.md`.
 */
function Frame({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ padding: '26px 32px 40px' }}>
      <h1 style={{ margin: 0, fontFamily: font.display, fontSize: '24px', letterSpacing: '-.015em' }}>{title}</h1>
      <div style={{ marginTop: '24px' }}>{children}</div>
    </div>
  );
}

export function JournalScreen() {
  return (
    <Frame title="Journal">
      <Panel>
        <Mono>Entries, prompts and replies are Postgres rows the API owes (§5.6).</Mono>
      </Panel>
    </Frame>
  );
}
