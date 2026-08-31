/**
 * The Field Manual's markup, and the one rule it holds to.
 *
 * **Nothing here may render a number the game invented.** No difficulty class, no XP, no medal
 * slot, no boss. The site's claim is that the curriculum stands on its own, and a page that
 * quietly printed `DC 12` beside an exercise would be quietly disagreeing with it.
 *
 * The palette and type are the artboards' — Archivo Black over IBM Plex — copied rather than
 * imported, because `apps/web` is a leaf this app must not depend on and design tokens are not
 * a reason to couple two applications.
 */

export interface AreaView {
  readonly area: number;
  readonly title: string;
  readonly weeks?: { readonly from: number; readonly to: number };
  readonly blurb?: string;
  /** The teaching itself, already markdown-rendered. Absent means unwritten, and it shows. */
  readonly lesson?: string;
  /** The DM's guide, rendered. Present only in the `dm` build — never emitted then hidden. */
  readonly teachingAid?: string;
  readonly concepts: readonly { readonly id: string; readonly label: string }[];
  readonly exercises: readonly { readonly title: string; readonly body: string; readonly concepts: readonly string[] }[];
}

const STYLE = `
  *{box-sizing:border-box}
  :root{--ground:#12151c;--panel:#1a1f28;--line:#333c4a;--soft:#232a35;
        --ink:#e8ecf2;--muted:#98a3b3;--dim:#5d6878;--accent:#5aa860}
  body{margin:0;background:var(--ground);color:var(--ink);
       font-family:'IBM Plex Sans',ui-sans-serif,system-ui,sans-serif;font-size:15px;line-height:1.65}
  a{color:var(--accent);text-decoration:none}
  a:hover{text-decoration:underline}
  .mono{font-family:'IBM Plex Mono',ui-monospace,Menlo,monospace}
  .disp{font-family:'Archivo Black','IBM Plex Sans',sans-serif;font-weight:400;letter-spacing:-.02em}
  .eyebrow{font-family:'IBM Plex Mono',monospace;font-size:11px;letter-spacing:.14em;
           text-transform:uppercase;color:var(--dim)}
  .wrap{max-width:760px;margin:0 auto;padding:0 24px 80px}
  header{border-bottom:1px solid var(--line);background:var(--panel);margin-bottom:36px}
  .head-in{max-width:760px;margin:0 auto;padding:26px 24px}
  h1{font-size:30px;line-height:1.15;margin:8px 0 10px}
  h2{font-size:20px;margin:34px 0 6px}
  h3{font-size:16px;margin:26px 0 4px}
  p{margin:0 0 14px}
  .lede{color:var(--muted);margin:0}
  .areas{display:grid;gap:1px;background:var(--soft);border:1px solid var(--line)}
  .area{background:var(--panel);padding:15px 17px;display:block}
  .area .n{font-family:'IBM Plex Mono',monospace;font-size:11px;color:var(--dim)}
  .area .t{font-weight:600;margin:3px 0}
  .area .b{color:var(--muted);font-size:14px;margin:0}
  .tags{display:flex;flex-wrap:wrap;gap:6px;margin:10px 0 0;padding:0;list-style:none}
  .tags li{font-family:'IBM Plex Mono',monospace;font-size:12px;color:var(--muted);
           border:1px solid var(--line);padding:2px 8px}
  .ex{border:1px solid var(--line);background:var(--panel);padding:18px 20px;margin:0 0 16px}
  .ex h3{margin-top:0}
  .ex pre{background:#0e1116;border:1px solid var(--soft);padding:12px 14px;overflow-x:auto;
          font-family:'IBM Plex Mono',monospace;font-size:13px}
  .ex code{font-family:'IBM Plex Mono',monospace;font-size:13.5px}
  .gap{border:1px dashed var(--line);padding:16px 18px;color:var(--muted);background:transparent}
  .lesson{border-left:2px solid var(--soft);padding-left:18px;margin:0 0 8px}
  .lesson h3{margin-top:22px}
  .lesson pre{background:#0e1116;border:1px solid var(--soft);padding:12px 14px;overflow-x:auto;
              font-family:'IBM Plex Mono',monospace;font-size:13px}
  .lesson code{font-family:'IBM Plex Mono',monospace;font-size:13.5px}
  /* The aid pushes the page down rather than covering it: no pop-overs, nothing lost. */
  .aid{border:1px solid var(--accent);background:var(--panel);margin:20px 0}
  .aid>summary{cursor:pointer;padding:11px 16px;font-weight:600;color:var(--accent);
               font-family:'IBM Plex Mono',monospace;font-size:13px;letter-spacing:.04em}
  .aid>summary::marker{color:var(--dim)}
  .aid .aid-in{padding:2px 18px 14px;border-top:1px solid var(--line)}
  .aid pre{background:#0e1116;border:1px solid var(--soft);padding:12px 14px;overflow-x:auto}
  footer{margin-top:48px;padding-top:18px;border-top:1px solid var(--line);color:var(--dim);font-size:13px}
`;

const escape = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function page(title: string, body: string): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escape(title)}</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo+Black&family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500;600&display=swap">
<style>${STYLE}</style>
</head>
<body>
${body}
<div class="wrap"><footer>
  A Python curriculum for one household, written as exercises. Generated from the repository's
  own content; edit the content and this page follows.
</footer></div>
</body>
</html>
`;
}

const weeksLabel = (a: AreaView): string =>
  a.weeks ? `Weeks ${a.weeks.from}–${a.weeks.to}` : 'Weeks not yet set';

/** The index: the whole curriculum as a syllabus. */
export function renderIndex(areas: readonly AreaView[]): string {
  const ends = areas.flatMap((a) => (a.weeks ? [a.weeks.to] : []));
  const horizon = ends.length > 0 ? Math.max(...ends) : undefined;
  const concepts = areas.reduce((n, a) => n + a.concepts.length, 0);

  const rows = areas
    .map(
      (a) => `  <a class="area" href="area-${a.area}.html">
    <div class="n">Area ${a.area} · ${escape(weeksLabel(a))}</div>
    <div class="t">${escape(a.title)}</div>
    <p class="b">${a.blurb ? escape(a.blurb) : 'No summary written yet.'}</p>
    <div class="n" style="margin-top:8px">${a.concepts.length} ideas · ${
      a.exercises.length > 0 ? `${a.exercises.length} exercises` : 'exercises not yet written'
    }</div>
  </a>`,
    )
    .join('\n');

  return page(
    'The Field Manual',
    `<header><div class="head-in">
  <div class="eyebrow">A Python curriculum</div>
  <h1 class="disp">The Field Manual</h1>
  <p class="lede">Everything being taught, in the order it is taught, with the exercises that
  teach it. ${horizon !== undefined ? `${horizon} weeks, ` : ''}${areas.length} areas,
  ${concepts} ideas.</p>
</div></header>
<div class="wrap">
  <div class="areas">
${rows}
  </div>
</div>`,
  );
}

/**
 * The teaching aid, or nothing.
 *
 * A `<details>` element, so the expand-in-place behaviour is the browser's and the page needs
 * no script: it opens downward and pushes the content below it further down, which is
 * CLAUDE.md's standing rule — no pop-overs, nothing covered, nothing lost.
 */
function teachingAid(a: AreaView): string {
  if (a.teachingAid === undefined) return '';
  return `<details class="aid">
    <summary>Teaching aid</summary>
    <div class="aid-in">
${a.teachingAid}
    </div>
  </details>`;
}

/** One area: what it teaches, and the exercises that teach it. */
export function renderArea(a: AreaView): string {
  const lesson =
    a.lesson !== undefined
      ? `<h2>The lesson</h2>
  <div class="lesson">
${a.lesson}
  </div>`
      : `<h2>The lesson</h2>
  <div class="gap"><p style="margin:0">No lesson yet. This area has its shape and its
  vocabulary, and nobody has written the teaching down. Saying so is more useful than a page
  that looks finished.</p></div>`;

  const concepts =
    a.concepts.length > 0
      ? `<h2>What this area teaches</h2>
  <ul class="tags">${a.concepts.map((c) => `<li>${escape(c.label)}</li>`).join('')}</ul>`
      : '';

  const exercises =
    a.exercises.length > 0
      ? `<h2>The exercises</h2>
${a.exercises
  .map(
    (e) => `  <section class="ex">
    <h3>${escape(e.title)}</h3>
    <ul class="tags">${e.concepts.map((c) => `<li>${escape(c)}</li>`).join('')}</ul>
    <div class="brief">
${e.body}
    </div>
  </section>`,
  )
  .join('\n')}`
      : `<h2>The exercises</h2>
  <div class="gap"><p style="margin:0">Not written yet. This area has its shape — a title, a
  place in the year, and the ideas above — and no exercises so far. Saying so is more useful
  than an empty page that looks finished.</p></div>`;

  return page(
    `${a.title} — The Field Manual`,
    `<header><div class="head-in">
  <div class="eyebrow"><a href="index.html">The Field Manual</a> · Area ${a.area}</div>
  <h1 class="disp">${escape(a.title)}</h1>
  <p class="lede">${escape(weeksLabel(a))}${a.blurb ? ` · ${escape(a.blurb)}` : ''}</p>
</div></header>
<div class="wrap">
  ${concepts}
  ${lesson}
  ${teachingAid(a)}
  ${exercises}
</div>`,
  );
}
