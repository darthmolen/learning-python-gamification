import type { ConceptView } from '@pyquest/contract';

/**
 * Concepts that are one idea wearing three names.
 *
 * The DM's correction, and the sharpest thing said about this feature: "don't worry about if and
 * else and elif alone, but for example if-else-elif, that deserves a roll-over." A learner meeting
 * `elif` does not want a definition of `elif` — they want to see where it sits between the other
 * two. The keyword alone is a fact; the chain is the idea.
 *
 * **This lives in the SPA rather than in `concepts.ts`, and the line is worth drawing.** The
 * registry's job is that `if`, `elif` and `else` each exist and each is defined — and each is,
 * separately, in `curriculum/area-1/glossary.md`, checked by `validate:content` like every other
 * entry. Grouping them into one card is a decision about how a reader is *shown* the words, which
 * is presentation and belongs on the screen making it. No new content is authored: a family
 * composes entries that already exist.
 *
 * The table is deliberately tiny. A grouping that has to be maintained is a grouping that goes
 * stale, so a family earns its place only when the members are close to meaningless apart.
 */
const FAMILIES: readonly { readonly title: string; readonly members: readonly string[] }[] = [
  { title: 'if / elif / else', members: ['if', 'elif', 'else'] },
];

export interface Family {
  readonly title: string;
  readonly members: readonly ConceptView[];
}

/**
 * The family a concept belongs to, with every member resolved, or `undefined` when it stands alone.
 *
 * Members the lookup cannot resolve are dropped rather than faked. That happens when an area is
 * authored and its glossary is not, and §5.1a's honesty rule is the same here as everywhere: show
 * what exists and say nothing about what does not. A family reduced to one surviving member is not
 * a family, so it collapses back to the single concept and the card loses its heading rather than
 * announcing a chain with one link.
 */
export function familyFor(
  concept: ConceptView,
  lookup: (id: string) => ConceptView | undefined,
): Family | undefined {
  const family = FAMILIES.find((candidate) => candidate.members.includes(concept.id));
  if (family === undefined) return undefined;

  const members = family.members.flatMap((id) => {
    const found = id === concept.id ? concept : lookup(id);
    return found === undefined ? [] : [found];
  });

  return members.length > 1 ? { title: family.title, members } : undefined;
}
