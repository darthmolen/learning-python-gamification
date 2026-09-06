---
kind: plan
status: in-progress
track: infra
date: 2026-09-06
---

**Status:** In progress
**Track:** infra
**Date:** 2026-09-06
**Author:** Claude (Opus 5)
**Lane:** A

# The stack comes back after a reboot

## Objective

The api, runner and web containers return healthy after a reboot with nothing typed, and the SPA
reaches the api from any machine on the LAN without an image rebuild.

## Why this exists

The stack does not survive a reboot, and the container state proves it precisely rather than by
inference. Captured before any change, in `planning/evidence/reboot-survival-RED.txt`:

```text
CONTAINER          STATUS    EXIT   FINISHED                         RESTART
pyquest-postgres   running   0      2026-09-06T11:34:17.551659336Z   unless-stopped
pyquest-gitea      running   0      2026-09-06T11:34:17.551622423Z   unless-stopped
pyquest-api        exited    255    2026-09-06T11:34:17.551604746Z   no
pyquest-runner     exited    255    2026-09-06T11:34:17.551632884Z   no
pyquest-web        exited    255    2026-09-06T11:34:17.551604649Z   no
```

Three containers exited at the *same* timestamp with exit 255 — the Docker daemon stopping, not a
crash. The api's last log line is a healthy `/health` 200. Postgres and Gitea came back from that
same event because `docker-compose.yml` gives them `restart: unless-stopped`; the other three carry
`restart: no` and stayed down until someone remembered to type `start-full.cmd`.

Docker Desktop is not the problem — `AutoStart: true`, and it is in the HKCU `Run` key.

Second half of "available for the curriculum": the SPA has `VITE_API_URL=http://localhost:3081`
**baked into its bundle at build time**. From the DM's browser that works. From the learner's laptop
the SPA loads and every api call goes to *his* localhost. §6.4 puts the api on one machine and the
code on another, so an auto-started stack that only works at one desk has not finished the job.

Baking a different string only moves the problem, and so does delivering the same string at runtime:
both still have to *communicate an address*. The SPA is instead served from the same origin as the
api, so there is no address to communicate — no host, no port, no CORS, in any environment.

## Success criteria

- [ ] After a Docker daemon restart, all five containers return healthy with nothing typed.
- [ ] After a Windows reboot and sign-in, same — including the migration job.
- [ ] A boot-time failure writes a transcript and raises a desktop notification naming it.
- [ ] The SPA reaches the api from `localhost`, from the machine's LAN name, and from its raw LAN
      address, with the same image and no rebuild between them.
- [ ] No host and no port appear in any built artifact.
- [ ] Verified from the learner's laptop, not from the DM's machine.

## Approach

Three parts, and only the first is about reboots. The second covers what a restart policy cannot,
and the third is what makes an always-on stack reachable by the person it is for.

### Part 1 — the restart policies

`restart: unless-stopped` on `api`, `runner` and `web`. Docker applies a restart policy at *daemon*
start regardless of Compose profiles — profiles select what the Compose CLI acts on, not what the
daemon resumes — so this alone fixes the failure captured above.

`runner-tests` gets an **explicit** `restart: "no"` for the same reason `compose/migrate.yml`
already spells it out: it is a one-shot pytest run, and a restart policy on a job that exits 0 is a
boot loop. `no` is the default, but a default sitting silently beside three siblings that were
deliberately changed is how the next person adds a fourth.

Necessary, not sufficient. A restart policy cannot resurrect a container that was *removed*, and the
documented stop command — `docker compose --profile api --profile web down` — removes them. It also
never runs migrations.

### Part 2 — `infra/autostart.cmd`, launched from the Startup folder

A boot wrapper around `start-full.cmd`, kept separate rather than folded in. `start-full.cmd`'s
header commits it to failing loudly *now* — `docker info` fails, it exits 1 — which is right for a
human at a prompt and wrong at sign-in, when Docker Desktop is still starting.

The wrapper polls `docker info` up to 300s, rolls a two-generation log, runs `start-full.cmd` into
it, and on a non-zero exit raises a desktop notification naming the log before exiting with
`start-full.cmd`'s own code.

It waits with `ping -n 3 127.0.0.1`, never `timeout`. The reason is already written down at
`start-full.cmd:130-134`: `timeout` reads the console and dies with "Input redirection is not
supported" the moment stdin is redirected. That comment is the spec for this loop.

Installed as a shortcut in `shell:startup`, not a scheduled task. Registering a task buys a hidden
window and a *Last Run Result*, and costs a `Register-ScheduledTask` script with a principal, a
settings object and an uninstall path. The wrapper already waits for Docker, and the log is a better
record than *Last Run Result*. The Startup folder is one place to look and one file to delete.

Sign-in rather than boot either way: Docker Desktop is a desktop application that starts at sign-in,
so anything firing at boot would poll a daemon that is never coming. The point is that nothing has
to be **typed**, not that nobody has to sign in.

### Part 3 — one origin, so there is nothing to communicate

The SPA calls `fetch('/api/campaign')`. The browser resolves that relative URL against whatever
origin served the page, and the web container proxies `/api/*` to the api over the Docker network.

```text
browser                          web container (:3082)          api container
   │                                    │                             │
   ├─ GET  /                    ──────► Caddy: serve /srv/index.html  │
   ├─ GET  /assets/app.js       ──────► Caddy: serve /srv/assets/…    │
   │                                    │                             │
   └─ fetch('/api/campaign')    ──────► Caddy matches /api/*          │
        resolves against the page's     strips the prefix             │
        own origin — same origin ✓      └─ GET api:3081/campaign ───► Fastify
                                                                      │
   ◄──────────── JSON, same origin ─────◄──────── JSON ───────────────┘
```

Why this rather than a config value delivered some other way:

- **`api:3081` is Docker's internal DNS name and the container-internal port.** It is not
  `${API_PORT}` — that only publishes a *host* port for `curl` and the e2e suite, and the proxy hop
  never touches it. The one number that was going to travel does not exist on any wire the browser
  can see.
- **The browser only ever dials 3082**, which is `window.location.port`. The port question answered
  by removing the second port rather than communicating it.
- **Same origin means no CORS.** Not "CORS configured correctly": no preflight, no
  `access-control-allow-origin`, no `LAN_ORIGIN` regex in the path.
- **Agnostic with zero configuration.** localhost, the `.local` name, a raw address, a real domain,
  https, behind someone else's reverse proxy — all identical, one image, no rebuild. A runtime
  config endpoint still has to be *told* the port; this has nothing to tell.
- §6.1 already says the api serves the built SPA in production. This is that idea with the proxy on
  the other side, and it keeps the 2026-09-01 ruling intact: `web` still serves a build, not a dev
  server.

`web` and `api` sit in different profiles, and compose refuses `depends_on` across profiles — but
they share the project network, so the DNS name `api` resolves whenever both run. Unchanged from
today, and `start-full.cmd` already orders them. With the api down, `/api/*` answers 502 and the SPA
reports failed resources, which is both correct and far more legible than the CORS error the same
outage produces now.

**What falls out:** nothing outside the DM's machine needs port 3081 any more, so it binds to
loopback the way Postgres already does. The firewall then needs 3082 only, plus Gitea's two.

## Phases

Per `test-filter-development`: RED with the failure output captured, GREEN, then a seeded mutant.
Evidence lands in `planning/evidence/` as `.txt` — `validate:plans` demands frontmatter of every
`.md` under `planning/`, and transcripts should not have to carry it.

| # | Phase | RED | Mutant that must be caught |
|---|---|---|---|
| 1 | Restart policies | `smoke.sh` step asserting `docker inspect` reports `unless-stopped` for api/runner/web and `no` for runner-tests/migrate. Fails today — evidence captured. | Drop `restart:` from `web.yml`; smoke must FAIL. |
| 2 | Gateway base | `fetching.test.ts` asserts the fetch URL is `/api/campaign` with `VITE_API_LIVE=true`, and that fixtures answer without it. Fails today — it stubs `VITE_API_URL` and expects an absolute origin. | Return `'/'` instead of `'/api'`; the URL test must FAIL. |
| 3 | The proxy | A smoke step that `curl`s `:3082/api/health` and expects the api's `{"status":"ok"}` — not `index.html`. Fails today; there is no proxy. | Remove `uri strip_prefix /api`; the api answers 404 and the step must FAIL. |
| 4 | `autostart.cmd` | Run with the stack `down` → all five healthy, log written. Run with Docker stopped → waits rather than exiting 1. | Swap `ping` for `timeout`, run with redirected stdin; the wait must visibly break. |
| 5 | End to end | Restart the Docker daemon; all five return with nothing typed. Then a real Windows reboot. | — |

Phase 3's mutant is the one to be careful about. `try_files {path} /index.html` means *any*
unmatched path returns the SPA with a 200, so a broken proxy looks like a working server. The
assertion has to be on the response **body**, never the status.

## Dependencies

None outside this repository. Docker Desktop already auto-starts.

Step 5's LAN check needs the learner's laptop, which is why it becomes a `verify` reminder rather
than a checkbox somebody ticks optimistically.

## Files expected to change

| File | Change |
|---|---|
| `infra/compose/api.yml` | restart policies; api port to loopback |
| `infra/compose/web.yml` | restart policy; delete `build.args` |
| `infra/smoke.sh` | restart-policy step, proxy step |
| `infra/autostart.cmd` | new |
| `infra/install-autostart.ps1` | new — Startup shortcut and firewall rules |
| `infra/README.md` | auto-start section, port table, delete the stale "Windows gap" block |
| `pyquest/apps/web/Caddyfile` | new |
| `pyquest/apps/web/Dockerfile` | Caddy serving stage; `VITE_API_URL` out, `VITE_API_LIVE` in |
| `pyquest/apps/web/vite.config.ts` | dev proxy for `/api` |
| `pyquest/apps/web/src/gateway/index.ts` | `apiBase()` returns `/api` |
| `pyquest/apps/web/src/gateway/fetching.test.ts` | stubs `VITE_API_LIVE`, expects a relative URL |
| `pyquest/apps/web/src/fixtures/index.ts` | comments naming `VITE_API_URL` |
| `.gitignore` | `infra/logs/` |

## Out of scope

- **The learner's Gitea account, SSH key and first clone** — stub
  `gitea-lan-access-for-the-son_2026-08-27` owns them. This plan opens the ports; it does not hand
  out the remote.
- **Deleting the api's CORS handling.** Vestigial for the SPA, not wrong. Host-mode dev and direct
  calls still use it.
- **Surviving a reboot with nobody signing in.** Needs Docker Engine as a Windows service or
  auto-logon. §6.4's availability is an *arrangement* — the machine stays on, signed in, locked.
- **Rebuilding images at boot.** `autostart.cmd` starts what exists. A boot that rebuilds is a boot
  a bad commit can take down, and slow every morning. `bounce.cmd` stays the deploy path.
- **Rewriting §6.1.** The proxy satisfies "one origin, one port" in effect. Whether the spec sentence
  should now name the proxy instead of `@fastify/static` is a separate argument.
