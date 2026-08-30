"""One job: what arrives, how it is laid out, and what goes back (spec §6.3, §6.6).

**The runner never sees the database and never sees a network.** The api claims a
``runner_jobs`` row, writes it here as a spool directory, and reads the result back the same way.
That is a departure from a first reading of the plan — "the queue is a ``runner_jobs`` table" —
and it is forced by the plan's own stronger requirement: ``--network none`` at the container. A
container with no network cannot reach Postgres, so either the isolation weakens or the handoff
changes, and the isolation is the part the plan spends a section defending. The queue is still
the table; this is only how a claimed job crosses into the sandbox.

**The tests come with the job, and they are content.** The api reads them from the content root
it already mounts and writes them into the spool beside the submission, so ``runner_jobs.payload``
carries the *path* and never the file. A copy of the hidden tests in Postgres would be content in
the database, which §6.7 forbids, and it would also be stale the moment somebody edited the file
in git — which is where the tests actually live.

The submission is written as ``solution.py``, which is the name the authored tests already import:
``content/tests/a0-name-tag_test.py`` calls ``runpy.run_path("solution.py")``. That convention is
the content's and this file follows it rather than inventing a second one.

**``local-repo`` hands over a repository instead of a file, and it arrives as one tar.** §6.4's
evidence is what he pushed, and the authored specification for it reads the filesystem —
``content/tests/a2-where-the-file-lives_test.py`` looks for a directory, runs a script out of it,
and checks that the same command fails one directory up. None of that is expressible as a
``solution.py``. So the api exports ``git archive`` of the commit it reset to, drops the tar in the
spool, and this module unpacks it into the per-job workspace: the learner's files land on the
runner's own tmpfs and never on the volume the api writes to, which is the disk fill the tmpfs
exists to contain.

The tar's path is spool-relative and is **checked rather than trusted**, and the extraction uses
``filter="data"`` so that a member naming an absolute path or climbing out of the workspace is
refused by the standard library. Nothing on the api's side writes such a path; that is precisely
why it is checked, because the spool is the one interface where a bug over there becomes an
arbitrary write over here.
"""

from __future__ import annotations

import json
import tarfile
from dataclasses import dataclass
from pathlib import Path
from typing import Self, cast

from pyquest_runner.sandbox import DEFAULT_LIMITS, Limits, Outcome, SandboxResult, run_sandboxed

__all__ = ["JobSpec", "JobVerdict", "run_job"]

SOLUTION_NAME = "solution.py"
TEST_NAME = "hidden_test.py"


@dataclass(frozen=True, slots=True)
class JobSpec:
    """What the api hands over: the submitted code, the tests, and the ids to hand back."""

    job_id: str
    quest_id: str
    code: str
    tests: str
    """The hidden tests' *source*, read by the api from the content root. Never their path."""

    repo_tar: str | None = None
    """A ``local-repo`` job's tree, as a spool-relative path to a tar. ``None`` for every other
    verifier — ``hidden-tests`` submits one file and has no repository to unpack."""

    @classmethod
    def from_json(cls, raw: str) -> Self:
        """Parse a spool file. Raises ``ValueError`` on anything that is not a job."""
        try:
            parsed: object = json.loads(raw)
        except json.JSONDecodeError as error:
            message = "the spool file is not JSON"
            raise ValueError(message) from error

        if not isinstance(parsed, dict):
            # `ValueError`, not `TypeError`, and ruff is told so below. Nothing here was passed the
            # wrong type by a caller: a spool file is bytes that turned out not to be a job, which
            # is a bad value. The whole point of parsing at this boundary is that the file crossed
            # a process boundary and cannot be trusted.
            message = "a job is a JSON object"
            raise ValueError(message)  # noqa: TRY004

        # `isinstance(..., dict)` narrows to `dict[Unknown, Unknown]`, because a JSON object's
        # key and value types are not something the language can know. The cast says only what the
        # isinstance already proved — it is a dict, and its contents are unknown — and every value
        # is then checked one at a time below. Nothing untyped escapes this method.
        raw_fields = cast("dict[str, object]", parsed)
        fields: dict[str, str] = {}
        for key in ("job_id", "quest_id", "code", "tests"):
            value: object = raw_fields.get(key)
            if not isinstance(value, str):
                message = f"a job needs a string {key}"
                raise ValueError(message)  # noqa: TRY004 - see above
            fields[key] = value

        repo_tar: object = raw_fields.get("repo_tar")
        if repo_tar is not None and not isinstance(repo_tar, str):
            message = "repo_tar is a string or absent"
            raise ValueError(message)

        return cls(
            job_id=fields["job_id"],
            quest_id=fields["quest_id"],
            code=fields["code"],
            tests=fields["tests"],
            repo_tar=repo_tar or None,
        )


@dataclass(frozen=True, slots=True)
class JobVerdict:
    """What goes back, in the vocabulary ``runner_jobs.status`` and ``JobResult`` share."""

    job_id: str
    outcome: Outcome
    stdout: str
    stderr: str
    truncated: bool
    duration_ms: int

    def to_json(self) -> str:
        """Render the spool file the api reads back.

        Field names are the contract's, not Python's: the reader is `apps/api/src/dispatcher.ts`.
        """
        return json.dumps(
            {
                "jobId": self.job_id,
                "status": str(self.outcome),
                "result": {
                    "passed": self.outcome is Outcome.PASSED,
                    "stdout": self.stdout,
                    "stderr": self.stderr,
                    "truncated": self.truncated,
                    "durationMs": self.duration_ms,
                },
            },
            ensure_ascii=False,
        )


def _pytest_argv() -> list[str]:
    """How pytest is invoked, and why every flag is here.

    ``--tb=no`` is the §6.3 one and it costs something real: a traceback prints the *failing
    test's* source, and the failing test is the hidden one. Shipping it would put the assertions
    in the browser through the back door, which is precisely the leak §6.3 exists to close. What
    survives is the short summary — the test's name and whether it passed — and the authored test
    names are written as sentences (``test_greets_the_name_that_was_typed``) exactly because they
    are the feedback the learner is meant to read.

    ``-p no:cacheprovider`` stops pytest writing ``.pytest_cache`` into a workspace that is about
    to be deleted, and ``-p no:randomly`` is deliberately absent: nothing here installs plugins.
    """
    return [
        "python",
        "-m",
        "pytest",
        TEST_NAME,
        "-q",
        "--tb=no",
        "--no-header",
        "-p",
        "no:cacheprovider",
    ]


def _unpack_repository(spec: JobSpec, work: Path, spool_root: Path | None) -> None:
    """Lay a ``local-repo`` job's pushed tree out in the workspace.

    Raises ``ValueError`` for a path that is not inside the spool, which ``worker.poll_once``
    already answers as a killed job rather than crashing the loop.
    """
    if spec.repo_tar is None:
        return
    if spool_root is None:
        message = "a repository job needs a spool root to resolve its tar against"
        raise ValueError(message)

    candidate = Path(spec.repo_tar)
    if candidate.is_absolute() or ".." in candidate.parts:
        message = f"the repository tar {spec.repo_tar!r} is not inside the spool"
        raise ValueError(message)

    tar_path = (spool_root / candidate).resolve()
    if not tar_path.is_relative_to(spool_root.resolve()):
        message = f"the repository tar {spec.repo_tar!r} is not inside the spool"
        raise ValueError(message)
    if not tar_path.is_file():
        message = f"the repository tar {spec.repo_tar!r} is not there"
        raise ValueError(message)

    with tarfile.open(tar_path, "r") as archive:
        # `filter="data"` is the standard library refusing absolute paths, parent traversal,
        # symlinks out of the tree, devices and setuid bits. It is the default from Python 3.14
        # and is passed explicitly anyway: this is the one place a hostile archive would land.
        archive.extractall(work, filter="data")


def run_job(
    spec: JobSpec,
    work: Path,
    limits: Limits = DEFAULT_LIMITS,
    *,
    spool_root: Path | None = None,
) -> JobVerdict:
    """Lay the job out in ``work``, run its tests, and report.

    ``work`` is created and destroyed by the caller — see ``sandbox.workspace`` — because the
    cleanup has to happen even when this function raises, and a ``finally`` here would only cover
    the cases this function survives.

    The repository, when there is one, is unpacked FIRST and the tests are written over the top.
    That order is deliberate: a repository carrying a file of the same name must not be able to
    replace the specification it is being graded against.
    """
    _unpack_repository(spec, work, spool_root)

    # A `local-repo` job submits no code. Writing an empty `solution.py` would put a file in his
    # repository that he did not push, in the one place a test might go looking for one.
    if spec.code:
        (work / SOLUTION_NAME).write_text(spec.code, encoding="utf-8")
    (work / TEST_NAME).write_text(spec.tests, encoding="utf-8")

    result: SandboxResult = run_sandboxed(_pytest_argv(), work=work, limits=limits)

    return JobVerdict(
        job_id=spec.job_id,
        outcome=result.outcome,
        stdout=result.stdout,
        stderr=result.stderr,
        truncated=result.truncated,
        duration_ms=result.duration_ms,
    )
