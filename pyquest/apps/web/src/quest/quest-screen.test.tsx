import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import { AsSignedIn } from '../test-support/session.tsx';
import { describe, expect, it } from 'vitest';
import { QuestScreen } from '../screens/QuestScreen';
import type { WorkerLike } from './useRunner.ts';

/**
 * A worker that never answers unless told to. jsdom has no `Worker`, and Pyodide is ten
 * megabytes of wasm — a Run button that could only be tested by downloading it is a Run button
 * nobody tests.
 */
function fakeWorker() {
  const worker: WorkerLike & { terminated: boolean } = {
    onmessage: null,
    onerror: null,
    terminated: false,
    postMessage: () => {},
    terminate() {
      this.terminated = true;
    },
  };

  return {
    worker,
    factory: () => worker,
    /** The worker posting a failure it caught — a CDN that would not answer, say. */
    fail: (error: string) => {
      worker.onmessage?.({ data: { kind: 'failure', error } } as Parameters<NonNullable<WorkerLike['onmessage']>>[0]);
    },
    /** The worker never loading at all, which never reaches its own error handling. */
    crash: (message: string) => worker.onerror?.({ message }),
    reply: (data: { ops?: unknown[]; stdout?: string; error?: string | null }) => {
      const payload = { kind: 'result', ops: [], stdout: '', error: null, ...data };
      worker.onmessage?.({ data: payload } as Parameters<NonNullable<WorkerLike['onmessage']>>[0]);
    },
  };
}

/**
 * Render, then wait for the quest to arrive. The screen fetches its brief, medal slots and
 * starter now, so everything below is asserted against a loaded screen rather than a loading one
 * that happens not to have the thing being looked for.
 */
const renderQuest = async (factory: () => WorkerLike, questId = 'a3-recipe-book') => {
  const result = render(
    <AsSignedIn>
      <MemoryRouter initialEntries={[`/area/3/quest/${questId}`]}>
        <Routes>
          <Route
            path="/area/:areaId/quest/:questId"
            /* `pollMs={0}` so the job poll runs on the next tick rather than in 700ms. The
             * interval is injectable for exactly this reason — a suite that waited on the real
             * one would be slow and, worse, flaky under load. */
            element={<QuestScreen makeWorker={factory} pollMs={0} />}
          />
        </Routes>
      </MemoryRouter>
    </AsSignedIn>,
  );
  await screen.findByRole('button', { name: 'Run' });
  return result;
};

describe('Run', () => {
  it('starts with an empty canvas and an empty console', async () => {
    const { factory } = fakeWorker();
    await renderQuest(factory);

    expect(screen.getByRole('img', { name: /nothing drawn yet/i })).toBeInTheDocument();
    expect(screen.getByText(/Nothing yet. Press Run/)).toBeInTheDocument();
    // The status line, not the panel heading of the same name.
    expect(screen.getByRole('status', { name: 'Run' })).toHaveTextContent('Console');
  });

  it('draws what the program drew', async () => {
    const { factory, reply } = fakeWorker();
    await renderQuest(factory);

    await userEvent.click(screen.getByRole('button', { name: 'Run' }));
    reply({
      ops: [
        { op: 'forward', args: [100] }, { op: 'right', args: [90] },
        { op: 'forward', args: [100] }, { op: 'right', args: [90] },
        { op: 'forward', args: [100] }, { op: 'right', args: [90] },
        { op: 'forward', args: [100] }, { op: 'right', args: [90] },
      ],
    });

    await waitFor(() => {
      expect(screen.getByRole('img', { name: 'Turtle drawing, 4 lines' })).toBeInTheDocument();
    });
    expect(screen.getByRole('status', { name: 'Run' })).toHaveTextContent('Run · browser');
  });

  /** The property the shim exists for: a failed program keeps the drawing it managed. */
  it('shows the traceback beside the part that drew', async () => {
    const { factory, reply } = fakeWorker();
    await renderQuest(factory);

    await userEvent.click(screen.getByRole('button', { name: 'Run' }));
    reply({
      ops: [{ op: 'forward', args: [100] }, { op: 'right', args: [90] }, { op: 'forward', args: [100] }],
      error: 'ZeroDivisionError: division by zero',
    });

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('ZeroDivisionError');
    });
    // Two strokes survived. Losing them would take away the evidence he needs to debug.
    expect(screen.getByRole('img', { name: 'Turtle drawing, 2 lines' })).toBeInTheDocument();
    expect(screen.getByRole('status', { name: 'Run' })).toHaveTextContent('Run · raised');
  });

  it('prints what the program printed', async () => {
    const { factory, reply } = fakeWorker();
    await renderQuest(factory);

    await userEvent.click(screen.getByRole('button', { name: 'Run' }));
    reply({ stdout: 'four sides\n' });

    await waitFor(() => expect(screen.getByText(/four sides/)).toBeInTheDocument());
  });
});

/**
 * ADR 0003's payoff, made visible. `while True:` is week-three material, and a main thread
 * running one cannot service the click that would end it.
 */
describe('Stop', () => {
  it('is offered only while something is running', async () => {
    const { factory, reply } = fakeWorker();
    await renderQuest(factory);

    expect(screen.queryByRole('button', { name: 'Stop' })).toBeNull();

    await userEvent.click(screen.getByRole('button', { name: 'Run' }));
    expect(screen.getByRole('button', { name: 'Stop' })).toBeInTheDocument();

    reply({});
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Stop' })).toBeNull());
  });

  it('kills the worker rather than asking it to stop', async () => {
    const { worker, factory } = fakeWorker();
    await renderQuest(factory);

    await userEvent.click(screen.getByRole('button', { name: 'Run' }));
    await userEvent.click(screen.getByRole('button', { name: 'Stop' }));

    // There is no cooperative way to interrupt a Python loop that is not yielding.
    expect(worker.terminated).toBe(true);
    expect(screen.getByRole('status', { name: 'Run' })).toHaveTextContent('Run · stopped');
  });

  it('ignores a result that lands after he stopped', async () => {
    const { factory, reply } = fakeWorker();
    await renderQuest(factory);

    await userEvent.click(screen.getByRole('button', { name: 'Run' }));
    await userEvent.click(screen.getByRole('button', { name: 'Stop' }));
    reply({ stdout: 'too late' });

    // Showing the output of a run he cancelled would tell him Stop does not work.
    expect(screen.queryByText(/too late/)).toBeNull();
    expect(screen.getByRole('status', { name: 'Run' })).toHaveTextContent('Run · stopped');
  });
});

describe('the labels', () => {
  /**
   * CLAUDE.md: labels never change with state. This is the screen where it is hardest, and this
   * test was wrong the first time it was written.
   *
   * It used `toHaveTextContent('Run')`, which matches a **substring** — so `Running…` passed it,
   * and a seeded mutant that did exactly the forbidden thing went uncaught. Every assertion here
   * is anchored now. A rule this load-bearing deserves a check that cannot be satisfied by a
   * word that merely starts the same way.
   */
  it('keeps Run reading exactly Run, in every phase', async () => {
    const { factory, reply } = fakeWorker();
    await renderQuest(factory);

    const run = screen.getByRole('button', { name: 'Run' });
    expect(run.textContent).toBe('Run');

    await userEvent.click(run);
    expect(run.textContent).toBe('Run');

    reply({ error: 'boom' });
    await waitFor(() => expect(screen.getByRole('status', { name: 'Run' })).toHaveTextContent('Run · raised'));
    expect(screen.getByRole('button', { name: 'Run' }).textContent).toBe('Run');
  });

  it('keeps Stop reading exactly Stop', async () => {
    const { factory } = fakeWorker();
    await renderQuest(factory);

    await userEvent.click(screen.getByRole('button', { name: 'Run' }));
    expect(screen.getByRole('button', { name: 'Stop' }).textContent).toBe('Stop');
  });

  it('keeps Submit reading Submit, and says elsewhere why it cannot be pressed', async () => {
    const { factory } = fakeWorker();
    await renderQuest(factory);

    const submit = screen.getByRole('button', { name: 'Submit' });
    // Untouched starter on a hidden-tests quest. The refusal is the mechanic, not a missing API.
    expect(submit).toBeDisabled();
    expect(submit.textContent).toBe('Submit');
    expect(screen.getByText(/Change something first/)).toBeInTheDocument();
  });

  it('says Submit reads the editor rather than the click, while the code is untouched', async () => {
    const { factory } = fakeWorker();
    await renderQuest(factory);

    expect(screen.getByText(/reads the editor, not the click/)).toBeInTheDocument();
  });

  /**
   * The rule only applies where it means something. `local-repo` grades what was pushed (§6.4),
   * so the editor is not the evidence and gating on it would refuse a submission for a reason
   * that does not apply — the learner would be told to change code the API will never read.
   */
  it('does not hold Submit against the editor on a quest that grades what was pushed', async () => {
    const { factory } = fakeWorker();
    await renderQuest(factory, 'a3-the-smelter');

    expect(screen.getByRole('button', { name: 'Submit' })).toBeEnabled();
    expect(screen.getByText(/grades what you pushed/)).toBeInTheDocument();
  });
});

/**
 * Submit — §6.3, and the path the whole game turns on.
 *
 * The four verifiers behave differently on purpose, and the difference that matters most is
 * invisible on the wire: a queued `peer-signoff` and a queued `hidden-tests` are identical in
 * `JobAccepted`, while only one of them has a `runner_jobs` row to poll. Polling the other
 * answers 404, which would report a submission that worked as one that went missing.
 */
describe('Submit', () => {
  it('runs a hidden-tests submission through the job queue to a verdict', async () => {
    const { factory } = fakeWorker();
    const { container } = await renderQuest(factory, 'a3-inventory-lists');

    // CodeMirror owns a contenteditable rather than a textarea, so the editor is reached
    // through its content node. Typing is the only way to make Submit legal here, and that is
    // the mechanic rather than a testing inconvenience.
    const content = container.querySelector('.cm-content') as HTMLElement;
    await userEvent.click(content);
    await userEvent.type(content, 'x = 1');

    await waitFor(() => expect(screen.getByRole('button', { name: 'Submit' })).toBeEnabled());
    await userEvent.click(screen.getByRole('button', { name: 'Submit' }));

    await waitFor(() => {
      expect(screen.getByRole('status', { name: 'Submit' })).toHaveTextContent('Submit · passed');
    });
    // The runner's summary, which only arrives by polling — a screen that stopped at the 202
    // would show the verdict and never this.
    expect(screen.getByText(/4 passed in 0.31s/)).toBeInTheDocument();
  });

  /**
   * The case the whole rule exists for. `server.ts` records an `attempts` row and answers 202
   * with its id; there is no job and never will be, because what happens next is a person
   * reading it. A client that polled would ask `/api/jobs/att-…`, which requires a numeric id.
   */
  it('does not poll a peer-signoff, and says which seat it is waiting on', async () => {
    const { factory } = fakeWorker();
    await renderQuest(factory, 'a3-the-enchanter');

    await userEvent.click(screen.getByRole('button', { name: 'Submit' }));

    await waitFor(() => {
      expect(screen.getByRole('status', { name: 'Submit' })).toHaveTextContent(
        'Submit · waiting on the peer',
      );
    });
    // Not a failure, and not a verdict. It is recorded and somebody has to look at it.
    expect(screen.getByText(/sits in the Console until somebody signs it/)).toBeInTheDocument();
    expect(screen.getByRole('status', { name: 'Submit' })).not.toHaveTextContent(/not found|404/);
  });

  /**
   * `git-signal` resolves at submit time — the evidence is a history already on the server, so
   * the API answers 200 with a terminal state rather than an id to poll. Telling a client to
   * poll for an answer it already has is how a screen says "working" about something finished.
   */
  it('takes a git-signal verdict from the submit response itself', async () => {
    const { factory } = fakeWorker();
    await renderQuest(factory, 'a3-the-trading-hall');

    await userEvent.click(screen.getByRole('button', { name: 'Submit' }));

    await waitFor(() => {
      expect(screen.getByRole('status', { name: 'Submit' })).toHaveTextContent('Submit · passed');
    });
  });

  it('explains what Submit will do before it is pressed, per verifier', async () => {
    const { factory } = fakeWorker();
    await renderQuest(factory, 'a3-the-trading-hall');

    expect(screen.getByText(/reads your git history for a push/)).toBeInTheDocument();
  });
});

describe('the Tome, on the screen where he is working', () => {
  it('expands over the work without closing it', async () => {
    const { factory } = fakeWorker();
    await renderQuest(factory);

    const tome = screen.getByRole('button', { name: 'Tome' });
    expect(tome).toHaveAttribute('aria-expanded', 'false');

    await userEvent.click(tome);
    expect(tome).toHaveAttribute('aria-expanded', 'true');
    // The editor is still mounted underneath. Nothing is covered and nothing is lost.
    expect(screen.getByRole('group', { name: 'Python editor' })).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});

/**
 * The bug this suite was written after. `runner.worker.ts` used `importScripts` inside a module
 * worker, died on boot, and the screen sat on `Run · working` with a Stop button that had
 * nothing to stop. Nothing in the UI said anything was wrong; the only evidence was in a console
 * nobody had open.
 *
 * A silent hang is the worst failure this app can have. He cannot tell it from a slow one, so he
 * waits — and what he learns is that the tool is unreliable rather than that it broke.
 */
describe('when the runner itself breaks', () => {
  it('says so instead of sitting on working forever', async () => {
    const { factory, fail } = fakeWorker();
    await renderQuest(factory);

    await userEvent.click(screen.getByRole('button', { name: 'Run' }));
    expect(screen.getByRole('status', { name: 'Run' })).toHaveTextContent('Run · working');

    fail("Module scripts don't support importScripts()");

    await waitFor(() => {
      expect(screen.getByRole('status', { name: 'Run' })).toHaveTextContent('Run · runner broke');
    });
    expect(screen.getByRole('alert')).toHaveTextContent('importScripts');
  });

  it('catches a worker that never loaded at all', async () => {
    const { factory, crash } = fakeWorker();
    await renderQuest(factory);

    await userEvent.click(screen.getByRole('button', { name: 'Run' }));
    crash('failed to fetch the worker');

    await waitFor(() => {
      expect(screen.getByRole('status', { name: 'Run' })).toHaveTextContent('Run · runner broke');
    });
  });

  it('takes the Stop button away, because there is nothing left to stop', async () => {
    const { factory, fail } = fakeWorker();
    await renderQuest(factory);

    await userEvent.click(screen.getByRole('button', { name: 'Run' }));
    fail('boom');

    await waitFor(() => expect(screen.queryByRole('button', { name: 'Stop' })).toBeNull());
    // And Run is offered again, rather than staying disabled behind a run that ended.
    expect(screen.getByRole('button', { name: 'Run' })).toBeEnabled();
  });
});

/**
 * A traceback is the most useful thing a learner sees all evening, and §3 promises from Area 0
 * that errors are readable. So what reaches the console is asserted, not assumed.
 *
 * What the *shape* of it should be is proved in Python, by `harness.py` and by CPython's own
 * `traceback` module. What is proved here is that the screen shows it whole, and names his file
 * rather than `<exec>`.
 */
describe('the traceback', () => {
  it('names his file, and shows it verbatim', async () => {
    const { factory, reply } = fakeWorker();
    await renderQuest(factory);

    await userEvent.click(screen.getByRole('button', { name: 'Run' }));
    reply({
      error: '  File "a3-recipe-book.py", line 7\n    for x\n         ^\nSyntaxError: invalid syntax\n',
    });

    await waitFor(() => {
      const alert = screen.getByRole('alert');
      // The quoted line and the caret are the parts a beginner reads. Neither survives being
      // trimmed, collapsed, or run through a formatter that thinks whitespace is decoration.
      expect(alert).toHaveTextContent('a3-recipe-book.py');
      expect(alert.textContent).toContain('    for x');
      expect(alert.textContent).toContain('^');
    });
  });

  /**
   * The bug this pair was written after, found by pressing Run on `a0-ask-and-draw`.
   *
   * Pyodide has no stdin unless it is given one, so `input()` answered
   * `OSError: [Errno 29] I/O error` — on the Area 0 quest that *teaches* `input()`, whose own
   * starter says "Run it first and read what falls out before you fix anything". The error the
   * session is about is a `TypeError` from handing a str to `forward()`; what he got was a fault
   * in the runner, and an evening debugging the tool instead of the bug.
   *
   * Nothing automated caught it because nothing automated has ever booted Pyodide. What is
   * asserted here is the plumbing — that what he typed reaches the worker — and `stdin.test.ts`
   * proves the queue. The wasm end of it stays a person's job.
   */
  it('sends the answers he typed, so input() has something to read', async () => {
    const sent: { code: string; filename: string; stdin: string }[] = [];
    const { worker, factory } = fakeWorker();
    worker.postMessage = (message) => sent.push({ ...message });
    const { container } = await renderQuest(factory);

    await userEvent.type(screen.getByRole('textbox', { name: /Answers for input/i }), '150');
    await userEvent.click(screen.getByRole('button', { name: 'Run' }));

    expect(sent[0]?.stdin).toBe('150');
    void container;
  });

  it('sends an empty stdin rather than undefined when he typed nothing', async () => {
    const sent: { stdin: string }[] = [];
    const { worker, factory } = fakeWorker();
    worker.postMessage = (message) => sent.push({ stdin: message.stdin });
    await renderQuest(factory);

    await userEvent.click(screen.getByRole('button', { name: 'Run' }));

    // Not `undefined`: the worker would then read `input()` off a stream that does not exist,
    // which is the OSError this whole path exists to stop.
    expect(sent[0]?.stdin).toBe('');
  });

  it('runs his code under a filename taken from the quest', async () => {
    const sent: { code: string; filename: string }[] = [];
    const { worker, factory } = fakeWorker();
    worker.postMessage = (message) => sent.push({ code: message.code, filename: message.filename });
    await renderQuest(factory);

    await userEvent.click(screen.getByRole('button', { name: 'Run' }));

    // `<exec>` is not a filename he can learn anything from; this is what he would call it.
    expect(sent[0]?.filename).toBe('a3-recipe-book.py');
  });
});
