"""The spool loop: pick up a job, run it, put the verdict back (spec §6.6).

Three directories under one spool root. ``incoming/`` is what the api writes, ``running/`` is what
this process has taken, and ``done/`` is what the api reads back. A claim is a rename, which on
one filesystem is atomic — two workers cannot both take a job because only one rename succeeds,
and the loser gets ``FileNotFoundError`` rather than a half-claimed file.

That is the same property ``FOR UPDATE SKIP LOCKED`` gives the queue on the api's side, arrived at
by the only means available to a process with no network. It is not a second queue: the
``runner_jobs`` table is still the queue, and a file in ``incoming/`` is one claimed row on its way
into the sandbox.

**Nothing in this process trusts what it reads.** A spool file that will not parse is moved to
``done/`` as a killed job rather than crashing the loop, because a worker that dies on a malformed
file is a worker that dies again on restart, and the submission behind it never gets an answer.
"""

from __future__ import annotations

import logging
import time
from dataclasses import dataclass
from pathlib import Path

from pyquest_runner.job import JobSpec, JobVerdict, run_job
from pyquest_runner.sandbox import DEFAULT_LIMITS, Limits, Outcome, workspace

__all__ = ["Spool", "poll_once", "serve"]

logger = logging.getLogger("pyquest.runner")

_POLL_SECONDS = 0.25


# Where per-job workspaces are created. `/tmp` is the tmpfs `infra/compose/api.yml` mounts.
_DEFAULT_WORK_ROOT = Path("/tmp")  # noqa: S108 - the tmpfs, and the only writable path there is


@dataclass(frozen=True, slots=True)
class Spool:
    """The three handoff directories, and — separately — where the sandbox works.

    **The workspace root is not under the spool, and that separation is the whole of this note.**
    It was, at first, and it was wrong twice over. The spool is a volume shared with the api, so a
    submission that fills its workspace would have been filling a disk the api writes to — which is
    exactly the disk fill `RLIMIT_FSIZE` and the tmpfs exist to contain. And on a bind mount from a
    Windows host it does not even work: pytest's output capture opens a temp file, unlinks it and
    truncates it, which that filesystem refuses, and every job came back "no tests ran". Found by
    running the whole loop for real.

    So: the spool carries JSON across the boundary, and the job runs in memory on ``/tmp``.
    """

    root: Path
    work_root: Path = _DEFAULT_WORK_ROOT

    @property
    def incoming(self) -> Path:
        """What the api has written and nobody has taken."""
        return self.root / "incoming"

    @property
    def running(self) -> Path:
        """Taken by a worker. A file here whose worker died is what the api's lease reclaims."""
        return self.root / "running"

    @property
    def done(self) -> Path:
        """Verdicts, waiting for the api to record them."""
        return self.root / "done"

    @property
    def work(self) -> Path:
        """Per-job workspaces. On the tmpfs, never on the volume the api shares — see above."""
        return self.work_root / "pyquest-work"

    def ensure(self) -> None:
        """Create what is missing. Safe to call on every boot."""
        for path in (self.incoming, self.running, self.done, self.work):
            path.mkdir(parents=True, exist_ok=True)


def _claim(spool: Spool) -> Path | None:
    """Take the oldest waiting job, atomically, or return ``None``.

    The rename is the claim. Sorting by name orders by job id, which is a ``bigserial``, so the
    oldest submission is the one that runs first — a queue that serves the newest first is a queue
    that starves whoever pressed the button while the machine was busy.
    """
    for candidate in sorted(spool.incoming.glob("*.json")):
        target = spool.running / candidate.name
        try:
            candidate.rename(target)
        except FileNotFoundError, OSError:
            # Another worker won the rename. Try the next one rather than failing the poll.
            continue
        return target
    return None


def _publish(spool: Spool, verdict: JobVerdict) -> None:
    """Write the verdict, then move it into place.

    Written to a temporary name and renamed, so the api can never read a half-written file: the
    rename is atomic and a file in ``done/`` is therefore always complete.
    """
    staging = spool.done / f".{verdict.job_id}.partial"
    staging.write_text(verdict.to_json(), encoding="utf-8")
    staging.rename(spool.done / f"{verdict.job_id}.json")


def poll_once(spool: Spool, limits: Limits = DEFAULT_LIMITS) -> JobVerdict | None:
    """Run at most one job. Returns its verdict, or ``None`` when the spool was empty.

    Separated from ``serve`` so a test can drive one iteration deterministically. A loop that can
    only be tested by starting it and sleeping is a loop whose failures are timing-dependent.
    """
    claimed = _claim(spool)
    if claimed is None:
        return None

    try:
        spec = JobSpec.from_json(claimed.read_text(encoding="utf-8"))
    except (ValueError, OSError) as error:
        logger.warning("unreadable job %s: %s", claimed.name, error)
        verdict = JobVerdict(
            job_id=claimed.stem,
            outcome=Outcome.KILLED,
            stdout="",
            stderr="the job could not be read",
            truncated=False,
            duration_ms=0,
        )
        _publish(spool, verdict)
        claimed.unlink(missing_ok=True)
        return verdict

    try:
        with workspace(spool.work, spec.job_id) as work:
            verdict = run_job(spec, work, limits)
    except OSError as error:
        logger.exception("job %s could not be run", spec.job_id)
        verdict = JobVerdict(
            job_id=spec.job_id,
            outcome=Outcome.KILLED,
            stdout="",
            stderr=f"the sandbox could not start: {error}",
            truncated=False,
            duration_ms=0,
        )

    _publish(spool, verdict)
    # Unconditional, and after the verdict is published: a job whose file is removed before its
    # answer exists is a submission that vanished, which is the failure the lease exists to catch
    # and the one worth not causing.
    claimed.unlink(missing_ok=True)
    return verdict


def serve(spool: Spool, limits: Limits = DEFAULT_LIMITS, *, forever: bool = True) -> None:
    """Poll until stopped. One job at a time, on purpose.

    Concurrency would need a second set of limits — the container's memory is shared — and two
    players at a kitchen table do not submit at the same instant often enough to pay for it. The
    api's lease is what covers the case where they do.
    """
    spool.ensure()
    logger.info("runner watching %s", spool.incoming)
    while True:
        if poll_once(spool, limits) is None:
            if not forever:
                return
            time.sleep(_POLL_SECONDS)
        elif not forever:
            return
