/**
 * What the quest screen is offered, and what it must never be offered.
 *
 * `medalSlots` prices every medal the player does not yet hold. Two of those prices are not
 * offers at all, and the difference between them matters:
 *
 * * §5.12 forbids Conjured beside Ironman, and the engine says so by throwing. That slot is
 *   dropped.
 * * A slot can also price *negative*, which nothing had noticed. `MedalSlotSchema.xp` is a
 *   non-negative `CountSchema`, so the parse threw and the route answered 500 — the quest screen
 *   would not load at all for a player holding the wrong pair of medals.
 *
 * No database here on purpose. This is a pure function of a content item and a medal list, and
 * the bug that reached a browser is reachable without seeding anything.
 */

import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { MedalSlotSchema } from '@pyquest/contract';
import type { Medal } from '@pyquest/content';
import { loadContentRoot } from '../src/content.ts';
import { medalSlots } from '../src/views.ts';

const CONTENT = loadContentRoot(fileURLToPath(new URL('../../../..', import.meta.url)));

/** DC 5, the lowest in the campaign — which is what makes the clamp bite. */
const NAME_TAG = CONTENT.item('a0-name-tag');

describe('the medal slots a quest offers', () => {
  it('is reading a real quest, or every assertion below is vacuous', () => {
    expect(NAME_TAG?.dc).toBe(5);
  });

  /**
   * The 500 the household actually hit, on `a0-name-tag` with `cleared` and `idiomatic` held —
   * which is what `seedHousehold` writes, so both seeded players had an unreachable quest.
   *
   * Conjured is −5 DC. Held, the quest already prices at DC 8 and has paid 16; adding Conjured
   * puts the effective DC at 3, the engine clamps that up to the floor of 5, and the total falls
   * to 10. The difference is −6, and §5.10's "pays the difference" has no answer for a medal
   * that would pay a player *less* than he has already been given.
   */
  it('offers nothing that would pay a negative, which used to crash the route', () => {
    const held: Medal[] = ['cleared', 'idiomatic'];
    const offered = medalSlots(NAME_TAG!, held);

    for (const slot of offered) {
      expect(() => MedalSlotSchema.parse(slot)).not.toThrow();
    }
    expect(offered.map((slot) => slot.medal)).not.toContain('conjured');
  });

  /**
   * The rule is "no negative", not "no Conjured". On a quest with room above the DC floor,
   * Conjured is a real offer and has to survive — a fix that dropped it everywhere would take
   * away a legal §5.12 move to silence one arithmetic edge.
   */
  it('still offers Conjured where it genuinely pays something', () => {
    const typeLab = CONTENT.item('a0-the-type-lab');
    expect(typeLab?.dc).toBe(12);

    const offered = medalSlots(typeLab!, []);
    const conjured = offered.find((slot) => slot.medal === 'conjured');
    expect(conjured?.xp).toBeGreaterThan(0);
  });

  /** §5.12's own rule, already kept, pinned here beside the one it is easily confused with. */
  it('drops Conjured beside Ironman, which is illegal rather than merely unprofitable', () => {
    const offered = medalSlots(NAME_TAG!, ['ironman']);
    expect(offered.map((slot) => slot.medal)).not.toContain('conjured');
  });
});
