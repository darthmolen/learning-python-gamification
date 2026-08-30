"""Attacks on the boundary. A boundary you have not attacked is a boundary you have assumed.

Every test here is a program an 11-14-year-old could plausibly write in his first three months,
and each one is run for real: a socket is opened, a gigabyte is asked for, a loop spins, a process
forks itself, a file grows, a print statement never stops. None of it is simulated, because a
simulated attack proves that the simulation is safe.

These run inside the runner container and nowhere else. ``resource`` is POSIX-only and the
container is what supplies the read-only root, the tmpfs and ``--network none`` — three of the
limits this file asserts on. ``docker compose --profile api run --rm runner-tests`` is the command;
running them on the host would report a boundary that is not the one production uses.

The limits are shrunk. Proving the memory cap by allocating a real 256MB is a test that is slow
and that fails on a busy machine for the wrong reason; the cap under test is the mechanism, and
the mechanism does not care what the number is.
"""

from __future__ import annotations

import socket
import sys
import tempfile
from pathlib import Path

import pytest

from pyquest_runner.sandbox import Limits, Outcome, run_sandboxed, workspace

TIGHT = Limits(
    wall_seconds=3.0,
    cpu_seconds=2,
    address_space_bytes=96 * 1024 * 1024,
    processes=24,
    file_size_bytes=256 * 1024,
    output_bytes=4096,
)


@pytest.fixture
def work():  # noqa: ANN201 - a pytest fixture yielding Path
    """Open a workspace that is removed whether or not the test passed."""
    with tempfile.TemporaryDirectory() as root, workspace(Path(root), "test") as path:
        yield path


def run_source(work: Path, source: str, limits: Limits = TIGHT):  # noqa: ANN201
    """Run a program the way a submission is run: as a file, in the workspace, under the limits."""
    (work / "attack.py").write_text(source, encoding="utf-8")
    return run_sandboxed([sys.executable, "attack.py"], work=work, limits=limits)


# ---------------------------------------------------------------------------------------------
# The baseline. A boundary that refuses everything is not a boundary, it is a wall.
# ---------------------------------------------------------------------------------------------


def test_an_ordinary_program_passes_and_its_output_comes_back(work: Path) -> None:
    result = run_source(work, "print('hello from the sandbox')\n")
    assert result.outcome is Outcome.PASSED
    assert result.passed
    assert "hello from the sandbox" in result.stdout
    assert not result.truncated


def test_a_program_that_raises_is_a_failure_and_not_a_kill(work: Path) -> None:
    result = run_source(work, "raise ValueError('wrong')\n")
    assert result.outcome is Outcome.FAILED
    assert "ValueError" in result.stderr


# ---------------------------------------------------------------------------------------------
# --network none (§6.6)
# ---------------------------------------------------------------------------------------------


def test_the_container_itself_has_no_network() -> None:
    """The first assertion, because every other network test is meaningless without it.

    If this fails the suite is not running where it is meant to run, and the tests below would
    pass for a reason that has nothing to do with the sandbox.
    """
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as probe:
        probe.settimeout(2.0)
        # Deliberately broad. "No network" surfaces as several different errnos depending on how
        # the kernel refuses — unreachable, permission denied, timed out — and narrowing this to
        # one of them would make the test pass for the wrong reason on another host.
        with pytest.raises(OSError):  # noqa: PT011
            probe.connect(("1.1.1.1", 53))


def test_a_submission_cannot_open_a_socket(work: Path) -> None:
    result = run_source(
        work,
        "import socket\n"
        "s = socket.socket()\n"
        "s.settimeout(2)\n"
        "s.connect(('1.1.1.1', 53))\n"
        "print('connected')\n",
    )
    assert result.outcome is not Outcome.PASSED
    assert "connected" not in result.stdout


def test_a_submission_cannot_resolve_a_name(work: Path) -> None:
    result = run_source(
        work,
        "import socket\nprint(socket.gethostbyname('example.com'))\n",
    )
    assert result.outcome is not Outcome.PASSED


# ---------------------------------------------------------------------------------------------
# The two clocks — the wall timeout and RLIMIT_CPU
# ---------------------------------------------------------------------------------------------


def test_while_true_dies_at_the_wall_and_not_later(work: Path) -> None:
    """`while True:` is week three, and this is the test the plan asks for by name."""
    result = run_source(work, "while True:\n    pass\n")
    assert result.outcome is Outcome.TIMED_OUT
    assert result.duration_ms < int(TIGHT.wall_seconds * 1000) + 2000


def test_a_program_that_ignores_signals_still_dies(work: Path) -> None:
    """The wall timeout uses SIGKILL, which cannot be caught — but RLIMIT_CPU is the backstop.

    A submission that installs handlers for everything catchable and spins is exactly the case a
    single clock does not cover, so both are set and this asserts the pair.
    """
    result = run_source(
        work,
        "import signal\n"
        "for name in ('SIGTERM', 'SIGINT', 'SIGHUP', 'SIGXCPU'):\n"
        "    try:\n"
        "        signal.signal(getattr(signal, name), signal.SIG_IGN)\n"
        "    except (OSError, ValueError):\n"
        "        pass\n"
        "while True:\n"
        "    pass\n",
    )
    assert result.outcome is Outcome.TIMED_OUT


def test_sleeping_past_the_wall_is_a_timeout_even_with_no_cpu_used(work: Path) -> None:
    """RLIMIT_CPU never fires on a sleeping process, which is why the wall clock exists."""
    result = run_source(work, "import time\ntime.sleep(60)\n")
    assert result.outcome is Outcome.TIMED_OUT


# ---------------------------------------------------------------------------------------------
# RLIMIT_AS — the gigabyte
# ---------------------------------------------------------------------------------------------


def test_allocating_far_more_memory_than_allowed_is_killed_not_failed(work: Path) -> None:
    """The plan's second named attack. `killed`, because it is not a wrong answer."""
    result = run_source(work, "x = bytearray(1024 * 1024 * 1024)\nprint(len(x))\n")
    assert result.outcome is Outcome.KILLED
    assert "1073741824" not in result.stdout


def test_growing_a_list_until_it_runs_out_is_also_killed(work: Path) -> None:
    """The accident, rather than the deliberate version. Area 1 teaches the accumulator pattern."""
    result = run_source(
        work,
        "rows = []\nwhile True:\n    rows.append('x' * 100000)\n",
    )
    assert result.outcome is Outcome.KILLED


# ---------------------------------------------------------------------------------------------
# RLIMIT_NPROC — the fork bomb
# ---------------------------------------------------------------------------------------------


def test_a_fork_bomb_does_not_take_the_machine_with_it(work: Path) -> None:
    """`--network none` plus a wall timeout plus RLIMIT_AS walks straight past this one."""
    result = run_source(
        work,
        "import os\nwhile True:\n    os.fork()\n",
    )
    assert result.outcome in {Outcome.KILLED, Outcome.TIMED_OUT}


def test_spawning_processes_in_a_loop_is_bounded(work: Path) -> None:
    result = run_source(
        work,
        "import subprocess, sys\n"
        "children = [subprocess.Popen([sys.executable, '-c', 'import time; time.sleep(30)'])\n"
        "            for _ in range(200)]\n"
        "print('spawned', len(children))\n",
    )
    assert result.outcome is not Outcome.PASSED


# ---------------------------------------------------------------------------------------------
# RLIMIT_FSIZE — the disk fill, and the same attack wearing a different hat
# ---------------------------------------------------------------------------------------------


def test_filling_the_disk_hits_a_ceiling(work: Path) -> None:
    result = run_source(
        work,
        "with open('big.bin', 'wb') as f:\n    while True:\n        f.write(b'x' * 65536)\n",
    )
    assert result.outcome is Outcome.KILLED


def test_unbounded_printing_is_capped_rather_than_buffered_forever(work: Path) -> None:
    """`while True: print()` is a disk fill and a memory fill wearing a different hat.

    The output goes to a file precisely so that RLIMIT_FSIZE covers this case; reading a pipe with
    a byte cap would leave the runner holding the buffer, which moves the problem to this process.
    """
    result = run_source(work, "while True:\n    print('x' * 1000)\n")
    assert result.outcome in {Outcome.KILLED, Outcome.TIMED_OUT}
    assert len(result.stdout) <= TIGHT.output_bytes
    assert result.truncated


def test_output_under_the_cap_is_not_reported_as_truncated(work: Path) -> None:
    """The other half of the flag: a truncation marker that is always on says nothing."""
    result = run_source(work, "print('short')\n")
    assert not result.truncated


# ---------------------------------------------------------------------------------------------
# The workspace, and what a submission can reach
# ---------------------------------------------------------------------------------------------


def _crash() -> None:
    """Fail the way a job that took the worker down with it fails."""
    message = "the job crashed the worker"
    raise RuntimeError(message)


def test_the_workspace_is_removed_whether_or_not_the_job_survived() -> None:
    with tempfile.TemporaryDirectory() as root, workspace(Path(root), "doomed") as path:
        (path / "left-behind.txt").write_text("data", encoding="utf-8")
        created = path
        with pytest.raises(RuntimeError, match="crashed the worker"):
            _crash()
    assert not created.exists()


def test_a_submission_cannot_read_the_workers_environment(work: Path) -> None:
    """A submission that can read DATABASE_URL has the household's progress database."""
    result = run_source(
        work,
        "import os\nprint(sorted(os.environ))\n",
    )
    assert result.outcome is Outcome.PASSED
    assert "DATABASE_URL" not in result.stdout
    assert "POSTGRES_PASSWORD" not in result.stdout


def test_the_root_filesystem_is_read_only(work: Path) -> None:
    """Container-level, and asserted here because a compose file is not a test.

    The workspace is writable and everything else is not, which is what makes "the only place it
    can write vanishes with the job" true rather than aspirational.
    """
    result = run_source(
        work,
        "open('/usr/local/lib/pwned.py', 'w').write('x')\nprint('wrote')\n",
    )
    assert result.outcome is not Outcome.PASSED
    assert "wrote" not in result.stdout


def test_the_runner_does_not_run_as_root(work: Path) -> None:
    result = run_source(work, "import os\nprint(os.getuid())\n")
    assert result.outcome is Outcome.PASSED
    assert result.stdout.strip() != "0"
