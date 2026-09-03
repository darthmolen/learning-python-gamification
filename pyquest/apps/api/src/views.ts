/**
 * Content and progress, assembled into the shapes `endpoints.ts` declares.
 *
 * Everything here is a projection. **The engine decides and this arranges**: `availableQuests`,
 * `areaProgress`, `bossState`, `dueInvasions`, `standings`, `effectiveDC` and `medalDelta` are
 * all called, never reimplemented, and there is no arithmetic below that produces a number a
 * screen shows. An api that re-derived an effective DC would have crossed §6.7, and the reason
 * that matters is not tidiness: the engine is the one component that must never be wrong, and it
 * is only trivially testable while it is the only component doing the sums.
 *
 * The one thing this file adds is the §6.3 narrowing. A `ContentItem` carries the path to its
 * hidden tests; a `QuestView` must not, so `publicVerifier` drops it explicitly rather than
 * spreading the object and hoping `.strict()` catches the rest.
 */

import { medalsFor, type Area, type ContentItem, type Medal, type Verifier } from '@pyquest/content';
import {
  type AreaCard,
  type AreaView,
  type CampaignView,
  type MedalSlot,
  type PlayerProgress,
  type PublicVerifier,
  type QuestView,
  type TomeArea,
  type TomeConcept,
} from '@pyquest/contract';
import {
  IllegalModifierSetError,
  areaProgress,
  availableQuests,
  bossState,
  effectiveDC,
  medalDelta,
} from '@pyquest/engine';
import { CONCEPTS } from '@pyquest/content';
import { pricedKind, type ContentRoot } from './content.ts';

/**
 * The half of a verifier a client may see (§6.3).
 *
 * Written as a switch rather than a delete, because a delete is a list of what to remove and this
 * is a list of what to keep. A fifth verifier added to content arrives here as a type error
 * instead of as a leak.
 */
export function publicVerifier(verifier: Verifier): PublicVerifier {
  switch (verifier.type) {
    case 'hidden-tests':
      return { type: 'hidden-tests' };
    case 'local-repo':
      return { type: 'local-repo' };
    case 'peer-signoff':
      return { type: 'peer-signoff', by: verifier.by };
    case 'git-signal':
      return { type: 'git-signal', signal: verifier.signal };
  }
}

/**
 * Medals held on one quest.
 *
 * Returned as `Medal[]` and handed to the engine unchanged: every medal is a difficulty modifier
 * (§5.1's table prices all six), so no cast is needed in that direction and none is written. The
 * two modifiers that are *not* medals — a Datamine, a challenge run — would come from elsewhere,
 * and the day they do they arrive as a second argument rather than by widening this one.
 */
function heldOn(progress: PlayerProgress, questId: string): Medal[] {
  return progress.questMedals.filter((row) => row.questId === questId).map((row) => row.medal);
}

/**
 * What each unearned medal slot would cost and pay, per §5.10.
 *
 * A slot whose combination §5.12 forbids is omitted rather than priced at zero. The engine throws
 * `IllegalModifierSetError` for Conjured beside Ironman; a zero would render as "take it, it pays
 * nothing", which is a different and false statement about a move that is not available at all.
 *
 * **A slot that would pay a negative is omitted for the same reason, and that one reached a
 * browser.** Conjured is −5 DC, so on `a0-name-tag` — DC 5, the lowest in the campaign — a player
 * holding Cleared and Idiomatic is already priced at DC 8 and paid 16. Adding Conjured puts the
 * effective DC at 3, `effectiveDC` clamps that up to the floor of 5, and the total falls to 10.
 * §5.10 says a medal "pays the difference", and the difference is −6.
 *
 * `MedalSlotSchema.xp` is a non-negative `CountSchema`, so the view did not render wrongly — it
 * threw, and `GET /quests/a0-name-tag` answered 500. Both players `seedHousehold` writes hold
 * that pair, so a quest in the first area was unreachable for the whole household.
 *
 * Dropping it is the honest answer rather than flooring it at zero: §5.10 reads a zero as a brag,
 * a medal earned for depth nothing required, and this is the opposite — an offer that cannot be
 * taken, because XP already awarded is never clawed back (`progress.ts` on `xpAwarded`: "re-pricing
 * history reports a figure the player was never paid"). The Quest screen already says what an
 * absent slot means, and for this case it says the true thing: "not with a medal you hold."
 *
 * Whether Conjured should be *offerable* after Cleared at all is a spec question — you cannot
 * retroactively have had help — and it is recorded in
 * `planning/backlog/feature_no-way-to-claim-a-medal_2026-09-02.md` rather than decided here.
 */
export function medalSlots(item: ContentItem, held: readonly Medal[]): MedalSlot[] {
  const slots: MedalSlot[] = [];
  // The kind, not the quest rate. This is the *displayed* price of every unearned slot, so
  // before it was passed a boss screen quoted a tenth of the real number to the player deciding
  // whether to attempt it — the bug cost a wrong payout on award and a wrong promise before it.
  const kind = pricedKind(item);
  for (const medal of medalsFor(item)) {
    if (held.includes(medal)) continue;
    try {
      const xp = medalDelta(kind, item.dc, held, medal);
      // Not an offer. See the note above: a medal that would pay less than he has already been
      // given is not a move he can make, and pricing it at zero would say it was.
      if (xp < 0) continue;

      slots.push({ medal, effectiveDC: effectiveDC(item.dc, [...held, medal]), xp });
    } catch (error) {
      if (error instanceof IllegalModifierSetError) continue;
      throw error;
    }
  }
  return slots;
}

export function questView(
  content: ContentRoot,
  item: ContentItem,
  progress: PlayerProgress,
): QuestView {
  const held = heldOn(progress, item.id);
  const cleared = held.includes('cleared');
  const status = cleared
    ? 'cleared'
    : item.requires.every((id) =>
          progress.questMedals.some((row) => row.questId === id && row.medal === 'cleared'),
        )
      ? 'available'
      : 'locked';

  const starter =
    item.verifier.type === 'hidden-tests' ? content.read(item.verifier.starter) : undefined;

  return {
    id: item.id,
    title: item.title,
    kind: item.kind,
    area: item.area,
    dc: item.dc,
    concepts: [...item.concepts],
    requires: [...item.requires],
    status,
    brief: content.read(item.brief),
    medalsHeld: held,
    medalSlots: medalSlots(item, held),
    verifier: publicVerifier(item.verifier),
    ...(starter === undefined ? {} : { starter }),
    ...(item.themes === undefined ? {} : { themes: [...item.themes] }),
  };
}

/**
 * One area's card.
 *
 * `identity` is present only when the manifest carries `weeks` and `blurb`. Two of the eight
 * still do not — `area-0.yml` and `area-2.yml` — and `payloads.ts` already ruled on what happens
 * then: an area without them has no identity to send. Inventing a blurb here would be the api
 * authoring content, and refusing to draw the map would be worse than drawing it unlabelled.
 */
export function areaCard(
  content: ContentRoot,
  progress: PlayerProgress,
  area: Area,
): AreaCard | undefined {
  const manifest = content.manifest(area);
  if (manifest === undefined) return undefined;

  const identity =
    manifest.weeks !== undefined && manifest.blurb !== undefined
      ? { area, title: manifest.title, weeks: manifest.weeks, blurb: manifest.blurb }
      : undefined;

  return {
    area,
    ...(identity === undefined ? {} : { identity }),
    progress: areaProgress(content.items, manifest, progress, area),
    boss: bossState(content.items, progress, area),
  };
}

export function campaignView(content: ContentRoot, progress: PlayerProgress): CampaignView {
  const areas = content.manifests
    .map((manifest) => areaCard(content, progress, manifest.area))
    .filter((card): card is AreaCard => card !== undefined)
    .sort((a, b) => a.area - b.area);

  return { playerId: progress.playerId, areas };
}

export function areaView(
  content: ContentRoot,
  progress: PlayerProgress,
  area: Area,
): AreaView | undefined {
  const card = areaCard(content, progress, area);
  if (card === undefined) return undefined;
  return { ...card, playerId: progress.playerId, quests: availableQuests(content.items, progress, area) };
}

/**
 * An area's lesson, and whether it is a draft.
 *
 * `lesson.md` wins over `lesson.draft.md`, which is the precedence `apps/field-manual/src/build.ts`
 * already states: "promoting a lesson is a rename." Mirroring it rather than inventing a second
 * rule is the point — the two publishers of the same prose must not disagree about which file is
 * the real one.
 *
 * An area with neither returns nothing at all, and the screen says the teaching is unwritten.
 * That is `build.ts`'s rule as well: "an area with neither is an area whose teaching is unwritten,
 * and the page says so rather than pretending."
 */
function areaLesson(content: ContentRoot, area: Area): { lesson?: string; lessonIsDraft: boolean } {
  const finished = `area-${area}/lesson.md`;
  if (content.exists(finished)) return { lesson: content.read(finished), lessonIsDraft: false };

  const draft = `area-${area}/lesson.draft.md`;
  if (content.exists(draft)) return { lesson: content.read(draft), lessonIsDraft: true };

  return { lessonIsDraft: false };
}

/**
 * The Tome: concepts by area, and the lesson that teaches them.
 *
 * Not player-scoped and carrying no unlocked state. The syllabus is content and content is the
 * same for everyone (§6.7); the SPA holds the player's areas from `/campaign` and derives what is
 * open from the two, which is a presentation decision and therefore the UI's.
 *
 * The lesson is content by the same test, which is why it belongs here rather than on a
 * player-scoped route: every player reads the same page, and §6.8's promise that "every page is
 * open from day one" is only true if nothing about the reader is consulted to serve it.
 */
export function tomeAreas(content: ContentRoot): TomeArea[] {
  const byArea = new Map<Area, TomeConcept[]>();
  for (const concept of CONCEPTS) {
    const listed = byArea.get(concept.area) ?? [];
    listed.push({ id: concept.id, label: concept.label });
    byArea.set(concept.area, listed);
  }
  return [...byArea.entries()]
    .map(([area, concepts]) => ({ area, concepts, ...areaLesson(content, area) }))
    .sort((a, b) => a.area - b.area);
}
