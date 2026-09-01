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
# ## The one consequence worth knowing before you debug it
#
# **`VITE_API_URL` is read at BUILD time, not at run time.** Vite substitutes `import.meta.env`
# into the bundle, so the api's address is baked into these files. Changing it means rebuilding
# this image — `infra/bounce.cmd web` — not restarting the container. Setting it as a runtime
# environment variable in compose would do nothing at all, silently, which is exactly the kind of
# nothing that costs an evening.
#
# `apps/web/src/gateway/index.ts` treats an ABSENT `VITE_API_URL` as "answer from fixtures", so a
# build with no value produces a working offline SPA rather than a broken online one. That is a
# reasonable default and a poor surprise, hence the ARG below being explicit.

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

ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}
RUN npm run build --workspace @pyquest/web

# ---------------------------------------------------------------------------------------------
# The serving stage. Nothing from the build survives except the built files.
#
# A second stage rather than one, because the runtime image then contains no `node_modules`, no
# TypeScript, no source and no lockfile — nothing but static assets and a server. That is a
# smaller thing to keep correct for 48 weeks, and it is the difference between shipping a build
# and shipping a build environment.
# ---------------------------------------------------------------------------------------------
FROM node:22-alpine@sha256:c610fcdfb1d5b4740dd70c284ed3cb16bb857e0f7166196e36a5501df7a3aa32

WORKDIR /srv

# `serve` rather than nginx: one dependency, and `--single` gives the SPA's client-side router the
# history fallback it needs. A route like `/area/3/quest/a3-recipe-book` is a real URL the learner
# can reload or bookmark, and a static server without a fallback answers 404 to every one of them.
RUN npm install --global --no-fund --no-audit serve@14.2.4

COPY --from=build /workspace/apps/web/dist/ /srv/

RUN adduser -D -u 10004 web
USER web

EXPOSE 3082

HEALTHCHECK --interval=10s --timeout=3s --start-period=10s --retries=5 \
  CMD wget --quiet --spider http://127.0.0.1:3082/ || exit 1

# A static server has no health route, so serving the index IS its health — see the healthcheck.
CMD ["serve", "--single", "--listen", "tcp://0.0.0.0:3082", "/srv"]
