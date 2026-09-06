/**
 * The board's schema, attacked.
 *
 * Every test here is a document somebody will actually write, and each asserts on the rule that
 * catches it rather than on "some issue was raised" — a validator that reports the wrong rule
 * sends the author to the wrong line.
 *
 * The two relational rules get the most attention. A per-file validator could not have caught
 * either, and they are the reason this checker takes the whole corpus at once.
 */

import { describe, expect, it } from 'vitest';
import { checkPlans, identity, splitFrontmatter, type Doc } from './plans.ts';

/** A document, as the CLI hands it over. */
const doc = (path: string, fields: Record<string, string>, body = '# Title\n'): Doc => ({
  path,
  text: `---\n${Object.entries(fields)
    .map(([k, v]) => `${k}: ${v}`)
    .join('\n')}\n---\n\n${body}`,
});

const rules = (docs: readonly Doc[]): string[] => checkPlans(docs).map((i) => i.rule);

const PLAN = {
  kind: 'plan',
  status: 'queued',
  track: 'main',
  date: '2026-09-04',
};

const STUB = { kind: 'stub', status: 'open', date: '2026-09-04' };

describe('splitFrontmatter', () => {
  it('reads a flat block', () => {
    const { fields, present } = splitFrontmatter('---\nkind: plan\nstatus: queued\n---\n\n# T\n');
    expect(present).toBe(true);
    expect(fields.get('kind')).toBe('plan');
    expect(fields.get('status')).toBe('queued');
  });

  it('is absent when the file does not open with a fence', () => {
    expect(splitFrontmatter('# Title\n\n**Status:** Backlog\n').present).toBe(false);
  });

  it('is absent when the fence never closes', () => {
    expect(splitFrontmatter('---\nkind: plan\n\n# Title\n').present).toBe(false);
  });

  it('strips quotes and trailing comments, which hand-written frontmatter carries', () => {
    const { fields } = splitFrontmatter('---\ntrack: "main"  # unless a sub-agent owns it\n---\n');
    expect(fields.get('track')).toBe('main');
  });

  it('survives CRLF, because this repository is on Windows', () => {
    const { fields, present } = splitFrontmatter('---\r\nkind: stub\r\nstatus: open\r\n---\r\n');
    expect(present).toBe(true);
    expect(fields.get('status')).toBe('open');
  });
});

describe('identity', () => {
  it('strips a status prefix, because that is the part that changes', () => {
    expect(identity('planning/backlog/promoted_seed-a-test-household_2026-08-30.md')).toEqual({
      name: 'seed-a-test-household_2026-08-30',
      prefix: 'promoted',
    });
  });

  it('keeps a reminder category, because that is not a status', () => {
    expect(identity('planning/reminders/verify_boss-2-cold-clone_2026-09-01.md').name).toBe(
      'verify_boss-2-cold-clone_2026-09-01',
    );
  });

  it('leaves a review basename alone', () => {
    expect(identity('planning/needs-review/completed/2026-09-01-finish-the-spa.md').name).toBe(
      '2026-09-01-finish-the-spa',
    );
  });

  it('gives a stub and the plan it became the same identity', () => {
    const stub = identity('planning/backlog/promoted_a-submission_2026-09-03.md').name;
    const plan = identity('planning/feature_a-submission_2026-09-03.md').name;
    expect(stub).toBe(plan);
  });
});

describe('the rules that stop the board lying', () => {
  it('accepts a well-formed corpus', () => {
    expect(checkPlans([doc('planning/feature_x_2026-09-04.md', PLAN)])).toEqual([]);
  });

  it('catches a document with no frontmatter at all', () => {
    expect(rules([{ path: 'planning/feature_x_2026-09-04.md', text: '# Title\n' }])).toEqual([
      'frontmatter',
    ]);
  });

  it('refuses a status from the wrong kind s vocabulary', () => {
    // `done` is a reminder status. A plan is never `done`, it is `completed`.
    expect(rules([doc('planning/feature_x_2026-09-04.md', { ...PLAN, status: 'done' })])).toEqual([
      'status',
    ]);
  });

  it('requires the date a completed plan is claiming', () => {
    const d = doc('planning/completed/feature_x_2026-09-04.md', {
      ...PLAN,
      status: 'completed',
    });
    expect(rules([d])).toContain('required-field');
  });

  it('requires a blocker to be named', () => {
    const d = doc('planning/blocked/feature_x_2026-09-04.md', { ...PLAN, status: 'blocked' });
    expect(rules([d])).toContain('required-field');
  });

  it('requires a closed stub to say what closed it', () => {
    const d = doc('planning/backlog/closed_x_2026-09-04.md', { ...STUB, status: 'closed' });
    expect(rules([d])).toContain('required-field');
  });

  it('accepts closed_reason in place of closed_by', () => {
    const d = doc('planning/backlog/closed_x_2026-09-04.md', {
      ...STUB,
      status: 'closed',
      closed_reason: 'ruled out by the DM',
    });
    expect(checkPlans([d])).toEqual([]);
  });

  it('makes the directory agree with the status', () => {
    // A completed plan sitting in the queue root tells a reader it is ready to start.
    const d = doc('planning/feature_x_2026-09-04.md', {
      ...PLAN,
      status: 'completed',
      completed: '2026-09-04',
    });
    expect(rules([d])).toContain('directory');
  });

  it('holds review documents to a directory too', () => {
    // `review` was in the kind vocabulary but absent from the directory map, so a review copy
    // could sit anywhere in the tree and the validator would pass it — the one kind with no
    // placement rule, which is also the kind most likely to be dropped in the wrong folder by a
    // pipeline that moves files between four of them.
    const d = doc('planning/completed/2026-09-03-some-review.md', {
      kind: 'review',
      status: 'done',
      date: '2026-09-03',
    });
    expect(rules([d])).toContain('directory');
  });

  it('accepts a review anywhere the review pipeline legitimately puts it', () => {
    // needs-review/ is the queue, reviewed/ is the return leg, and both mean "not finished".
    const open = ['planning/needs-review', 'planning/needs-review/reviewed'].map((dir) =>
      doc(`${dir}/2026-09-03-some-review.md`, { kind: 'review', status: 'open', date: '2026-09-03' }),
    );
    const done = doc('planning/needs-review/completed/2026-09-03-other-review.md', {
      kind: 'review',
      status: 'done',
      date: '2026-09-03',
    });
    expect(checkPlans([...open, done])).toEqual([]);
  });

  it('makes the filename prefix agree with the status', () => {
    const d = doc('planning/backlog/feature_x_2026-09-04.md', {
      ...STUB,
      status: 'closed',
      closed_reason: 'ruled out',
    });
    expect(rules([d])).toContain('prefix');
  });

  it('requires a plan to declare a track', () => {
    const { track: _dropped, ...noTrack } = PLAN;
    expect(rules([doc('planning/feature_x_2026-09-04.md', noTrack)])).toContain('track');
  });

  it('refuses a reason outside the closed set', () => {
    const d = doc('planning/not-implemented/feature_x_2026-09-04.md', {
      ...PLAN,
      status: 'not-implemented',
      reason: 'we got bored',
    });
    expect(rules([d])).toContain('reason');
  });

  it('makes every not-implemented reason name something', () => {
    const d = doc('planning/not-implemented/feature_x_2026-09-04.md', {
      ...PLAN,
      status: 'not-implemented',
      reason: 'abandoned',
    });
    // `abandoned` earns the directory only if it records what was learned.
    expect(rules([d])).toContain('required-field');
  });
});

describe('references are names, and they resolve', () => {
  const plan = doc('planning/completed/feature_seed_2026-08-30.md', {
    ...PLAN,
    status: 'completed',
    completed: '2026-08-31',
  });

  it('resolves a promoted stub to the plan it became', () => {
    const stub = doc('planning/backlog/promoted_other_2026-08-30.md', {
      ...STUB,
      status: 'promoted',
      promoted_to: 'seed_2026-08-30',
    });
    expect(checkPlans([stub, plan])).toEqual([]);
  });

  it('catches the dangling pointer this validator was written for', () => {
    const stub = doc('planning/backlog/promoted_other_2026-08-30.md', {
      ...STUB,
      status: 'promoted',
      promoted_to: 'a-plan-that-was-deleted_2026-08-29',
    });
    const [issue] = checkPlans([stub, plan]);
    expect(issue?.rule).toBe('reference');
    expect(issue?.message).toContain('resolves to no plan');
  });

  it('rejects a path where a name belongs', () => {
    // The failure mode references-by-name exists to remove: a stored path is wrong the moment
    // its target moves, which is the normal life of a plan.
    const stub = doc('planning/backlog/promoted_other_2026-08-30.md', {
      ...STUB,
      status: 'promoted',
      promoted_to: 'planning/completed/feature_seed_2026-08-30.md',
    });
    const [issue] = checkPlans([stub, plan]);
    expect(issue?.rule).toBe('reference');
    expect(issue?.message).toContain('is a path, not a name');
  });

  it('does not break when the plan it names moves', () => {
    const stub = doc('planning/backlog/promoted_other_2026-08-30.md', {
      ...STUB,
      status: 'promoted',
      promoted_to: 'seed_2026-08-30',
    });
    const moved = doc('planning/in-progress/feature_seed_2026-08-30.md', {
      ...PLAN,
      status: 'in-progress',
    });
    // Same reference, different directory, still resolves. This is the whole argument for names.
    expect(checkPlans([stub, moved])).toEqual([]);
  });

  it('resolves a stub-plan name collision by kind', () => {
    // A stub promoted the day it was filed shares slug AND date with the plan it became. That is
    // the only collision shape in the corpus, and `kind` is what tells the two apart.
    const stub = doc('planning/backlog/promoted_seed_2026-08-30.md', {
      ...STUB,
      status: 'promoted',
      promoted_to: 'seed_2026-08-30',
    });
    const twin = doc('planning/completed/feature_seed_2026-08-30.md', {
      ...PLAN,
      status: 'completed',
      completed: '2026-08-31',
    });
    expect(checkPlans([stub, twin])).toEqual([]);
  });

  it('promotes out of another plan, not only out of a stub', () => {
    // `ursina-version-pinning-policy` grew out of the tier-3 spike's Anticipated Backlog section.
    // An item is promoted out of whatever was holding it, and that is sometimes a plan.
    const spike = doc('planning/completed/feature_spike_2026-08-26.md', {
      ...PLAN,
      status: 'completed',
      completed: '2026-08-27',
    });
    const grown = doc('planning/completed/feature_policy_2026-08-27.md', {
      ...PLAN,
      status: 'completed',
      completed: '2026-08-29',
      promoted_from: 'spike_2026-08-26',
    });
    expect(checkPlans([spike, grown])).toEqual([]);
  });

  it('does not let a document be promoted from itself', () => {
    // The corpus's one real collision: a stub promoted the day it was filed shares slug and date
    // with the plan it became, so the plan's `promoted_from` matches the stub AND itself.
    // Excluding the referrer is what makes the reference resolve to one document.
    const stub = doc('planning/backlog/promoted_thing_2026-09-03.md', {
      ...STUB,
      status: 'promoted',
      promoted_to: 'thing_2026-09-03',
    });
    const twin = doc('planning/feature_thing_2026-09-03.md', {
      ...PLAN,
      promoted_from: 'thing_2026-09-03',
    });
    expect(checkPlans([stub, twin])).toEqual([]);
  });

  it('reports an ambiguous reference with every candidate', () => {
    const stub = doc('planning/backlog/promoted_other_2026-08-30.md', {
      ...STUB,
      status: 'promoted',
      promoted_to: 'seed_2026-08-30',
    });
    const twin = doc('planning/in-progress/feature_seed_2026-08-30.md', {
      ...PLAN,
      status: 'in-progress',
    });
    const [issue] = checkPlans([stub, plan, twin]);
    expect(issue?.rule).toBe('reference');
    expect(issue?.message).toContain('ambiguous');
    expect(issue?.message).toContain('planning/completed/feature_seed_2026-08-30.md');
    expect(issue?.message).toContain('planning/in-progress/feature_seed_2026-08-30.md');
  });
});

describe('one in-progress plan per track', () => {
  const running = (slug: string, track: string): Doc =>
    doc(`planning/in-progress/feature_${slug}_2026-09-04.md`, {
      ...PLAN,
      status: 'in-progress',
      track,
    });

  it('allows two tracks to run at once', () => {
    expect(checkPlans([running('a', 'main'), running('b', 'content')])).toEqual([]);
  });

  it('catches two plans claiming the same track', () => {
    const [issue] = checkPlans([running('a', 'main'), running('b', 'main')]);
    expect(issue?.rule).toBe('track');
    expect(issue?.message).toContain('2 plans in progress');
  });

  it('does not count a queued plan against a running one', () => {
    expect(checkPlans([running('a', 'main'), doc('planning/feature_b_2026-09-04.md', PLAN)])).toEqual(
      [],
    );
  });
});
