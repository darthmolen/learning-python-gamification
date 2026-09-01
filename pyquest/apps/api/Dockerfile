# The api (§6.1, §6.3). Build context is `pyquest/`, not this directory.
#
# Same shape as `packages/db/Dockerfile`, for the same reason: install and copy inside the image,
# mount nothing. See that file's header for why a bind mount over `/workspace` puts the original
# Windows bug straight back.
#
# **Content is still mounted, and that is not the same thing.** §6.7 keeps content in git and read
# from disk at boot, and `infra/compose/api.yml` mounts `curriculum/` and `game/` read-only. That
# mount carries *data the api reads*, not the code it runs, so nothing it does can mask an
# installed dependency. The rule this file follows is "do not mount over what the image built",
# not "never mount".
FROM node:22-alpine@sha256:c610fcdfb1d5b4740dd70c284ed3cb16bb857e0f7166196e36a5501df7a3aa32

WORKDIR /workspace

# Manifests first so `npm ci` is cached until a manifest or the lockfile moves. Every workspace
# member's manifest is needed: `npm ci` resolves the graph from the root lockfile and refuses if
# one is absent.
COPY package.json package-lock.json ./
COPY packages/content/package.json packages/content/
COPY packages/contract/package.json packages/contract/
COPY packages/db/package.json packages/db/
COPY packages/engine/package.json packages/engine/
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/

RUN npm ci --ignore-scripts

# The api imports content, contract, db and engine. `apps/web` is not among them and is not copied
# — an api image carrying the SPA's source would be shipping something it cannot run.
COPY packages/ packages/
COPY apps/api/ apps/api/
COPY tsconfig.base.json tsconfig.json ./

# The four workspace packages are built; the api itself is not, and that is not an oversight.
#
# `apps/api` has no build script. Its own `start` runs `tsc -b ../..` and then executes
# `src/main.ts` through `--experimental-strip-types`, because the api is the leaf nobody imports
# and typechecking it is `npm run typecheck`'s job rather than a bundling step. What it *does*
# need is its dependencies compiled: `@pyquest/contract` and friends resolve through their
# `exports` to `dist/` at run time, so `tsc -b` here is what makes those imports resolve at all.
#
# Building at image time rather than at container start matters for a service: an api that
# compiles on boot is an api that can fail for a reason unrelated to serving.
RUN npx tsc -b

# Non-root, as the runner and the migrator are. The api writes to Postgres and to the spool volume,
# and has no reason to own its own source.
RUN adduser -D -u 10003 api

# The spool has to be writable by two different non-root users, and this is where that is settled.
#
# `runner_spool` is a named volume shared with the runner, which compose runs as `10001:10001`.
# The api is 10003. Docker creates a named volume `root:root 0755`, so **both** of them were
# unable to write to it — the api died on `EACCES mkdir /spool/incoming` the first time it ran
# in a container at all. The bug is older than this change and was simply unreachable: the api
# had never started here, so nothing had ever tried.
#
# Docker seeds a named volume from the image content at that path the first time the volume is
# created, ownership and mode included. Creating it here as 0777 is therefore what the volume
# inherits. That is deliberately blunt, and the reasoning is that the spool is a job handoff
# between two of our own containers on one household machine — the runner's isolation comes from
# `network_mode: none`, a read-only root and a tmpfs workspace, none of which this weakens.
#
# **A shared group would be tidier** — one gid, both users in it, `2775` — and it needs the
# runner's Dockerfile, which belongs to another track. Filed rather than reached across for.
#
# **An existing volume keeps its old ownership.** `docker volume rm pyquest_runner_spool` once,
# after which it is seeded correctly. `infra/README.md` says so.
RUN mkdir -p /spool && chmod 0777 /spool

USER api

EXPOSE 3081

# `GET /health` is the healthcheck's target because it touches no database (`server.ts`), so it
# stays true while Postgres restarts — a health check that goes red when a *dependency* blinks
# reports the wrong service as broken.
#
# `--spider` rather than `-O-`: wget is in busybox already, and this needs the status code rather
# than the body.
HEALTHCHECK --interval=10s --timeout=3s --start-period=20s --retries=5 \
  CMD wget --quiet --spider http://127.0.0.1:3081/health || exit 1

CMD ["node", "--experimental-strip-types", "--disable-warning=ExperimentalWarning", "apps/api/src/main.ts"]
