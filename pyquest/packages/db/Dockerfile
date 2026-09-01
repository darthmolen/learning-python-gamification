# The migration job (§6.1). Build context is `pyquest/`, not this directory.
#
# ## Why this exists at all
#
# `infra/compose/migrate.yml` used to run a stock `node:22-alpine` with the workspace bind-mounted
# and `npm run migrate --workspace @pyquest/db` as its command. That does not start on a Windows
# host: `npm install` there writes `node_modules/@pyquest/*` as symlinks to absolute Docker-VM
# paths, which resolve on the host and inside the VM and nowhere inside a container. The import
# fails before the migrator reads a line of its own code.
#
# ## The shape, and why it is not a mount
#
# `apps/runner/Dockerfile` is the control in this repository — the one node-adjacent service that
# has always worked — and it **copies its source in and mounts nothing**. That is the part worth
# copying, and the part an earlier draft of the plan got backwards.
#
# A bind mount of the workspace over `/workspace` *replaces* the directory wholesale, so anything
# the image built at `/workspace/node_modules` is masked by the host's. Building dependencies into
# an image and then mounting over them is the same bug wearing a Dockerfile. So: no mount, and a
# source edit reaches the container by rebuilding — which is what `infra/bounce.cmd` is for.
#
# Pinned by tag AND digest like every other image in `infra/`. This campaign runs ~48 weeks and a
# floating tag that drifts mid-campaign is a real failure mode for this project.
FROM node:22-alpine@sha256:c610fcdfb1d5b4740dd70c284ed3cb16bb857e0f7166196e36a5501df7a3aa32

WORKDIR /workspace

# Manifests before source, and that ordering is the whole of the build's speed.
#
# `npm ci` reinstalls only when a manifest or the lockfile changes. Copying source first would
# invalidate this layer on every edit and reinstall the workspace to change one SQL file — which
# would make `bounce.cmd` slow enough that nobody would use it.
#
# Every workspace manifest is needed, not just this package's: `npm ci` resolves the whole
# workspace graph from the root lockfile, and a missing member makes it refuse.
COPY package.json package-lock.json ./
COPY packages/content/package.json packages/content/
COPY packages/contract/package.json packages/contract/
COPY packages/db/package.json packages/db/
COPY packages/engine/package.json packages/engine/
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/

# `--ignore-scripts` because nothing here needs a postinstall, and a lifecycle script is arbitrary
# code running at build time with the network still attached.
RUN npm ci --ignore-scripts

# The source this job actually needs. `db` imports `@pyquest/content` and `@pyquest/contract`, so
# their sources come too; `engine`, `api` and `web` do not, and are left out.
COPY packages/content/ packages/content/
COPY packages/contract/ packages/contract/
COPY packages/db/ packages/db/
COPY tsconfig.base.json tsconfig.json ./

# `migrate` is `tsc -b && node dist/cli.js`, so the build happens here rather than at every run:
# a migration job that compiles on each invocation is a job that can fail for a reason that has
# nothing to do with the migration.
RUN npm run build --workspace @pyquest/db

# Non-root, as the runner is. The migrator writes nothing to its own filesystem — it writes to
# Postgres — so it has no reason to own anything here.
RUN adduser -D -u 10002 migrator
USER migrator

CMD ["node", "packages/db/dist/cli.js"]
