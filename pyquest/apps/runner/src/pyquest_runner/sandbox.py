"""Run untrusted Python behind a boundary that has been attacked (spec §6.6).

The learner is 11 to 14 and will, in week three, write ``while True:``. He will also, without
meaning to, allocate a list until the machine swaps, open a file in a loop, and — the first time
somebody shows him ``os.fork`` — write a fork bomb. None of that is malice and all of it has to
land somewhere survivable, because the machine it lands on is the parent's and the parent's
machine is also where the Journal lives.

**The limits are the design, and each one is here because the others do not cover it.**

``--network none`` at the container is a network that does not exist, which is stronger than a
firewall rule: there is no interface to bind and no resolver to ask.

A wall timeout is what stops ``while True:``, and ``RLIMIT_CPU`` is what stops a process that
ignores the signal the wall timeout sends. Two clocks, because a program that catches ``SIGTERM``
and keeps spinning is a program a wall timeout alone cannot end.

``RLIMIT_AS`` caps address space *under* the container's own memory limit, deliberately: the
process must hit its own ceiling and fail, rather than the container hitting the kernel's OOM
killer, which kills whatever the kernel picks — possibly the worker, which then loses the job it
was holding.

``RLIMIT_NPROC`` is what a fork bomb runs into, and nothing else in this list touches it.

``RLIMIT_FSIZE`` is doing two jobs at once, which is why the child's output goes to files rather
than to pipes. It caps a disk fill, and because stdout is a file it also caps
``while True: print()`` — the same attack wearing a different hat. Reading a pipe with a
byte-count cap would leave the *runner* holding the unbounded buffer, which moves the problem
rather than solving it.

The workspace is a per-job directory on tmpfs, and the cleanup is unconditional: it is removed
whether the job passed, failed, timed out or crashed the worker.

**The verdict is not the exit code.** A process killed for running out of room and a process that
returned 1 because two assertions failed are different things to tell a learner, and §5.10's
answer to the second — "look at what you wrote" — is the wrong sentence for the first. Where the
kernel signals the difference, the signal is used; where CPython turns a limit into an exception
before the kernel can, ``_RESOURCE_MARKERS`` recognises the exception. That second half is a
heuristic and is marked as one, because ``RLIMIT_AS`` does not kill a Python process — it makes
``malloc`` fail, and CPython raises ``MemoryError`` and exits 1 like any other traceback.
"""

from __future__ import annotations

import contextlib
import os
import resource
import shutil
import signal
import subprocess
import time
from dataclasses import dataclass
from enum import StrEnum
from functools import partial
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from collections.abc import Generator, Sequence
    from pathlib import Path

__all__ = [
    "DEFAULT_LIMITS",
    "Limits",
    "Outcome",
    "SandboxResult",
    "run_sandboxed",
    "workspace",
]


class Outcome(StrEnum):
    """What happened, in the vocabulary ``runner_jobs.status`` stores.

    Four members and not three. ``KILLED`` is the resource limits firing, and it survives as its
    own outcome against the obvious simplification because "your code is wrong" is the wrong
    thing to tell a learner whose program ran out of room. It is a different lesson and a
    different next step, and a client that cannot tell the two apart can say neither.
    """

    PASSED = "passed"
    FAILED = "failed"
    TIMED_OUT = "timed-out"
    KILLED = "killed"


@dataclass(frozen=True, slots=True)
class Limits:
    """The whole boundary, as numbers.

    Defaults are the plan's. They are a dataclass rather than module constants so a test can make
    one small enough to hit deliberately — a suite that has to allocate a real gigabyte to prove
    the memory cap works is a suite nobody runs twice.
    """

    wall_seconds: float = 10.0
    """§6.6's ten seconds, enforced by this process."""

    cpu_seconds: int = 10
    """``RLIMIT_CPU``. The second clock, for a child that ignores signals."""

    address_space_bytes: int = 256 * 1024 * 1024
    """``RLIMIT_AS``, under the container's ``mem_limit``.

    Under it deliberately: the child must fail on its own ceiling rather than let the cgroup hand
    the decision to the OOM killer, which picks its own victim.
    """

    processes: int = 64
    """``RLIMIT_NPROC``. What a fork bomb runs into."""

    file_size_bytes: int = 4 * 1024 * 1024
    """``RLIMIT_FSIZE``. Caps a disk fill and, because stdout is a file, unbounded printing too."""

    output_bytes: int = 32 * 1024
    """How much of the captured output travels back. The rest is truncated and said to be."""

    core_bytes: int = 0
    """No core dumps. A crash must not write a copy of the child's memory into the workspace."""


DEFAULT_LIMITS = Limits()

_SIGNAL_OUTCOMES: dict[int, Outcome] = {
    signal.SIGXCPU: Outcome.TIMED_OUT,
    signal.SIGXFSZ: Outcome.KILLED,
    signal.SIGKILL: Outcome.KILLED,
}

_RESOURCE_MARKERS: tuple[str, ...] = (
    "MemoryError",
    "Cannot allocate memory",
    "Resource temporarily unavailable",
    "File too large",
    "Errno 27",
    "Errno 11",
)
"""What CPython says when a limit fired before the kernel could send a signal.

``RLIMIT_AS`` and ``RLIMIT_NPROC`` do not terminate a Python process; they make an allocation or a
fork fail, and CPython raises. Without this list those land as ``FAILED``, which is the api
telling an 11-to-14-year-old his logic is wrong when what happened is that he asked for a gigabyte.
"""


@dataclass(frozen=True, slots=True)
class SandboxResult:
    """One execution, as the api records it."""

    outcome: Outcome
    exit_code: int | None
    stdout: str
    stderr: str
    truncated: bool
    duration_ms: int

    @property
    def passed(self) -> bool:
        """Whether the command succeeded. The one boolean the attempts row is written from."""
        return self.outcome is Outcome.PASSED


def _apply_limits(limits: Limits) -> None:
    """Set every rlimit, in the child, between ``fork`` and ``exec``.

    Runs in the forked child before the image is replaced, which is the only moment at which a
    limit can be applied to a process that does not yet exist. Nothing here may raise for an
    ordinary reason: a raise at this point becomes a child that never starts, reported as a
    failure the learner did not cause.
    """
    # Soft and hard one second apart, deliberately. At the SOFT limit the kernel sends SIGXCPU,
    # which is the signal that says "this ran too long"; only past the HARD limit does it send
    # SIGKILL, which says nothing. With the two equal — as they were, until the suite caught it —
    # every busy loop came back as an anonymous SIGKILL and was reported as `killed`, which tells
    # a learner his program ran out of room when what it did was not finish.
    resource.setrlimit(resource.RLIMIT_CPU, (limits.cpu_seconds, limits.cpu_seconds + 1))
    resource.setrlimit(resource.RLIMIT_AS, (limits.address_space_bytes, limits.address_space_bytes))
    resource.setrlimit(resource.RLIMIT_NPROC, (limits.processes, limits.processes))
    resource.setrlimit(resource.RLIMIT_FSIZE, (limits.file_size_bytes, limits.file_size_bytes))
    resource.setrlimit(resource.RLIMIT_CORE, (limits.core_bytes, limits.core_bytes))
    # Its own process group, so the wall timeout can kill a fork bomb's children as well as its
    # parent. `os.killpg` on the group is the difference between ending the job and ending one
    # process of it.
    os.setsid()


def _child_environment(work: Path) -> dict[str, str]:
    """Build the whole environment the child gets.

    Built rather than inherited. The worker's environment holds a ``DATABASE_URL`` in every
    deployment where the worker talks to Postgres, and a submission that can read it is a
    submission that has the household's progress database — so nothing is inherited by default and
    the list of what is passed is short enough to read.
    """
    return {
        "PATH": "/usr/local/bin:/usr/bin:/bin",
        "HOME": str(work),
        "TMPDIR": str(work),
        "LANG": "C.UTF-8",
        "PYTHONDONTWRITEBYTECODE": "1",
        "PYTHONUNBUFFERED": "1",
        # A submission cannot reach out of its workspace for a module of its own naming.
        "PYTHONNOUSERSITE": "1",
    }


def _read_capped(path: Path, cap: int) -> tuple[str, bool]:
    """Read at most ``cap`` bytes, and say whether there was more.

    ``truncated`` is a field rather than an ellipsis in the text because a learner reading a
    cut-off traceback needs to know it was cut off. Concluding the program stopped where the text
    stops is a wrong lesson that costs an evening.
    """
    if not path.exists():
        return "", False
    with path.open("rb") as handle:
        data = handle.read(cap + 1)
    if len(data) > cap:
        return data[:cap].decode("utf-8", errors="replace"), True
    return data.decode("utf-8", errors="replace"), False


def _cpu_seconds_used() -> float:
    """CPU seconds this process's reaped children have consumed, so far.

    Snapshotted either side of one job and subtracted. The sandbox runs one child at a time — see
    ``worker.serve`` — so the difference is that child's, and it is the only way to tell a
    CPU-limit kill from any other ``SIGKILL`` after the fact.
    """
    usage = resource.getrusage(resource.RUSAGE_CHILDREN)
    return usage.ru_utime + usage.ru_stime


def _classify(  # noqa: PLR0911 - four outcomes and three ways to reach one of them
    *,
    timed_out: bool,
    returncode: int,
    stderr: str,
    cpu_used: float,
    limits: Limits,
) -> Outcome:
    """Turn an exit into one of the four outcomes.

    The order matters, and the middle clause is the one the suite argued for.

    A wall timeout kills with ``SIGKILL``, so whether *we* did the killing is checked first — it is
    the only thing that separates our kill from the kernel's. But the kernel sends ``SIGKILL`` too,
    for two entirely different reasons: a process past its CPU hard limit, and a process the OOM
    killer picked. Those are "it did not finish" and "it ran out of room", which are the two
    sentences §5.10 needs to keep apart, and a bare ``-9`` says neither.

    So the CPU a child actually burned is measured. A submission that ignores ``SIGXCPU`` and spins
    is killed at the hard limit with no signal worth reading, and it was found by the test that
    ignores every catchable signal — which reported ``killed`` for a program that had simply run
    too long.
    """
    if timed_out:
        return Outcome.TIMED_OUT
    if returncode < 0:
        signalled = _SIGNAL_OUTCOMES.get(-returncode)
        if signalled is not None and signalled is not Outcome.KILLED:
            return signalled
        # Within a tolerance, because rusage rounds and the kernel does not stop the clock the
        # instant it decides to kill.
        if cpu_used >= limits.cpu_seconds - 0.25:
            return Outcome.TIMED_OUT
        return Outcome.KILLED
    if returncode == 0:
        return Outcome.PASSED
    if any(marker in stderr for marker in _RESOURCE_MARKERS):
        return Outcome.KILLED
    return Outcome.FAILED


def run_sandboxed(
    argv: Sequence[str],
    *,
    work: Path,
    limits: Limits = DEFAULT_LIMITS,
) -> SandboxResult:
    """Run ``argv`` in ``work`` under ``limits`` and report what happened.

    ``work`` is the child's whole world: its cwd, its ``HOME``, its ``TMPDIR``, and the only place
    it can write. On the runner container that directory is on tmpfs under a read-only root, so
    "the only place it can write" is enforced by the mount rather than by this docstring.
    """
    stdout_path = work / ".stdout"
    stderr_path = work / ".stderr"
    started = time.monotonic()
    cpu_before = _cpu_seconds_used()
    timed_out = False

    with stdout_path.open("wb") as out, stderr_path.open("wb") as err:
        process = subprocess.Popen(  # noqa: S603 - argv is built by this package, never by input
            list(argv),
            cwd=str(work),
            stdin=subprocess.DEVNULL,
            stdout=out,
            stderr=err,
            env=_child_environment(work),
            # `preexec_fn` is the only hook that runs between fork and exec, which is the only
            # moment a limit can be attached to the process that is about to become the child.
            preexec_fn=partial(_apply_limits, limits),  # noqa: PLW1509
            close_fds=True,
        )
        try:
            process.wait(timeout=limits.wall_seconds)
        except subprocess.TimeoutExpired:
            timed_out = True
            _kill_group(process)
            process.wait(timeout=5)

    duration_ms = int((time.monotonic() - started) * 1000)
    cpu_used = _cpu_seconds_used() - cpu_before
    stdout, stdout_cut = _read_capped(stdout_path, limits.output_bytes)
    stderr, stderr_cut = _read_capped(stderr_path, limits.output_bytes)
    returncode = process.returncode if process.returncode is not None else -signal.SIGKILL

    return SandboxResult(
        outcome=_classify(
            timed_out=timed_out,
            returncode=returncode,
            stderr=stderr,
            cpu_used=cpu_used,
            limits=limits,
        ),
        exit_code=returncode,
        stdout=stdout,
        stderr=stderr,
        truncated=stdout_cut or stderr_cut,
        duration_ms=duration_ms,
    )


def _kill_group(process: subprocess.Popen[bytes]) -> None:
    """Kill the child and everything it forked.

    ``killpg`` rather than ``kill``: ``os.setsid`` in the child put the whole job in one process
    group precisely so that this one call ends a fork bomb instead of ending its parent and
    leaving the children reparented to init.
    """
    with contextlib.suppress(ProcessLookupError, PermissionError):
        os.killpg(os.getpgid(process.pid), signal.SIGKILL)
    with contextlib.suppress(ProcessLookupError):
        process.kill()


@contextlib.contextmanager
def workspace(root: Path, job_id: str) -> Generator[Path]:
    """Open a per-job directory that is removed whether or not anything went well.

    Unconditional, and that is the requirement rather than good manners: a workspace left behind
    by a *failing* job is exactly the one holding whatever the failure wrote, and on tmpfs it is
    holding memory the next job needs.
    """
    path = root / f"job-{job_id}"
    if path.exists():
        shutil.rmtree(path, ignore_errors=True)
    path.mkdir(parents=True)
    try:
        yield path
    finally:
        shutil.rmtree(path, ignore_errors=True)
