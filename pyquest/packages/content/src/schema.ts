/**
 * The content contract.
 *
 * Spec §6.2: a drill, a quest, and a boss are the same object; only the verifier differs.
 * Adding content means editing a file, and §6.10 requires every YAML file to be validated on
 * load. This module is that validation — the single definition of what a piece of content may
 * say, shared by the validator, the authoring scaffolder, the engine, and the API.
 *
 * Spec §6.7 draws the hard line this file sits on: content lives in git, progress lives in
 * Postgres, and the two never mix. Nothing here describes a player.
 */

import { z } from 'zod';
import { CONCEPT_IDS } from './concepts.ts';
import { splitFrontmatter } from './frontmatter.ts';

/* -------------------------------------------------------------------------------------------
 * Difficulty
 * ----------------------------------------------------------------------------------------- */

/**
 * Spec §5.1 — the familiar D&D 5–30 scale. The author sets this one number and the engine
 * computes XP and the risk label from it. There is deliberately no separate risk flag: a
 * boolean stored beside the number that implies it can only ever disagree with it.
 */
export const MIN_DC = 5;
export const MAX_DC = 30;

export const DifficultyClassSchema = z
  .number()
  .int('Difficulty Class must be a whole number')
  .min(MIN_DC, `Difficulty Class must be at least ${MIN_DC} (spec §5.1, the 5–30 scale)`)
  .max(MAX_DC, `Difficulty Class must be at most ${MAX_DC} (spec §5.1, the 5–30 scale)`);

/* -------------------------------------------------------------------------------------------
 * Medals
 * ----------------------------------------------------------------------------------------- */

/**
 * Spec §5.10. Every quest carries medal slots, earned independently and on replay. Only
 * `cleared` unlocks anything; the rest are elective depth, which is what keeps autonomy intact.
 *
 * `time-attack` is on the roadmap rather than implemented, so it is a legal name that quests
 * may not yet offer — see `DEFAULT_MEDALS`.
 */
export const MEDALS = [
  'cleared',
  'ironman',
  'idiomatic',
  'teach-back',
  'conjured',
  'time-attack',
] as const;

export type Medal = (typeof MEDALS)[number];

export const MedalSchema = z.enum(MEDALS);

/** The medal slots a quest offers unless it says otherwise. `time-attack` is roadmap (§5.10). */
export const DEFAULT_MEDALS: readonly Medal[] = [
  'cleared',
  'ironman',
  'idiomatic',
  'teach-back',
  'conjured',
];

/* -------------------------------------------------------------------------------------------
 * Audience — who a curriculum document is written for
 * ----------------------------------------------------------------------------------------- */

/**
 * Who reads this file.
 *
 * `curriculum/README.md` has stated the split in prose since Area 0 — a three-row table of
 * audience, files and voice — and prose is what it stayed. The convention failed in the one
 * place it mattered most: `area-<n>/practices/README.md` tells the learner *"Copy this whole
 * directory somewhere you own"*, and `practices/` holds the DM's plans beside the learner's
 * drills, including the practice built on the learner not knowing what is coming.
 *
 * Directory-as-audience failed because the two audiences share a directory. Nothing caught it,
 * because there was no field to check.
 *
 * **`dm` is what an unmarked file means** — see `AUDIENCE_WHEN_UNMARKED`. The default has to fail
 * closed: the consumer that matters most is the thing that copies files onto a learner's machine,
 * and a marking mistake there ships the answer key.
 */
export const AUDIENCES = ['learner', 'dm'] as const;

export type Audience = (typeof AUDIENCES)[number];

export const AudienceSchema = z.enum(AUDIENCES);

/**
 * What an undeclared audience means.
 *
 * A constant in code rather than a zod `.default()`, following `medalsFor` below: a zod default
 * rewrites the parsed value, so a reader of the result cannot tell an author's decision from a
 * schema's guess. Here that distinction is the whole point — the validator's job is to say which
 * files have not decided yet, and it cannot if parsing has already decided for them.
 */
export const AUDIENCE_WHEN_UNMARKED: Audience = 'dm';

/**
 * Who a document says it is for, from its own frontmatter.
 *
 * Unmarked and unrecognised both answer `dm`, which is the fail-closed direction: the consumers
 * are a static-site builder and a packer that copies files onto a learner's machine, and the
 * expensive mistake in both is handing over the answer key. `validate:content` reports either
 * case as an `audience` issue, so a file lands here wrong only while somebody is mid-edit.
 */
export function audienceOf(text: string): Audience {
  const { fields, present } = splitFrontmatter(text);
  const declared = present ? fields.get('audience') : undefined;
  return declared !== undefined && (AUDIENCES as readonly string[]).includes(declared)
    ? (declared as Audience)
    : AUDIENCE_WHEN_UNMARKED;
}

/* -------------------------------------------------------------------------------------------
 * Verifiers — spec §6.3
 * ----------------------------------------------------------------------------------------- */

/**
 * A repository-relative path. Content may not reach outside the content root: an absolute path
 * or a `..` segment in a YAML file is an authoring mistake, and on a machine that runs
 * untrusted submissions it is worth refusing rather than normalising.
 */
const RelativePathSchema = z
  .string()
  .min(1)
  .refine((p) => !p.startsWith('/') && !/^[A-Za-z]:/.test(p), {
    message: 'must be a relative path, not absolute',
  })
  .refine((p) => !p.split(/[\\/]/).includes('..'), {
    message: 'must not contain a ".." segment',
  });

/**
 * Submit posts the code to the API, which runs tests the client never sees. Spec §6.3: anything
 * shipped to the browser is readable, so hidden tests shipped to the client are not hidden.
 * Used by the Area 0–1 drills.
 */
const HiddenTestsVerifierSchema = z.object({
  type: z.literal('hidden-tests'),
  starter: RelativePathSchema,
  tests: RelativePathSchema,
});

/**
 * The API pulls his repository and runs the quest's pytest specification (§6.4). Area 2b
 * onward, once his code reaches the server the only way code travels between machines.
 */
const LocalRepoVerifierSchema = z.object({
  type: z.literal('local-repo'),
  tests: RelativePathSchema,
  /** Subdirectory of his repository this quest's project lives in, if not the root. */
  path: RelativePathSchema.optional(),
});

/**
 * Somebody other than the submitter presses the button. Spec §6.3 names them by a `by` field,
 * and §5.11 is the reason it is `peer-signoff` rather than `parent-signoff`: sign-off runs both
 * directions, so the son signing off the parent's teach-back is the same mechanism, not a
 * special case.
 *
 * `by` names a ROLE, never a person. `peer` is any other player in the party; `dm` is whoever
 * holds the DM seat. In Kitchen Table mode one adult holds both roles, which makes that setup a
 * configuration rather than a special case — and keeps a classroom, a second sibling, or a
 * teacher standing in as DM from being a schema change later.
 */
const PeerSignoffVerifierSchema = z.object({
  type: z.literal('peer-signoff'),
  by: z.enum(['peer', 'dm']),
});

/** Reads his git log for commits and streaks (§6.3). Journal and streaks. */
const GitSignalVerifierSchema = z.object({
  type: z.literal('git-signal'),
  signal: z.enum(['commit', 'push', 'journal-entry', 'tag']),
});

export const VerifierSchema = z.discriminatedUnion('type', [
  HiddenTestsVerifierSchema,
  LocalRepoVerifierSchema,
  PeerSignoffVerifierSchema,
  GitSignalVerifierSchema,
]);

export type Verifier = z.infer<typeof VerifierSchema>;

/* -------------------------------------------------------------------------------------------
 * Content items
 * ----------------------------------------------------------------------------------------- */

export const AREAS = [0, 1, 2, 3, 4, 5, 6, 7] as const;
export const AreaSchema = z.union([
  z.literal(0),
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(5),
  z.literal(6),
  z.literal(7),
]);
export type Area = z.infer<typeof AreaSchema>;

export const KindSchema = z.enum(['quest', 'invasion', 'boss']);
export type Kind = z.infer<typeof KindSchema>;

/** Stable content id, e.g. `a3-recipe-book`. Referenced by `requires` and by progress rows. */
const IdSchema = z
  .string()
  .regex(
    /^[a-z0-9]+(-[a-z0-9]+)*$/,
    'must be lower-case kebab-case, e.g. "a3-recipe-book"',
  );

/**
 * A concept tag drawn from the registry in `concepts.ts`. Spec §6.10 requires the validator to
 * prove every tag is known; catching it here means an unknown tag cannot survive a parse, let
 * alone reach the spaced-repetition scheduler that reads these ids (§5.4).
 */
const ConceptTagSchema = IdSchema.refine((id) => CONCEPT_IDS.has(id), {
  message: 'is not a known concept tag — see packages/content/src/concepts.ts',
});

export const ContentItemSchema = z
  .object({
    id: IdSchema,
    title: z.string().min(1),
    kind: KindSchema,
    area: AreaSchema,

    /** Non-empty: a quest that teaches nothing cannot be scheduled for review (§5.4). */
    concepts: z.array(ConceptTagSchema).min(1, 'needs at least one concept tag'),

    /** Prerequisite content ids. The validator proves this graph is acyclic (§6.10). */
    requires: z.array(IdSchema).default([]),

    dc: DifficultyClassSchema,

    /** Markdown brief, relative to the content root. */
    brief: RelativePathSchema,

    verifier: VerifierSchema,

    /**
     * Spec §5.2 — each boss offers two or three theme framings and the player chooses.
     * Required on a boss, meaningless elsewhere; enforced below.
     */
    themes: z.array(z.string().min(1)).min(2).max(3).optional(),

    /**
     * Spec §5.10 — the medal slots this item offers. Unearned slots render greyed, borrowing
     * the visible-but-locked psychology of the skill tree.
     */
    medals: z.array(MedalSchema).optional(),

    /**
     * Spec §6.2 — canned AI transcripts authored by the parent, used by the Scrollcraft arc.
     * Transcripts are content like any brief, so they are versioned in git and validated on
     * load.
     */
    transcripts: z.array(RelativePathSchema).optional(),
  })
  .strict()
  .superRefine((item, ctx) => {
    if (item.kind === 'boss' && item.themes === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['themes'],
        message: 'a boss must offer two or three theme framings (spec §5.2)',
      });
    }
    if (item.kind !== 'boss' && item.themes !== undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['themes'],
        message: 'only a boss carries theme framings (spec §5.2)',
      });
    }
    if (item.medals && !item.medals.includes('cleared')) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['medals'],
        message: 'must include "cleared" — it is the only medal progression reads (spec §5.10)',
      });
    }
    if (item.requires.includes(item.id)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['requires'],
        message: 'an item cannot require itself',
      });
    }
  });

export type ContentItem = z.infer<typeof ContentItemSchema>;

/* -------------------------------------------------------------------------------------------
 * Area manifests
 * ----------------------------------------------------------------------------------------- */

/**
 * Spec §5.1a — every progress display shows cleared of total, never a bare XP figure, and where
 * an area is not yet fully authored the total wears a tilde: `1 of ~5`. An estimate marked as an
 * estimate is honest; an estimate presented as fact is not, and he will find out either way.
 *
 * The manifest carries the fact. Whether it renders as a tilde is the UI's decision, the same
 * layer boundary §5.1 draws for the DC warning threshold.
 *
 * **`weeks` and `blurb` are optional, and that is temporary rather than permissive.** Six of the
 * eight manifests carry them; `area-0.yml` and `area-2.yml` are held by in-flight tracks that
 * own those files and land their two fields when they next open them. Requiring the fields today
 * would fail `validate:content` on two files this package's own plan may not edit. Tighten this
 * to required once all eight carry them — the wire shape in `@pyquest/contract` already requires
 * both, so an area without them simply has no identity to send until then.
 */
export const AreaManifestSchema = z
  .object({
    area: AreaSchema,
    title: z.string().min(1),
    /**
     * `complete` means the authored quests are all of them; `partial` means the total is an
     * estimate and must be displayed as one.
     */
    authoring: z.enum(['complete', 'partial']),
    /** Expected quest count when `authoring` is `partial`. Ignored when `complete`. */
    estimatedQuests: z.number().int().positive().optional(),
    /**
     * When the area runs, from spec §3's headings — Area 3 is weeks 9–14. Two integers, because
     * `Weeks 9–14` is the UI's to format (ADR 0002).
     *
     * **`to >= from` is the only rule.** The ranges overlap in the real curriculum: Area 1 is
     * weeks 3–6, Area 2a is 6–7 and Area 2b is 7–8, with `area-2.yml` a single manifest covering
     * both halves. A "ranges must not overlap" refinement rejects the content in this repository
     * on the day it is written.
     *
     * Weeks gate nothing — every unlock is earned (§359, §483) and §361 invites him to attempt a
     * boss early — so nothing derives ahead, behind or on-track from them. ADR 0002 leaves that
     * decision unmade, and reopening it is an argument against §361 and §5.8.
     */
    weeks: z
      .object({
        from: z.number().int().positive(),
        to: z.number().int().positive(),
      })
      .strict()
      .refine((weeks) => weeks.to >= weeks.from, {
        message: 'a week range cannot end before it starts',
        path: ['to'],
      })
      .optional(),
    /**
     * The one line under the area's title: `Minecraft data. Inventories are lists.`
     *
     * Authored, not transcribed. §3's **Vehicle:** lines are prose about an area rather than a
     * subtitle for one, so this is the one manifest field with no §3 source of the right shape.
     */
    blurb: z.string().min(1).optional(),
  })
  .strict()
  .superRefine((manifest, ctx) => {
    if (manifest.authoring === 'partial' && manifest.estimatedQuests === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['estimatedQuests'],
        message:
          'a partially authored area must estimate its total, so the UI can mark it as an estimate (spec §5.1a)',
      });
    }
  });

export type AreaManifest = z.infer<typeof AreaManifestSchema>;

/**
 * One practice: a numbered unit of the curriculum, and the ordering the app never had.
 *
 * **A practice is the unit of work; a session is the unit of time** (ADR 0007). The word
 * matters. "Session 3" asserts a sitting, and a learner who takes two evenings over it is told
 * by the noun that he is behind — which is the sentence ADR 0006 exists to refuse. A practice
 * is untimed, so it survives a learner who took twice as long.
 *
 * `exercises` names slugs under `curriculum/area-<n>/exercises/`, **never session plan files**.
 * The learner never opens a plan; the plans are DM-voiced and written for somebody running a
 * calendar. Naming slugs is also what keeps this manifest independent of the directory the
 * plans happen to live in.
 */
export const PracticeSchema = z
  .object({
    /** 1-based, contiguous within an area. The validator proves the sequence has no gap. */
    n: z.number().int().positive(),
    title: z.string().min(1),
    /**
     * Exercise slugs, in the order the practice works them.
     *
     * **Empty is legal and common.** Roughly half the practices in a real area carry no
     * brief-bearing exercise — the work is delivered at the table and `area-1/README.md`
     * records the deliberate non-mappings. Requiring one would make an author invent an
     * exercise to satisfy a schema, which is the schema teaching a lie.
     */
    exercises: z.array(IdSchema).default([]),
  })
  .strict();

export type Practice = z.infer<typeof PracticeSchema>;

/**
 * `curriculum/area-<n>/practices.yml` — the spine of an area.
 *
 * This lives in the curriculum and never in `game/`, because the ordering is the curriculum's
 * own. `tests/two-roots.test.ts` deletes the overlay and asserts the curriculum still stands;
 * a spine stored in quest YAML would be deleted along with it.
 *
 * It is a sidecar rather than a widening of `area.yml` because that file is the manifest of
 * area-level facts — title, weeks, blurb, authoring — and thirteen practices with exercise
 * lists are not one of those.
 */
export const PracticeManifestSchema = z
  .object({
    area: AreaSchema,
    practices: z.array(PracticeSchema).min(1),
  })
  .strict();

export type PracticeManifest = z.infer<typeof PracticeManifestSchema>;

/* -------------------------------------------------------------------------------------------
 * Parsing
 * ----------------------------------------------------------------------------------------- */

/** Parse and validate one content item. Throws `ZodError` with a path into the YAML. */
export function parseContentItem(raw: unknown): ContentItem {
  return ContentItemSchema.parse(raw);
}

/** Parse and validate one area manifest. */
export function parseAreaManifest(raw: unknown): AreaManifest {
  return AreaManifestSchema.parse(raw);
}

/** Parse and validate one area's practice spine. */
export function parsePracticeManifest(raw: unknown): PracticeManifest {
  return PracticeManifestSchema.parse(raw);
}

/** The medal slots an item offers, applying the §5.10 default. */
export function medalsFor(item: ContentItem): readonly Medal[] {
  return item.medals ?? DEFAULT_MEDALS;
}
