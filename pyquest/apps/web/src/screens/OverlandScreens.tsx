import { font } from '../design/tokens';
import { Eyebrow, Mono, Panel } from '../shell/ui';
import { Tome } from '../tome/Tome';

/**
 * The three overland destinations whose content is not in the contract yet.
 *
 * Journal entries, Console sign-off and the Tome's syllabus are all payloads the API owes and
 * `endpoints.ts` does not carry — so these render their frame and say what is missing rather
 * than inventing a body. The Tome's expand-in-place behaviour is real and mounted here.
 */
function Frame({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ padding: '26px 32px 40px' }}>
      <h1 style={{ margin: 0, fontFamily: font.display, fontSize: '24px', letterSpacing: '-.015em' }}>{title}</h1>
      <div style={{ marginTop: '24px' }}>{children}</div>
    </div>
  );
}

export function TomeScreen() {
  return (
    <Frame title="Tome">
      <Eyebrow style={{ marginBottom: '12px' }}>The field manual</Eyebrow>
      <Tome>
        <p style={{ margin: 0 }}>
          The syllabus expands here, in place. Nothing underneath is covered and nothing is lost —
          if looking something up costs him the code in his editor, he stops looking things up.
        </p>
      </Tome>
      <Mono style={{ display: 'block', marginTop: '18px' }}>
        Sections and concepts come from content the API has yet to serve.
      </Mono>
    </Frame>
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
