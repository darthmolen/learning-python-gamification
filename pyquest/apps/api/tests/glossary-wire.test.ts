/**
 * The definitions, on the wire.
 *
 * The glossary defines all 95 concepts and, until this, the only way to read one was to open the
 * repository. Two shapes carry them out: `TomeArea.concepts` for the syllabus, and
 * `QuestView.concepts` for the chips on a quest.
 *
 * **Both, and that is the point of the suite.** `QuestView.concepts` was bare id strings while
 * the Tome's was `{ id, label }`, so a `definition` added to the Tome's shape would have reached
 * the Tome and silently nothing else — the Quest screen would have kept rendering ids and no test
 * would have said so. One shape now, asserted on both routes.
 *
 * No database. These are pure functions of a content root, and every failure worth catching here
 * is reachable without seeding a player.
 */

import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, describe, expect, it } from 'vitest';
import { ConceptViewSchema, MedalsSchema, QuestViewSchema, TomeSchema } from '@pyquest/contract';
import { loadContentRoot } from '../src/content.ts';
import { medalsView, questView, tomeAreas } from '../src/views.ts';

const ROOT = fileURLToPath(new URL('../../../..', import.meta.url));
const CONTENT = loadContentRoot(ROOT);

/** A player who has done nothing. The concept join does not consult progress, and this proves it. */
const NOBODY = {
  playerId: '11111111-1111-1111-1111-111111111111',
  questMedals: [],
  xpAwarded: [],
  invasions: [],
  journal: [],
} as unknown as Parameters<typeof questView>[2];

describe('the Tome carries definitions', () => {
  const areas = tomeAreas(CONTENT);

  it('parses as a Tome', () => {
    expect(() => TomeSchema.parse({ areas })).not.toThrow();
  });

  it('defines every concept it lists, because every area has a glossary today', () => {
    // Scoped to what is authored. The moment an area ships without a glossary this assertion is
    // the one that has to change, and changing it is a decision rather than an accident.
    for (const area of areas) {
      const undefined_ = area.concepts.filter((c) => c.definition === undefined).map((c) => c.id);
      expect(undefined_, `area ${area.area} lists concepts it does not define`).toEqual([]);
    }
  });

  it('serves the glossary text itself, not a placeholder', () => {
    const all = areas.flatMap((a) => a.concepts);
    const variable = all.find((c) => c.id === 'variables');
    expect(variable?.definition, 'no definition for `variables`').toBeTruthy();
    // Long enough to be prose. A join that shipped the label, or the id, would satisfy every
    // assertion above this one and none of them would have noticed.
    expect(variable?.definition?.length).toBeGreaterThan(40);
  });
});

describe('a quest carries its concepts labelled and defined', () => {
  const item = CONTENT.item('a0-name-tag');

  it('is reading a real quest, or everything below is vacuous', () => {
    expect(item, 'a0-name-tag is gone from the content root').toBeDefined();
  });

  const view = questView(CONTENT, item as NonNullable<typeof item>, NOBODY);

  it('parses as a QuestView', () => {
    expect(() => QuestViewSchema.parse(view)).not.toThrow();
  });

  it('carries a label and a definition per concept, not a bare id', () => {
    expect(view.concepts.length).toBeGreaterThan(0);
    for (const concept of view.concepts) {
      expect(typeof concept, `concept is still a bare id: ${String(concept)}`).toBe('object');
      expect(concept.label, `${concept.id} has no label`).toBeTruthy();
      expect(concept.definition, `${concept.id} has no definition`).toBeTruthy();
    }
  });

  it('agrees with the Tome about the same concept', () => {
    /**
     * The join is done twice — once per route — and two joins are two chances to differ. A quest
     * that showed one definition while the syllabus showed another would be the exact failure the
     * shared shape was introduced to prevent, and nothing else here would notice.
     */
    const fromTome = new Map(
      tomeAreas(CONTENT).flatMap((a) => a.concepts.map((c) => [c.id, c.definition] as const)),
    );
    for (const concept of view.concepts) {
      expect(concept.definition, `${concept.id} differs between the quest and the Tome`).toBe(
        fromTome.get(concept.id),
      );
    }
  });
});

describe('the shapes still refuse what they always refused', () => {
  it('rejects an unknown key on a concept', () => {
    // `.strict()` is the enforcement §6.7 relies on: progress may not arrive dressed as content.
    expect(() =>
      ConceptViewSchema.parse({ id: 'variable', label: 'Variable', unlocked: true }),
    ).toThrow();
  });

  it('rejects an empty definition rather than carrying a blank one', () => {
    // Absent means unwritten and the screen says so. Present-but-empty is a lie with no reader.
    expect(() => ConceptViewSchema.parse({ id: 'variable', label: 'Variable', definition: '' })).toThrow();
  });
});

describe('the medals route', () => {
  it('describes every medal from game/medals.md', () => {
    const medals = medalsView(CONTENT);
    expect(() => MedalsSchema.parse({ medals })).not.toThrow();
    expect(medals.map((m) => m.medal)).toContain('cleared');
    expect(medals.find((m) => m.medal === 'cleared')?.description?.length).toBeGreaterThan(40);
  });

  it('answers with an empty list when game/ is absent, rather than failing', () => {
    /**
     * The Lane A/Lane B rule, on the API's side of it. "Deleting `game/` must leave a curriculum
     * that still validates and still publishes" — and a route that threw here would make the SPA
     * a second thing that stops working, which is the dependency the split exists to forbid.
     */
    const bare = join(ROOT, 'pyquest', 'apps', 'api', 'dist-no-game-fixture');
    rmSync(bare, { recursive: true, force: true });
    mkdirSync(join(bare, 'curriculum', 'area-0'), { recursive: true });
    writeFileSync(
      join(bare, 'curriculum', 'area-0', 'area.yml'),
      ['area: 0', 'title: Nowhere', 'authoring: complete', ''].join('\n'),
      'utf8',
    );

    expect(medalsView(loadContentRoot(bare))).toEqual([]);
  });

  afterAll(() => {
    rmSync(join(ROOT, 'pyquest', 'apps', 'api', 'dist-no-game-fixture'), {
      recursive: true,
      force: true,
    });
  });
});
