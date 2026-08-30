"""``python -m pyquest_runner`` — the loop the runner container runs.

The spool root arrives as ``SPOOL_ROOT`` and defaults to ``/spool``, which is where
``infra/compose/api.yml`` mounts the volume the api writes into. ``WORK_ROOT`` is separate and
defaults to ``/tmp``, the tmpfs: jobs run in memory, never on the volume they arrived over. There
is no database URL here and there is no port — this process has no network at all, which is the
§6.6 property everything else in this package is arranged around.
"""

from __future__ import annotations

import logging
import os
from pathlib import Path

from pyquest_runner.worker import Spool, serve


def main() -> None:
    """Configure logging and serve until stopped."""
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
    serve(
        Spool(
            Path(os.environ.get("SPOOL_ROOT", "/spool")),
            Path(os.environ.get("WORK_ROOT", "/tmp")),  # noqa: S108 - the container's tmpfs
        ),
    )


if __name__ == "__main__":
    main()
