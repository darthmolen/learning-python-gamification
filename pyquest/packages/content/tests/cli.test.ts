/**
 * The command-line contract.
 *
 * `validateContent` returning a list is not what the parent uses. What the parent uses is a
 * process that exits non-zero and prints something worth reading, and neither of those is
 * reachable from a unit test of the function — so these tests run the real CLIs as real
 * processes, with nothing mocked. Spec §6.10's promise is about the command, so the command is
 * what gets tested.
 */

import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it, vi } from 'vitest';

/**
 * Every test here spawns a fresh `node --experimental-strip-types` process to run a CLI, which
 * means a process start and a strip-types compile of the CLI and everything it imports, per call.
 *
 * At rest that is 215–841ms. Under the parallel load of a full run it was measured at **6438ms**,
 * an eightfold blowup against vitest's 5000ms default — a worse ratio than the Gitea suites,
 * because process spawn and JIT are exactly what contends when every worker is busy.
 *
 * Found by running the full suite ten times rather than once: the git timeouts were fixed, eight
 * runs were green, and this went red on the sixth and eighth. One green run would have called the
 * flake fixed and left this to be rediscovered by whoever added the api suite to CI.
 */
vi.setConfig({ testTimeout: 30_000 });


const CONTENT_ROOT = fileURLToPath(new URL('../../../..', import.meta.url));
const VALIDATE_CLI = fileURLToPath(new URL('../src/cli/validate.ts', import.meta.url));
const NEW_QUEST_CLI = fileURLToPath(new URL('../src/cli/new-quest.ts', import.meta.url));

const broken = (name: string): string =>
  fileURLToPath(new URL(`../fixtures/broken/${name}`, import.meta.url));

/** Run a CLI exactly as package.json runs it, and hand back what the shell would see. */
function run(cli: string, args: readonly string[]): { code: number; output: string } {
  const result = spawnSync(process.execPath, ['--experimental-strip-types', cli, ...args], {
    encoding: 'utf8',
  });
  return { code: result.status ?? -1, output: `${result.stdout}${result.stderr}` };
}

const scratch: string[] = [];
const tempRoot = (): string => {
  const dir = mkdtempSync(join(tmpdir(), 'pyquest-content-'));
  scratch.push(dir);
  return dir;
};

afterEach(() => {
  while (scratch.length > 0) rmSync(scratch.pop()!, { recursive: true, force: true });
});

describe('validate:content', () => {
  it('exits 0 on the authored content root', () => {
    const { code, output } = run(VALIDATE_CLI, ['--root', CONTENT_ROOT]);
    expect(output).not.toContain('FAIL');
    expect(code).toBe(0);
  });

  it('exits non-zero on a cyclic prerequisite graph, and names the cycle', () => {
    const { code, output } = run(VALIDATE_CLI, ['--root', broken('cyclic')]);
    expect(code).not.toBe(0);
    expect(output).toMatch(/a1-[a-z](?: -> a1-[a-z])+/);
  });

  it('exits non-zero on an unknown concept tag, and names the tag', () => {
    const { code, output } = run(VALIDATE_CLI, ['--root', broken('unknown-concept')]);
    expect(code).not.toBe(0);
    expect(output).toContain('whille');
  });

  it('reports every file it found problems in before it exits', () => {
    const { code, output } = run(VALIDATE_CLI, ['--root', broken('many-problems')]);
    expect(code).not.toBe(0);
    expect(output).toContain('a3-recipe-book.yml');
    expect(output).toContain('a3-the-crafting-table.yml');
    expect(output).toContain('a3-inventory-lists.yml');
  });

  it('exits non-zero when pointed at a content root that is not there', () => {
    const { code } = run(VALIDATE_CLI, ['--root', join(tempRoot(), 'nowhere')]);
    expect(code).not.toBe(0);
  });
});

describe('new:quest', () => {
  it('scaffolds a quest that the validator accepts with no hand-editing', () => {
    const root = tempRoot();
    const scaffold = run(NEW_QUEST_CLI, [
      '--root', root,
      '--id', 'a3-recipe-book',
      '--title', 'The Recipe Book',
      '--area', '3',
      '--concepts', 'dict,dict-methods,iteration',
      '--dc', '12',
    ]);
    expect(scaffold.output).toContain('a3-recipe-book.yml');
    expect(scaffold.code).toBe(0);

    // A fresh area has no manifest, and §5.1a has no denominator without one. It goes at the
    // conventional path, because a directory an author cannot predict is one they will search.
    expect(existsSync(join(root, 'areas', 'area-3.yml'))).toBe(true);
    expect(existsSync(join(root, 'briefs', 'a3-recipe-book.md'))).toBe(true);

    const validate = run(VALIDATE_CLI, ['--root', root]);
    expect(validate.output).not.toContain('FAIL');
    expect(validate.code).toBe(0);
  });

  it('scaffolds a boss whose theme framings already satisfy §5.2', () => {
    const root = tempRoot();
    expect(
      run(NEW_QUEST_CLI, [
        '--root', root,
        '--id', 'a3-the-crafting-table',
        '--title', 'The Crafting Table',
        '--area', '3',
        '--kind', 'boss',
        '--concepts', 'dict,iteration',
      ]).code,
    ).toBe(0);

    const yaml = readFileSync(join(root, 'quests', 'a3-the-crafting-table.yml'), 'utf8');
    expect(yaml).toContain('themes:');
    expect(run(VALIDATE_CLI, ['--root', root]).code).toBe(0);
  });

  it('wires a prerequisite through to a root that still validates', () => {
    const root = tempRoot();
    run(NEW_QUEST_CLI, ['--root', root, '--id', 'a3-inventory-lists', '--title', 'Inventory Lists', '--area', '3', '--concepts', 'list']);
    const second = run(NEW_QUEST_CLI, [
      '--root', root,
      '--id', 'a3-recipe-book',
      '--title', 'The Recipe Book',
      '--area', '3',
      '--concepts', 'dict',
      '--requires', 'a3-inventory-lists',
    ]);
    expect(second.code).toBe(0);
    expect(run(VALIDATE_CLI, ['--root', root]).code).toBe(0);
  });

  it('refuses to overwrite an id that already exists', () => {
    const root = tempRoot();
    const args = ['--root', root, '--id', 'a3-recipe-book', '--title', 'The Recipe Book', '--area', '3', '--concepts', 'dict'];
    expect(run(NEW_QUEST_CLI, args).code).toBe(0);

    const again = run(NEW_QUEST_CLI, args);
    expect(again.code).not.toBe(0);
    expect(again.output).toContain('already exists');
  });

  it('refuses a concept the learner will not have met, before it writes anything', () => {
    const root = tempRoot();
    const { code, output } = run(NEW_QUEST_CLI, [
      '--root', root,
      '--id', 'a3-too-early',
      '--title', 'Too Early',
      '--area', '3',
      '--concepts', 'dict,class',
    ]);
    expect(code).not.toBe(0);
    expect(output).toContain('class');
    expect(output).toContain('area 5');
    // Nothing was written, so a rejected scaffold leaves no half-quest behind.
    expect(run(VALIDATE_CLI, ['--root', root]).output).not.toContain('a3-too-early');
  });

  it('refuses a concept tag that is not in the registry at all', () => {
    const root = tempRoot();
    const { code, output } = run(NEW_QUEST_CLI, [
      '--root', root, '--id', 'a3-typo', '--title', 'Typo', '--area', '3', '--concepts', 'dicts',
    ]);
    expect(code).not.toBe(0);
    expect(output).toContain('dicts');
  });

  it('explains itself rather than guessing when a required argument is missing', () => {
    const { code, output } = run(NEW_QUEST_CLI, ['--root', tempRoot(), '--title', 'No Id']);
    expect(code).not.toBe(0);
    expect(output).toContain('--id');
  });
});

/**
 * Spawning `node cli.ts --id x` skips the two `package.json` files between the parent's
 * keystrokes and the script, and those are exactly where the arguments got lost: a root script
 * that delegates with `npm run … --workspace <pkg>` and no trailing `--` lets the inner npm
 * swallow every `--flag` as one of its own config keys, forwarding only the bare values. Every
 * test above passed while `npm run new:quest -- --id a3-x` was unusable.
 *
 * So this one runs the command the parent actually types, through both scripts, unmocked.
 */
describe('the command as the parent types it', () => {
  const PYQUEST_ROOT = fileURLToPath(new URL('../../../', import.meta.url));

  /** One command string, run through a shell, exactly as it would be typed. */
  const npm = (command: string) =>
    spawnSync(`npm run --silent ${command}`, {
      cwd: PYQUEST_ROOT,
      encoding: 'utf8',
      shell: true,
    });

  it('forwards flags through the root script to the scaffolder', () => {
    const root = tempRoot();
    const scaffold = npm(
      `new:quest -- --root "${root}" --id a1-signal-fire --title "The Signal Fire" ` +
        '--area 1 --concepts while,range',
    );
    expect(`${scaffold.stdout}${scaffold.stderr}`).toContain('quests/a1-signal-fire.yml');
    expect(scaffold.status).toBe(0);

    // The title survived the shell, the two package.json files, and the YAML writer.
    expect(readFileSync(join(root, 'quests', 'a1-signal-fire.yml'), 'utf8'))
      .toContain('The Signal Fire');

    const validate = npm(`validate:content -- --root "${root}"`);
    expect(`${validate.stdout}${validate.stderr}`).not.toContain('FAIL');
    expect(validate.status).toBe(0);
  }, 120_000);

  /**
   * `npm run --workspace` runs the script with the CWD set to the package directory, not to
   * wherever the parent was standing. So a relative `--root` — the form anyone types, and the
   * form every path in the repo's own docs takes — resolved against `packages/content` and
   * missed. The command still exited non-zero, which is why the suite above stayed green: it
   * failed with "no content root" instead of reporting the cycle that is actually there.
   *
   * An exit code is not a diagnosis. This pins the diagnosis.
   */
  it('resolves a relative --root against where the command was typed, not the package dir', () => {
    const relative = 'packages/content/fixtures/broken/cyclic';
    const result = npm(`validate:content -- --root ${relative}`);
    const output = `${result.stdout}${result.stderr}`;

    expect(output).not.toContain('no content root');
    expect(output).toContain('prerequisite cycle');
    expect(output).toMatch(/a1-a -> a1-[bc] -> a1-[bc] -> a1-a/);
    expect(result.status).toBe(1);
  }, 120_000);
});
