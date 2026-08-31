/**
 * The file half and the wire half, checked against each other.
 *
 * Every other test in this package parses an object literal written beside the schema, which
 * only ever proves that the literal agrees with whatever its author believed. This suite reads
 * the actual `curriculum/area-<n>/area.yml` through `@pyquest/content`'s own reader — the one
 * `validate:content` runs — and asserts the result satisfies the contract. It is the only place
 * the two halves meet, so it is the only test that can catch them drifting apart.
 *
 * It is also the automated form of the plan's acceptance test: edit an area's title in YAML and
 * the new title reaches the wire shape with no TypeScript touched. Nothing here hardcodes a
 * title, which is what makes that true rather than asserted.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  checkContent,
  contentRootsFrom,
  parseAreaManifest,
  type AreaManifest,
} from '@pyquest/content';
import { AreaIdentitiesSchema, AreaIdentitySchema } from '@pyquest/contract';

const CONTENT_ROOT = fileURLToPath(new URL('../../../..', import.meta.url));

/**
 * Areas whose manifest carries its week range and blurb as of this suite.
 *
 * Named rather than derived. A derived list — "every manifest that happens to have weeks" —
 * passes just as happily when a manifest loses them, which is precisely the mutant this file
 * exists to catch.
 */
const AUTHORED = [1, 3, 4, 5, 6, 7] as const;

/**
 * Areas whose weeks and blurb are deferred into the tracks that hold those files:
 * `feature_area-0-quest-backfill` and `feature_area-2-scribes-rite-and-sandbox`. Written as a
 * ceiling rather than an expectation — these two may land their fields at any time and this
 * suite must not fail when they do, but a ninth weekless manifest is a mistake.
 */
const DEFERRED: readonly number[] = [0, 2];

/**
 * File vocabulary to wire vocabulary, done here because the contract holds schemas and no
 * logic. `authoring` and `estimatedQuests` are deliberately dropped: `AreaProgressSchema`
 * already carries that fact as `estimated`.
 */
const toIdentity = (manifest: AreaManifest): unknown => ({
  area: manifest.area,
  title: manifest.title,
  weeks: manifest.weeks,
  blurb: manifest.blurb,
});

/** The `title:` line as it is written in the file, read without the content package's parser. */
function titleInFile(area: number): string {
  const text = readFileSync(`${CONTENT_ROOT}/curriculum/area-${area}/area.yml`, 'utf8');
  const match = /^title:[ \t]*(.+?)[ \t]*$/m.exec(text);
  if (match === null) throw new Error(`areas/area-${area}.yml has no title line`);
  return match[1]!.replace(/^["'](.*)["']$/, '$1');
}

const content = checkContent(contentRootsFrom(CONTENT_ROOT));
const manifests = new Map<number, AreaManifest>(content.manifests.map((m) => [m.area, m]));

describe('the content root, as validate:content reads it', () => {
  it('has no issues', () => {
    expect(content.issues).toEqual([]);
  });

  it('has a manifest for every area 0–7', () => {
    expect([...manifests.keys()].sort()).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
  });

  it('re-parses each manifest through the file schema unchanged', () => {
    for (const manifest of manifests.values()) {
      expect(parseAreaManifest(manifest)).toEqual(manifest);
    }
  });

  it('leaves no manifest weekless but the two whose tracks own them', () => {
    const weekless = [...manifests.values()].filter((m) => m.weeks === undefined).map((m) => m.area);
    expect(weekless.every((area) => DEFERRED.includes(area))).toBe(true);
  });
});

describe.each(AUTHORED)('area %i — from the file to the wire', (area) => {
  it('carries a week range and a blurb in the file', () => {
    const manifest = manifests.get(area);
    expect(manifest?.weeks).toBeDefined();
    expect(manifest?.blurb).toBeDefined();
  });

  it('maps to a valid identity', () => {
    expect(() => AreaIdentitySchema.parse(toIdentity(manifests.get(area)!))).not.toThrow();
  });

  it('puts the title written in the YAML on the wire, with no TypeScript in between', () => {
    // The plan's acceptance test. Edit the title in the file and this follows it; nothing here
    // knows what any area is called.
    const identity = AreaIdentitySchema.parse(toIdentity(manifests.get(area)!));
    expect(identity.title).toBe(titleInFile(area));
  });

  it('puts the week range on the wire as the two integers the file holds', () => {
    const identity = AreaIdentitySchema.parse(toIdentity(manifests.get(area)!));
    expect(identity.weeks).toEqual(manifests.get(area)!.weeks);
    expect(Number.isInteger(identity.weeks.from)).toBe(true);
  });
});

describe('the Map, built from the files', () => {
  it('forms a valid collection', () => {
    const identities = AUTHORED.map((area) => toIdentity(manifests.get(area)!));
    expect(AreaIdentitiesSchema.parse(identities)).toHaveLength(AUTHORED.length);
  });

  it('accepts the real curriculum, whose week ranges overlap', () => {
    // Area 1 ends in week 6 and Area 2 begins in it. A "ranges must not overlap" refinement
    // would reject the content on disk, which is why ADR 0002 forbids one.
    const identities = AreaIdentitiesSchema.parse(AUTHORED.map((a) => toIdentity(manifests.get(a)!)));
    const spans = identities.map((i) => `${i.weeks.from}-${i.weeks.to}`);
    expect(spans.length).toBe(new Set(spans).size);
  });

  it('resolves the horizon to the spec\'s 48 weeks', () => {
    // ADR 0002 derives `week 10 of 48` from max(area.weeks.to) so a re-pace stays honest.
    const ends = AUTHORED.map((area) => manifests.get(area)!.weeks!.to);
    expect(Math.max(...ends)).toBe(48);
  });
});

describe('the file schema does not reach the wire', () => {
  it('is not imported by payloads.ts', () => {
    // Asserted, not intended. The next person to see two similar schemas will try to merge
    // them; the header comment argues against it and this is what stops it.
    const source = readFileSync(fileURLToPath(new URL('../src/payloads.ts', import.meta.url)), 'utf8');
    const imports = (source.match(/^import .*$/gm) ?? []).join('\n');
    expect(imports).not.toMatch(/AreaManifestSchema/);
    expect(imports).toMatch(/AreaSchema/); // the guard reads the imports it claims to read
  });
});
