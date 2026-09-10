# The SPA, built and served. Build context is `pyquest/`, not this directory.
#
# ## This serves a build, not a dev server, and that was a decision
#
# `web.yml` used to run `npm run dev` — Vite, with the workspace mounted. That cannot survive the
# fix the other two services needed: with source copied into the image rather than mounted, a dev
# server would want an image rebuild per keystroke.
#
# Ruled by the DM, 2026-09-01: **the container becomes what the learner's laptop actually reaches
# over the LAN (§6.4)**, rather than a development convenience that gets thrown away the first
# time anybody needs the real thing. Development stays on the host with `npm run dev`, which is
# where it already happened.
#
# ## The api's address is not in this image, and there is nowhere to put one
#
# This used to carry `ARG VITE_API_URL`, baked into the bundle at build time. It was
# `http://localhost:3081`, which is correct in exactly one browser: the one on the machine running
# the stack. §6.4 puts the api on one machine and the learner's code on another, so the SPA served
# to his laptop told HIS browser to call HIS localhost. No value could be right for both machines.
#
# The fix is not a better value. It is no value: the SPA calls `/api/...` — relative — and the
# `Caddyfile` in this directory proxies `/api/*` to the api over the Docker network. One origin, so
# the browser resolves the api's address to whatever host it already used to reach this page. One
# image is then correct on localhost, on the LAN name, on a raw address and on a real domain over
# https, all at once, with nothing configured.
#
# **`VITE_API_LIVE` below is a boolean, not an address, and the distinction is the point.**
# Fixtures-versus-live is a property of the BUILD, which is what build-time env is for; an address
# is a property of the environment, and this image expresses none. `apps/web/src/gateway/index.ts`
# treats it as absent everywhere except here, so `npm run dev` and `vitest` keep answering from
# fixtures exactly as they did before.

FROM node:22-alpine@sha256:c610fcdfb1d5b4740dd70c284ed3cb16bb857e0f7166196e36a5501df7a3aa32 AS build

WORKDIR /workspace

COPY package.json package-lock.json ./
COPY packages/content/package.json packages/content/
COPY packages/contract/package.json packages/contract/
COPY packages/db/package.json packages/db/
COPY packages/engine/package.json packages/engine/
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/

RUN npm ci --ignore-scripts

COPY packages/ packages/
COPY apps/web/ apps/web/
COPY tsconfig.base.json tsconfig.json ./

# The workspace packages the SPA imports have to be compiled before Vite resolves them through
# their `exports` to `dist/`.
RUN npx tsc -b

# Not an ARG: there is no per-environment value to pass in. Every real build of this image talks to
# a real api, and every build that should answer from fixtures is one nobody runs here — `npm run
# dev` and `vitest`, where this is simply unset.
ENV VITE_API_LIVE=true

# `--ignore-scripts` skips the `prebuild` hook, and it has to.
#
# On a developer's machine `prebuild` runs `scripts/build-packages.ts`, which compiles the
# workspace packages and then proves the compile happened — because `tsc -b` exits 0 without
# emitting once its buildinfo has gone stale. That guard is for a working tree that has been
# switched between branches for days. **This image has no such tree.** It is built from `npm ci`
# and fresh `COPY`s, so there is no pre-existing `dist/` and no `tsconfig.tsbuildinfo` for the
# compiler to trust: the `npx tsc -b` above cannot no-op, and it is the same argument that makes
# CI immune to the failure the guard exists for.
#
# Without the flag this build dies. The hook resolves `../../scripts/build-packages.ts`, and this
# image deliberately copies `packages/`, `apps/web/` and the two tsconfigs and nothing else — no
# `scripts/`, no `tests/`, no `vitest.config.ts`. Measured 2026-09-10: the build failed at this
# line with `Cannot find module /workspace/scripts/build-packages.ts`.
#
# Copying the parity tooling in instead was the alternative and it was rejected: it would put the
# repository's test harness inside the image build to re-check something that cannot be wrong
# here. Packaging is verified where it can actually break — `build.yml`'s "Check dist matches src"
# step, and every host build, both of which keep the hook.
RUN npm run build --workspace @pyquest/web --ignore-scripts

# ---------------------------------------------------------------------------------------------
# The serving stage. Nothing from the build survives except the built files.
#
# A second stage rather than one, because the runtime image then contains no `node_modules`, no
# TypeScript, no source and no lockfile — nothing but static assets and a server. That is a
# smaller thing to keep correct for 48 weeks, and it is the difference between shipping a build
# and shipping a build environment.
#
# Caddy rather than `serve`, and it is not a preference. `serve --single` gave the SPA its history
# fallback and nothing else; this container also has to be the api's front door, so that the browser
# reaches both on one origin and the bundle needs no address. `serve` cannot proxy. The Caddyfile
# keeps the history fallback verbatim — see the `try_files` line there.
# ---------------------------------------------------------------------------------------------
FROM caddy:2-alpine@sha256:5f5c8640aae01df9654968d946d8f1a56c497f1dd5c5cda4cf95ab7c14d58648

COPY apps/web/Caddyfile /etc/caddy/Caddyfile
COPY --from=build /workspace/apps/web/dist/ /srv/

EXPOSE 3082

# Serving the index IS this container's health: it has no health route, and a static server that
# cannot serve its own index is not serving anything. The proxy half is asserted from outside, by
# `infra/smoke.sh` step 4e — a healthcheck that only ever talks to itself cannot notice that the
# route to the api is broken.
HEALTHCHECK --interval=10s --timeout=3s --start-period=10s --retries=5 \
  CMD wget --quiet --spider http://127.0.0.1:3082/ || exit 1
