/**
 * The first paragraph of a glossary entry, as plain words.
 *
 * **A hover card is a glance; the chip is the page.** The two surfaces show the same concept and
 * should not show the same amount of it. Opening the `Variables` heading in a lesson produced a
 * card carrying two paragraphs, a fenced `python` block and an italic aside — as raw markdown,
 * in the heading's own bold, laid over the text being read. The DM's verdict was exact: it
 * "should have stopped at *hunting for every copy*", which is the end of the first paragraph.
 *
 * The elaboration is not lost and was never the problem: the concept chips at the top of the
 * Quest and Tome screens render the **whole** entry through `Markdown`, code examples and all,
 * expanding in place with room to be read. That is the reading surface. This is the reminder.
 *
 * **Every authored entry already has this shape** — a definition in the first paragraph, then the
 * examples — because that is how the glossary was written. So the lede is a convention being
 * relied on rather than a rule being imposed, and an entry that ever stops matching it will read
 * oddly in a card long before it breaks anything.
 */

/** Bold, italic and code markers, once the paragraph has been chosen. */
const EMPHASIS = /(\*\*|\*|`)/g;

export function lede(definition: string): string {
  const text = definition.replace(/\r\n/g, '\n');

  let paragraph = '';
  for (const block of text.split(/\n\s*\n/)) {
    const trimmed = block.trim();
    if (trimmed === '') continue;
    // A fence is never the definition. An entry that opens with an example has its prose after
    // it, and taking the code would give the reader a card with no sentence in it.
    if (trimmed.startsWith('```') || trimmed.startsWith('~~~')) continue;
    paragraph = trimmed;
    break;
  }

  /*
   * The author's line breaks are not breaks. Glossary entries are hard-wrapped at about 95
   * columns, so honouring those newlines would ragged the card at whatever width the author's
   * editor happened to be — the same reason `Markdown`'s paragraph rule joins them.
   */
  return paragraph.split('\n').map((line) => line.trim()).join(' ').replace(EMPHASIS, '').trim();
}
