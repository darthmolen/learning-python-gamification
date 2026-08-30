import { font } from '../design/tokens';
import { Mono, Panel } from '../shell/ui';

/**
 * The two overland destinations whose content is not in the contract yet.
 *
 * Journal entries and Console sign-off are payloads the API owes and `endpoints.ts` does not
 * carry — so these render their frame and say what is missing rather than inventing a body.
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

export function ConsoleScreen() {
  return (
    <Frame title="Console">
      <Panel>
        <Mono>Sign-off, authoring and streak forgiveness. Every player has one (§5.11).</Mono>
      </Panel>
    </Frame>
  );
}
