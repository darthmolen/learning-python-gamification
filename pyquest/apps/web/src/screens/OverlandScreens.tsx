import { font } from '../design/tokens';
import { Mono, Panel } from '../shell/ui';

/**
 * The one overland destination whose content is not in the contract yet.
 *
 * The Journal's text lives in his repository rather than in this app's reach, so this renders
 * its frame and says where it is rather than inventing a body.
 *
 * **The Console left this file on 2026-08-31, and its leaving is worth a line.** The two were
 * paired here because they looked alike, and the pairing hid the fact that only one of them was
 * blocked: `GET /api/signoffs` was served the whole time. See
 * `apps/web/src/screens/ConsoleScreen.tsx`.
 *
 * **The copy was corrected on 2026-08-31**, because it said the opposite of what is true. ADR
 * 0004 ruled markdown in his repository the system of record and Postgres not, so "rows the API
 * owes" named a debt that will never be paid and should not be. `GET /journal` is served by
 * `planning/in-progress/feature_journal-reads-from-git_2026-08-31.md`, and this frame goes when
 * that lands.
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
        <Mono>Your journal.md lives in your own repository (§5.6). This screen reads it soon.</Mono>
      </Panel>
    </Frame>
  );
}
