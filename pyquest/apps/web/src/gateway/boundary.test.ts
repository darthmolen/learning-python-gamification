/**
 * @vitest-environment node
 *
 * This suite reads the source tree, not a DOM. Under jsdom `import.meta.url` is an `http://`
 * URL and `fileURLToPath` throws before a single assertion runs — and vitest reports that as a
 * failed *suite* while the summary line still shows every other test passing, which is a very
 * quiet way for a guard to stop guarding. Hence the override, and hence the first test below.
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

const srcDir = fileURLToPath(new URL('..', import.meta.url));

function filesUnder(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) return filesUnder(full);
    return /\.tsx?$/.test(entry.name) ? [full] : [];
  });
}

/** Every `from '...'` specifier in a file, import or re-export alike. */
function importsOf(file: string): string[] {
  const source = readFileSync(file, 'utf8');
  return [...source.matchAll(/from\s+['"]([^'"]+)['"]/g)].map((m) => m[1] as string);
}

/**
 * The value bindings a file imports from `@pyquest/contract`. Bindings written `type Foo` are
 * dropped: a screen naming a contract *type* is the contract doing its job, and only a runtime
 * value — a schema — means the screen is parsing something the gateway should have parsed.
 */
function valueImportsFromContract(file: string): string[] {
  const source = readFileSync(file, 'utf8');
  const clauses = [...source.matchAll(/import\s*\{([^}]*)\}\s*from\s*['"]@pyquest\/contract['"]/g)];

  return clauses.flatMap((m) =>
    (m[1] as string)
      .split(',')
      .map((binding) => binding.trim())
      .filter((binding) => binding.length > 0 && !binding.startsWith('type '))
      .map((binding) => (binding.split(/\s+as\s+/)[0] as string).trim()),
  );
}

/**
 * Phase 5 of the SPA plan claims that swapping stubs for the API changes one module. That is
 * a property of the code or it is nothing — and the way it stops being true is not a decision
 * anyone makes, it is one screen importing one fixture on one afternoon because the gateway
 * did not expose quite the right shape yet.
 *
 * So the rule is checked rather than written down: **a screen reaches data through
 * `src/gateway/` and never past it.** Nothing outside the gateway may name `src/fixtures/`.
 *
 * This test does not go RED before the code exists, because it guards an absence. Its proof is
 * the seeded mutant — an import added to a screen — which is exactly the mutant the plan lists.
 */
describe('the gateway is the only way to the data', () => {
  const files = filesUnder(srcDir).filter((f) => !f.endsWith('boundary.test.ts'));

  it('finds the source tree it is supposed to be guarding', () => {
    // A guard that silently scans nothing passes forever. Check it can see the app first.
    expect(files.length).toBeGreaterThan(8);
    expect(files.some((f) => f.includes('screens'))).toBe(true);
    expect(files.some((f) => f.includes('gateway'))).toBe(true);
  });

  it('lets nothing outside the gateway import a fixture', () => {
    const offenders = files
      .filter((f) => !f.includes(`${'gateway'}`))
      .filter((f) => importsOf(f).some((spec) => spec.includes('fixtures')))
      .map((f) => relative(srcDir, f));

    expect(offenders).toEqual([]);
  });

  it('keeps screens off the contract schemas directly', () => {
    // Types are fine and expected; a screen parsing its own payload is the gateway being
    // bypassed by a second route, and it would move the Phase 5 edit back into the screens.
    //
    // Read the import bindings rather than the file text. The first version of this tested
    // `/\bSchema\b/` against the whole source, which cannot match `AreaIdentitiesSchema` —
    // there is no word boundary inside an identifier — so it survived a seeded mutant and was
    // measuring nothing at all.
    const offenders = filesUnder(join(srcDir, 'screens'))
      .filter((file) => valueImportsFromContract(file).some((name) => name.endsWith('Schema')))
      .map((f) => relative(srcDir, f));

    expect(offenders).toEqual([]);
  });

  /**
   * `@pyquest/content` has two entries: `.` carries the validator, the scaffolder and the CLI —
   * `node:fs` and `yaml` — and `./browser` carries only the schemas and constants. A browser
   * bundle must ask for the second, and **a safe entry only helps the consumers who ask for
   * it.** Nothing about its existence stops the next import from reaching for the bare
   * specifier out of habit.
   *
   * What makes that worth a test rather than a convention is how it fails. One bare import
   * anywhere under `src/` breaks `vite build` with an error naming
   * `packages/content/dist/validate.js` — a file in another package, which the reader did not
   * write and has no reason to suspect. The line that actually caused it is not in the message.
   * This test names that line instead.
   *
   * It also catches what the SPA's own gate cannot: `vitest run --project web` stays green
   * through this failure, because jsdom never evaluates an unused `node:fs` import and vite dev
   * serves modules unbundled. That is exactly how a broken production build survived a commit.
   */
  it('imports the browser entry of the content package, never the bare one', () => {
    const offenders = filesUnder(srcDir)
      .filter((file) => importsOf(file).includes('@pyquest/content'))
      .map((f) => `${relative(srcDir, f)} imports '@pyquest/content' (use '@pyquest/content/browser')`);

    expect(offenders).toEqual([]);
  });

  /**
   * Content lives in git and reaches the app through the contract. A title the SPA can produce
   * on its own is a title the SPA invented, and it goes stale silently the moment the
   * curriculum is edited — which is exactly what happened in Phase 1, where an `AREA_NAMES`
   * table duplicated `curriculum/area-<n>/area.yml` for three areas and made up the other five.
   *
   * Phase 1's guard checked rendered text, which stopped working the moment the gateway began
   * serving real titles: "Collections" on screen became correct. So the guard moved here, where
   * it can tell the difference — **a screen may not contain an area title at all.** Reading it
   * from the gateway is the only way to put one on the page.
   *
   * The titles are read from the manifests rather than listed, so re-titling an area in YAML
   * cannot leave this test guarding a name nobody uses any more.
   */
  it('lets no screen contain an area title as a literal', () => {
    const curriculum = join(srcDir, '..', '..', '..', '..', 'curriculum');
    const titles = readdirSync(curriculum)
      .filter((d) => d.startsWith('area-'))
      .map((d) => join(curriculum, d, 'area.yml'))
      .filter((f) => existsSync(f))
      .map((f) => /^title:\s*(.+)$/m.exec(readFileSync(f, 'utf8'))?.[1]?.trim())
      .filter((t): t is string => t !== undefined && t.length > 0);

    // A guard that reads no titles forbids nothing and passes forever.
    expect(titles.length).toBe(8);

    // Components only. A test naming "Collections" is asserting that the gateway served it,
    // which is the behaviour this rule exists to protect — flagging that would be flagging the
    // proof. Tests ship to nobody; a component that contains a title ships to him.
    const offenders = filesUnder(join(srcDir, 'screens'))
      .filter((file) => !/\.(test|spec)\.tsx?$/.test(file))
      .flatMap((file) => {
        const source = readFileSync(file, 'utf8');
        return titles
          .filter((title) => source.includes(title))
          .map((title) => `${relative(srcDir, file)} contains "${title}"`);
      });

    expect(offenders).toEqual([]);
  });
});
