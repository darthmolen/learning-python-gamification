import { describe, expect, it } from 'vitest';
import * as gateway from './index.ts';

/**
 * The seam Phase 5 rests on, now that it is a seam over the network.
 *
 * Every fixture goes through the parser a real response goes through, so this suite is the thing
 * that fails when the SPA and the API disagree about a shape — instead of a screen rendering
 * something wrong, or an API returning something nobody notices is missing a field.
 */
describe('every endpoint parses what it answers with', () => {
  it('the campaign, with an area appearing once', async () => {
    const campaign = await gateway.getCampaign(gateway.PLAYER_ID);
    expect(campaign.areas).toHaveLength(8);
  });

  /**
   * `area-0.yml` and `area-2.yml` carry a title and no `weeks` or `blurb`, so `AreaIdentity`
   * cannot be built for them and the API sends none. The map with two unlabelled areas is the
   * honest one — and an earlier fixture invented blurbs for both, which is exactly the mistake
   * the `AREA_NAMES` table was removed for.
   */
  it('leaves areas 0 and 2 without an identity, because their manifests have none', async () => {
    const campaign = await gateway.getCampaign(gateway.PLAYER_ID);
    const identified = campaign.areas.filter((a) => a.identity !== undefined).map((a) => a.area);

    expect(identified).toEqual([1, 3, 4, 5, 6, 7]);
  });

  it('an area, with its quests', async () => {
    const area = await gateway.getArea(gateway.PLAYER_ID, 3);
    expect(area.identity?.title).toBe('Collections');
    expect(area.quests).toHaveLength(5);
  });

  it('an area nobody authored, which exists and is empty', async () => {
    const area = await gateway.getArea(gateway.PLAYER_ID, 5);
    expect(area.quests).toEqual([]);
  });

  it('a quest, with a slot for every medal and what each would pay', async () => {
    const quest = await gateway.getQuest(gateway.PLAYER_ID, 'a3-recipe-book');

    expect(quest.title).toBe('The Recipe Book');
    expect(quest.medalSlots).toHaveLength(5);
    // §5.10: zero is legal and reads as a brag.
    expect(quest.medalSlots.some((slot) => slot.xp === 0)).toBe(true);
    expect(quest.starter).toContain('turtle.forward');
  });

  it('the Defend queue, under the §5.4 cap and one entry per concept', async () => {
    const due = await gateway.getDefend(gateway.PLAYER_ID);
    expect(due.length).toBeLessThanOrEqual(5);
    expect(new Set(due.map((d) => d.conceptId)).size).toBe(due.length);
  });

  /**
   * The endpoint exists and answers `[]`, because no engine function computes it — the plan that
   * built the route declined to write one, on the grounds that an API summing medals is doing
   * the engine's job. Empty is the truth, and the Party screen says so out loud.
   */
  it('the party board, whose XP provenance is honestly empty', async () => {
    const party = await gateway.getParty(gateway.PLAYER_ID);

    expect(party.standings).toHaveLength(2);
    expect(party.xpSources).toEqual([]);
  });

  it('the syllabus, which is content and carries no player state', async () => {
    const tome = await gateway.getTome();
    expect(tome.areas.length).toBeGreaterThan(0);
    expect(tome.areas[0]).not.toHaveProperty('unlocked');
  });
});

describe('a payload that breaks a rule never reaches a screen', () => {
  it('rejects an area that appears twice', async () => {
    // Correctly shaped and still wrong: a duplicate card means two states for one area.
    const { CampaignViewSchema } = await import('@pyquest/contract');
    const twice = {
      playerId: 'peer',
      areas: [
        { area: 3, progress: { cleared: 1, total: 5, estimated: true }, boss: { cleared: 1, required: 3, unlocked: false } },
        { area: 3, progress: { cleared: 2, total: 5, estimated: true }, boss: { cleared: 2, required: 3, unlocked: false } },
      ],
    };

    expect(() => CampaignViewSchema.parse(twice)).toThrow(/appears once/);
  });

  it('rejects a boss whose unlocked flag disagrees with its counts', async () => {
    const { CampaignViewSchema } = await import('@pyquest/contract');
    const lying = {
      playerId: 'peer',
      areas: [{ area: 3, progress: { cleared: 0, total: 5, estimated: true }, boss: { cleared: 0, required: 3, unlocked: true } }],
    };

    expect(() => CampaignViewSchema.parse(lying)).toThrow();
  });
});
