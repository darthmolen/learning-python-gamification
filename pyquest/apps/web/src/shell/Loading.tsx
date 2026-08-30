import type { ReactNode } from 'react';
import { color, font } from '../design/tokens';
import type { Resource } from '../gateway/useResource.ts';
import { Eyebrow, Mono, Panel } from './ui';

/**
 * What a screen shows while it is waiting, and when it could not get what it asked for.
 *
 * **Deliberately plain, and deliberately still.** No artboard specifies a loading state, so
 * anything animated here would be invented — and these screens have no vocabulary for motion:
 * nothing else in the app spins, pulses or slides. A spinner would be the loudest thing on a
 * page whose whole design is quiet.
 *
 * The layout does not jump either. `loading` occupies the place the content will, so the screen
 * does not rearrange itself under his cursor when the answer lands. That matters more on the
 * link this actually runs over — his laptop to the parent's machine, across the house — than it
 * would on a fast one.
 *
 * A proper design pass is owed and is recorded rather than guessed at:
 * `planning/backlog/feature_loading-and-error-design_2026-08-30.md`.
 */
export function Awaiting<T>({
  resource,
  label,
  children,
}: {
  resource: Resource<T>;
  /** What is being waited for, named the way the screen names it: "the campaign", "Area 3". */
  label: string;
  children: (value: T) => ReactNode;
}) {
  if (resource.status === 'loading') {
    return (
      <div style={{ padding: '26px 32px' }}>
        <Eyebrow>{`loading ${label}`}</Eyebrow>
      </div>
    );
  }

  if (resource.status === 'failed') {
    return (
      <div style={{ padding: '26px 32px' }}>
        <Eyebrow style={{ color: color.danger, marginBottom: '12px' }}>{`could not load ${label}`}</Eyebrow>
        <Panel>
          {/*
            * The reason, verbatim. He is learning to read errors — §3 makes that Area 0's
            * promise — and a screen that hides its own is teaching the opposite of the lesson
            * the Quest screen teaches two clicks away.
            */}
          <pre style={{ margin: 0, fontFamily: font.mono, fontSize: '12px', color: color.secondary, whiteSpace: 'pre-wrap' }}>
            {resource.error}
          </pre>
          <Mono style={{ display: 'block', marginTop: '12px' }}>
            The game lives on the other machine. If it is off, this is what that looks like.
          </Mono>
        </Panel>
      </div>
    );
  }

  return <>{children(resource.value)}</>;
}
