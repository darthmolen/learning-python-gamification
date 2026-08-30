"""One job, end to end inside the container: code in, verdict out.

The hidden tests used here are the repository's real ones, passed in as source. That is the shape
the api hands over — it reads them from the content root it already mounts — and it is what makes
the §6.3 assertion below meaningful: the verdict is checked for the *test file's own source*, not
merely for the word "test".
"""

from __future__ import annotations

import json
import tempfile
from pathlib import Path

import pytest

from pyquest_runner.job import JobSpec, run_job
from pyquest_runner.sandbox import Limits, Outcome, workspace
from pyquest_runner.worker import Spool, poll_once

TIGHT = Limits(wall_seconds=20.0, cpu_seconds=15, address_space_bytes=256 * 1024 * 1024)

HIDDEN_TESTS = '''"""Hidden tests for a0-name-tag. Spec 6.3: these never reach the browser."""

import io
import runpy
import sys


def _run_with_input(typed: str) -> str:
    stdin, stdout = sys.stdin, sys.stdout
    sys.stdin = io.StringIO(typed + "\\n")
    sys.stdout = captured = io.StringIO()
    try:
        runpy.run_path("solution.py", run_name="__main__")
    finally:
        sys.stdin, sys.stdout = stdin, stdout
    return captured.getvalue()


def test_greets_the_name_that_was_typed() -> None:
    assert "Welcome, Steve!" in _run_with_input("Steve")
'''

GOOD_SOLUTION = 'name = input("Name? ")\nprint(f"Welcome, {name}!")\n'
BAD_SOLUTION = 'print("Welcome, stranger!")\n'
"""A submission that genuinely fails the hidden test.

It said `Welcome, Steve!` at first, which is the exact line the hidden test asserts on — so pytest
reported one pass and the §6.3 assertions below were reading the output of a run that never
produced a traceback. A leak test that runs against a passing job proves nothing at all.
"""


@pytest.fixture
def work():  # noqa: ANN201
    with tempfile.TemporaryDirectory() as root, workspace(Path(root), "job") as path:
        yield path


def test_a_correct_submission_passes(work: Path) -> None:
    spec = JobSpec(job_id="1", quest_id="a0-name-tag", code=GOOD_SOLUTION, tests=HIDDEN_TESTS)
    verdict = run_job(spec, work, TIGHT)
    assert verdict.outcome is Outcome.PASSED


def test_a_wrong_submission_fails_rather_than_being_killed(work: Path) -> None:
    spec = JobSpec(
        job_id="2",
        quest_id="a0-name-tag",
        code='print("nothing useful")\n',
        tests=HIDDEN_TESTS,
    )
    verdict = run_job(spec, work, TIGHT)
    assert verdict.outcome is Outcome.FAILED


def test_the_verdict_names_the_failing_test_and_never_its_source(work: Path) -> None:
    """The §6.3 assertion, on the one path where a leak would actually happen.

    pytest prints the failing test's source in a traceback, which is the hidden test. `--tb=no` is
    what stops it, and this is the test that would notice the flag being removed.
    """
    spec = JobSpec(job_id="3", quest_id="a0-name-tag", code=BAD_SOLUTION, tests=HIDDEN_TESTS)
    verdict = run_job(spec, work, TIGHT)
    # The fixture has to actually fail, and the first version of it did not: it printed the very
    # line the hidden test asserts on, so pytest reported "1 passed" and the assertions below were
    # checking the output of a run that never produced a traceback.
    assert verdict.outcome is Outcome.FAILED
    combined = verdict.stdout + verdict.stderr
    assert "_run_with_input" not in combined
    assert "runpy.run_path" not in combined
    assert "test_greets_the_name_that_was_typed" in combined


def test_a_submission_that_loops_forever_times_out_rather_than_hanging_the_worker(
    work: Path,
) -> None:
    spec = JobSpec(
        job_id="4",
        quest_id="a0-name-tag",
        code="while True:\n    pass\n",
        tests=HIDDEN_TESTS,
    )
    verdict = run_job(spec, work, Limits(wall_seconds=3.0, cpu_seconds=2))
    assert verdict.outcome is Outcome.TIMED_OUT


def test_the_verdict_serialises_in_the_contracts_vocabulary(work: Path) -> None:
    spec = JobSpec(job_id="5", quest_id="a0-name-tag", code=GOOD_SOLUTION, tests=HIDDEN_TESTS)
    body = json.loads(run_job(spec, work, TIGHT).to_json())
    assert body["jobId"] == "5"
    assert body["status"] == "passed"
    assert set(body["result"]) == {"passed", "stdout", "stderr", "truncated", "durationMs"}


# ---------------------------------------------------------------------------------------------
# The spool
# ---------------------------------------------------------------------------------------------


def test_the_worker_claims_runs_and_publishes() -> None:
    with tempfile.TemporaryDirectory() as root:
        spool = Spool(Path(root), Path(root) / "tmp")
        spool.ensure()
        (spool.incoming / "7.json").write_text(
            json.dumps(
                {
                    "job_id": "7",
                    "quest_id": "a0-name-tag",
                    "code": GOOD_SOLUTION,
                    "tests": HIDDEN_TESTS,
                },
            ),
            encoding="utf-8",
        )

        verdict = poll_once(spool, TIGHT)
        assert verdict is not None
        assert verdict.outcome is Outcome.PASSED
        assert (spool.done / "7.json").exists()
        assert not (spool.incoming / "7.json").exists()
        assert list(spool.running.iterdir()) == []


def test_an_empty_spool_is_not_an_error() -> None:
    with tempfile.TemporaryDirectory() as root:
        spool = Spool(Path(root), Path(root) / "tmp")
        spool.ensure()
        assert poll_once(spool, TIGHT) is None


def test_a_job_is_claimed_once_even_when_polled_twice() -> None:
    with tempfile.TemporaryDirectory() as root:
        spool = Spool(Path(root), Path(root) / "tmp")
        spool.ensure()
        (spool.incoming / "8.json").write_text(
            json.dumps(
                {
                    "job_id": "8",
                    "quest_id": "a0-name-tag",
                    "code": GOOD_SOLUTION,
                    "tests": HIDDEN_TESTS,
                },
            ),
            encoding="utf-8",
        )
        assert poll_once(spool, TIGHT) is not None
        assert poll_once(spool, TIGHT) is None


def test_an_unreadable_job_is_answered_rather_than_crashing_the_loop() -> None:
    """Answer a malformed job rather than crashing on it.

    A worker that dies on a malformed file dies again on restart, and the submission behind it
    never gets an answer — which the learner experiences as the button doing nothing.
    """
    with tempfile.TemporaryDirectory() as root:
        spool = Spool(Path(root), Path(root) / "tmp")
        spool.ensure()
        (spool.incoming / "9.json").write_text("{not json", encoding="utf-8")

        verdict = poll_once(spool, TIGHT)
        assert verdict is not None
        assert verdict.outcome is Outcome.KILLED
        assert (spool.done / "9.json").exists()


def test_the_workspace_does_not_survive_the_job() -> None:
    with tempfile.TemporaryDirectory() as root:
        spool = Spool(Path(root), Path(root) / "tmp")
        spool.ensure()
        (spool.incoming / "10.json").write_text(
            json.dumps(
                {
                    "job_id": "10",
                    "quest_id": "a0-name-tag",
                    "code": "open('leftover.txt', 'w').write('x')\n",
                    "tests": HIDDEN_TESTS,
                },
            ),
            encoding="utf-8",
        )
        poll_once(spool, TIGHT)
        assert list(spool.work.iterdir()) == []
