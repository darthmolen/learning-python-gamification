import { useCallback } from 'react';
import type { HowTo, HowToSection } from '@pyquest/contract';
import { color, font } from '../design/tokens';
import { getHowTo } from '../gateway/index.ts';
import { useResource } from '../gateway/useResource.ts';
import { Awaiting } from '../shell/Loading';
import { Display, Eyebrow, Mono } from '../shell/ui';
import { Markdown } from '../tome/Markdown';

/**
 * HOW-TO — the page that explains the rest of them.
 *
 * **Why this is a rail destination and not a page of the Tome (ADR 0008).** `Rail.tsx` objects
 * that a seventh entry would mean something was promoted out of the place it belongs to. This
 * belongs to no place: it has no parent area and no parent screen, so there is nothing to be
 * promoted out of, and §6.8's real test — true wherever you are standing — is met more
 * strongly here than by anything else in the rail. Confusion is the one thing in this product
 * that is genuinely location-independent.
 *
 * **Why it is stacked and not tabbed.** Learn before play, in one scroll. A tab is a claim that
 * the two halves are alternatives, and they are not — the second is only meaningful once the
 * first is understood, which is the entire lesson the page exists to teach.
 *
 * **Why it renders from content.** Every section is a markdown file under
 * `curriculum/how-to/` or `game/how-to/`, so the next thing that turns out to confuse him is
 * one authored file rather than a change to this component. The screen holds no prose of its
 * own beyond the labels.
 */
export function HowToScreen() {
  const load = useCallback(() => getHowTo(), []);
  const howTo = useResource(load, []);

  return (
    <Awaiting resource={howTo} label="how this works">
      {(value) => <Sections howTo={value} />}
    </Awaiting>
  );
}

/**
 * The curriculum's sections carry no badge and the overlay's say so.
 *
 * Not decoration: it is the honest label. `curriculum/` is what survives the game being
 * switched off, and a learner who reads the two halves as equally permanent has been told
 * something untrue about which one is the real thing.
 */
function Origin({ source }: { source: HowToSection['source'] }) {
  if (source === 'curriculum') return null;
  return (
    <Mono
      style={{
        fontSize: '10px',
        letterSpacing: '.1em',
        textTransform: 'uppercase',
        color: color.muted,
        border: `1px solid ${color.border}`,
        padding: '3px 9px',
      }}
    >
      the game
    </Mono>
  );
}

function Sections({ howTo }: { howTo: HowTo }) {
  return (
    <div style={{ overflow: 'auto', padding: '30px 40px 60px' }}>
      <div style={{ maxWidth: '680px' }}>
        <Eyebrow style={{ color: color.accent, marginBottom: '8px' }}>How-To</Eyebrow>
        <Display size={34}>How this works</Display>
        <p style={{ margin: '10px 0 0', color: color.fg, fontSize: '14.5px', lineHeight: 1.7 }}>
          The curriculum first, then the game that keeps score on part of it. Nothing here
          unlocks and nothing here is a test.
        </p>

        {/*
          * An empty answer is a real state rather than a fault — `game/` is an overlay and the
          * curriculum stands without it — but a page with nothing on it has to say so rather
          * than render as a heading over blank space.
          */}
        {howTo.sections.length === 0 && (
          <Mono style={{ display: 'block', marginTop: '28px', color: color.muted }}>
            Nothing is authored here yet.
          </Mono>
        )}

        {howTo.sections.map((section) => (
          <section key={section.id} style={{ marginTop: '40px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: '12px',
                paddingBottom: '10px',
                borderBottom: `1px solid ${color.border}`,
              }}
            >
              <h2
                style={{
                  margin: 0,
                  fontFamily: font.display,
                  fontSize: '22px',
                  color: color.fgBright,
                }}
              >
                {section.title}
              </h2>
              <div style={{ flexGrow: 1 }} />
              <Origin source={section.source} />
            </div>
            {/*
              * `baseLevel` 3, so the section's own `##` headings sit under the `h2` above
              * rather than starting a second document outline on one page.
              */}
            <Markdown text={section.body} baseLevel={3} />
          </section>
        ))}
      </div>
    </div>
  );
}
