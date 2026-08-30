# The runner image (§6.6).
#
# Built rather than pulled, and that is forced by `--network none`: the container has no network
# at runtime, so pytest cannot be installed when the job arrives. Everything the sandbox needs is
# baked in here, where the build still has a network, and nothing is fetched afterwards.
#
# Pinned by tag AND digest, like every other image in `infra/`. This campaign runs ~48 weeks and a
# floating tag that drifts mid-campaign is a real failure mode for this project.
FROM python:3.14-alpine@sha256:05b2b8b732ecd268fee8727a369f936f022d1321b59befd13c30ede22769dcdc

# pytest is the verifier for `hidden-tests` (§6.3), so it is part of the runtime rather than a dev
# dependency. Pinned for the same reason the base image is.
RUN pip install --no-cache-dir "pytest==8.3.4"

# Non-root. The read-only root filesystem and the tmpfs workspace come from compose; this is the
# other half, and all three are asserted by `tests/test_sandbox.py` rather than trusted.
RUN adduser -D -u 10001 runner

WORKDIR /app
COPY src/ /app/src/
COPY tests/ /app/tests/
COPY pyproject.toml /app/

# The package is on the path as source. There is no build step because there is nothing to build:
# the runner is four modules and no dependencies of its own.
ENV PYTHONPATH=/app/src \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    SPOOL_ROOT=/spool

USER runner

CMD ["python", "-m", "pyquest_runner"]
