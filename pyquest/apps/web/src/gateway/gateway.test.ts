import {
  AreaIdentitiesSchema,
  AvailableQuestsSchema,
  DueInvasionsSchema,
  LevelSchema,
  StandingsSchema,
  XpSourcesSchema,
} from '@pyquest/contract';
import { describe, expect, it } from 'vitest';
import * as gateway from './index.ts';

/**
 * The seam Phase 5 rests on. Every contract surface is reached through here: the gateway owns
 * the fixture now and the `fetch` later, so "one module changes" is a property of the code
 * rather than a promise in a plan.
 *
 * What it must do is **parse**, not pass through. A fixture is an object literal, and an object
 * literal agrees with whatever you believed when you typed it — the rules that catch drift live
 * in the schemas and only run when something calls `.parse()`. A gateway that returns the
 * literal is a gateway that will hand a drifted shape to a screen and let it render.
 */
describe('the gateway parses rather than passes through', () => {
  it('returns area identities that satisfy the collection schema', () => {
    expect(() => AreaIdentitiesSchema.parse(gateway.getAreaIdentities())).not.toThrow();
  });

  it('rejects a drifted payload instead of returning it', () => {
    // What a real drift looks like: the API renames a field and the SPA has not caught up.
    const drifted = [{ area: 3, name: 'Collections', weeks: { from: 9, to: 14 }, blurb: 'x' }];
    // Named, not bare: a bare `toThrow()` is satisfied by the TypeError from a function that
    // does not exist yet, which is a test passing for the reason it was written to rule out.
    expect(() => gateway.parseAreaIdentities(drifted)).toThrow(/title/);
  });

  it('rejects a payload that breaks a rule the type system cannot see', () => {
    // Correctly shaped, and still wrong: §5.4 says an area appears once.
    const duplicated = [
      { area: 3, title: 'Collections', weeks: { from: 9, to: 14 }, blurb: 'x' },
      { area: 3, title: 'Collections Again', weeks: { from: 9, to: 14 }, blurb: 'y' },
    ];
    expect(() => gateway.parseAreaIdentities(duplicated)).toThrow(/appears once/);
  });
});

/**
 * Every fixture through its **collection** schema, not its entry schema. The rules live on the
 * collection: `DueInvasionsSchema` carries the §5.4 cap and the one-entry-per-concept
 * refinement, and `DueInvasionSchema` cannot carry either because one entry cannot know about
 * the others. A fixture checked entry by entry is green while violating the spec.
 */
describe('every fixture parses at its collection schema', () => {
  it('area identities', () => {
    expect(AreaIdentitiesSchema.parse(gateway.getAreaIdentities())).toHaveLength(8);
  });

  it('the Defend queue, under the §5.4 cap and one entry per concept', () => {
    expect(() => DueInvasionsSchema.parse(gateway.getDueInvasions())).not.toThrow();
  });

  it('the completion board', () => {
    expect(() => StandingsSchema.parse(gateway.getStandings())).not.toThrow();
  });

  it('XP provenance', () => {
    expect(() => XpSourcesSchema.parse(gateway.getXpSources())).not.toThrow();
  });

  it('the level, whose parts must sum to its denominator', () => {
    expect(() => LevelSchema.parse(gateway.getLevel())).not.toThrow();
  });

  it('an area’s quest cards', () => {
    expect(() => AvailableQuestsSchema.parse(gateway.getAvailableQuests(3))).not.toThrow();
  });

  it('every area’s progress and boss state', () => {
    for (const area of [0, 1, 2, 3, 4, 5, 6, 7]) {
      expect(() => gateway.getAreaProgress(area)).not.toThrow();
      expect(() => gateway.getBossState(area)).not.toThrow();
    }
  });
});
