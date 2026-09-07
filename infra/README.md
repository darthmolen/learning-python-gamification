# `infra/` — the PyQuest stack

Postgres and Gitea, per spec §6.1. Backups and a rehearsed restore, per §6.9.

`api`, `runner` and `web` live in `compose/`, one fragment per track, and are profile-gated —
see [The compose fragments](#the-compose-fragments--who-owns-what) and
[Running the whole stack](#running-the-whole-stack).

---

## Quick start

```sh
cd infra
cp .env.example .env
# edit .env: replace every CHANGEME, and generate a real secret key:
docker run --rm gitea/gitea:1.27.2 gitea generate secret SECRET_KEY

docker compose up -d
./smoke.sh          # asserts the stack actually came up and the restore works
```

Gitea's first-run wizard is skipped (`INSTALL_LOCK=true`); every setting it would have asked
for comes from `.env`. There is nothing to click.

Create the two real accounts once the stack is healthy:

```sh
docker compose exec --user git gitea gitea admin user create \
  --admin --username <parent> --email <parent>@localhost --password '<password>'
docker compose exec --user git gitea gitea admin user create \
  --username <son> --email <son>@localhost --password '<password>'
```

`--user git` is not optional. The Gitea CLI refuses to run as root, and `docker compose exec`
defaults to root.

---

## The compose fragments — who owns what

`docker-compose.yml` holds only the two services that need no code of ours, postgres and
gitea. Everything that runs our code lives in `compose/`, one file per track:

| Fragment | Services | Owned by | Profile |
|---|---|---|---|
| `compose/api.yml` | `api`, `runner` | the `api` track | `--profile api` |
| `compose/migrate.yml` | `migrate` | the `db` track | `--profile migrate` |
| `compose/web.yml` | `web` | the `spa` track | `--profile web` |

**Every fragment is profile-gated, so `docker compose up` still means postgres and gitea.**
Ask for more by name:

```sh
docker compose --profile web up web
```

The split exists because three plans each needed to add a service to one file, and
`plan-workflow` only lets plans run in parallel when their file sets are disjoint. They
would have queued behind each other over a YAML file rather than over any real dependency.
A fragment each removes the collision instead of scheduling around it.

**If you are adding a service, add it to your track's fragment, not to
`docker-compose.yml`.** The root file is `main`'s, and after this split nothing else should
need it. A fragment named in `include:` that does not exist fails immediately and by name,
which is why all three were created at once rather than arriving with the code they run.

The images in the fragments are pinned by tag *and* digest, the same as the root file, for
the same reason: this campaign runs ~48 weeks and a floating tag that drifts mid-campaign is
a real failure mode here, not a hypothetical one.

---

## Running the whole stack

In the order you type it, from `infra/`:

```sh
docker compose up -d                                  # 1. postgres and gitea
docker compose --profile migrate run --rm migrate     # 2. schema, safe to repeat
npm run seed --workspace @pyquest/db                  # 3. from pyquest/ — somebody to be
docker compose --profile api --profile web up -d api runner web
```

Then open **<http://localhost:3082>**. The API is on **<http://localhost:3081>**; `curl
http://localhost:3081/health` answers `{"status":"ok","items":23}` and touches no database, so
it stays true while Postgres restarts.

Step 3 is the `db` track's seed script. Without it the database has a schema and no rows, and
the SPA's player-scoped screens answer `404` — **which is not a failure of the wiring**: an empty
campaign and a failed fetch look different, and a 404 from `/api/players/.../campaign` means the
browser reached the API.

### What makes the browser talk to the API

**Nothing, and that is the design.**

The SPA asks for `/api/...` — a relative URL — and `apps/web/Caddyfile` in the `web` container
serves the build and proxies `/api/*` to `api:3081` over the compose network. The SPA and the api
answer on **one origin**, so the browser resolves the api's address to whatever host it already
used to load the page.

Open the SPA at `localhost:3082`, at this machine's LAN name, at its raw address, or one day at a
real domain over https: every one of those works, simultaneously, from the same image, with nothing
configured and no rebuild.

`api:3081` in the Caddyfile is Docker's internal DNS name and the container-internal port. It is
**not** `${API_PORT}` — that publishes a host port for `curl` and the e2e suite, and the proxy hop
never touches it. The port the api listens on is never on a wire the browser can see, which is why
there is nothing to keep in sync.

This replaced `VITE_API_URL`, which Vite inlined into the bundle at build time. Its value was
`http://localhost:3081` — correct in exactly one browser, the one on this machine. §6.4 puts the
api here and the learner's code on his own laptop, so the SPA served to him told **his** browser to
call **his** localhost. No value could have been right for both machines; the answer turned out not
to be a better value but no value.

`VITE_API_LIVE` is what remains, and it is a **boolean**. Fixtures-versus-live is a property of the
*build*, which is what build-time env is for; an address is a property of the environment, and
there is no longer anywhere to put one. Only `apps/web/Dockerfile` sets it. Absent — `npm run dev`,
`vitest` — the gateway answers from fixtures, which is how the SPA is developed on a train with no
database and how `vitest run --project web` stays hermetic. Do not add it to `.env`: nothing would
read it.

CORS no longer sits on the SPA's path at all. `corsOrigin` in `apps/api/src/server.ts` stays for
host-mode dev and direct `curl` and is still correct, but same origin means no preflight and no
`access-control-allow-origin` to get wrong.

### Reaching it from the learner's laptop

§6.4 puts the api here and the code on his machine, so the browser is often not on this host.

There is **no address to configure** — see above. One thing is left, and it is the firewall:

```powershell
# elevated, once. Installs the sign-in autostart too.
powershell -NoProfile -ExecutionPolicy Bypass -File infra\install-autostart.ps1
```

That opens 3082 and Gitea's 3080/3022 inbound, scoped to the Private profile and the local subnet.
It deliberately does **not** open 3081: the api is loopback-only, and his browser reaches it
through the proxy on 3082.

Then open `http://<this-machine>:3082` from his laptop. If the `.local` name does not resolve from
there, the raw address works immediately and with no rebuild — the SPA follows whatever host
reached it. Pair a `hosts` entry with a DHCP reservation on the router, or the address in it goes
stale.

> **Do not try to verify this from this machine.** Under mirrored networking, every non-loopback
> address for *this* machine times out from *this* machine, firewall or no firewall — and there is
> a second firewall you will not find in `wf.msc`. Read "Mirrored networking" under Windows notes
> before diagnosing anything here; a timeout on this box is not evidence of a blocked port.

### It says the api is down

In order of how often it is the answer:

1. **`--profile api` is not up.** The web container proxies to `api:3081`; with nothing behind it,
   `/api/*` answers **502** and the SPA reports failed resources. That is deliberate — a screen
   silently showing fixtures when you asked for live data is the worse failure — and a 502 is far
   easier to read than the CORS error this same outage used to produce.
2. **Nothing is seeded.** See step 3 above. `404` on player routes, `200` on `/api/tome`.
3. **The file server answered instead of the api.** Check the content type, never the status:

   ```sh
   curl -s -o /dev/null -w '%{content_type}\n' http://localhost:3082/api/tome
   # application/json  -> the api answered
   # text/html         -> it fell through to the SPA fallback
   ```

   The Caddyfile's `try_files` fallback returns **200** for anything unmatched, so the SPA can own
   its client-side routes — which means a broken `handle /api/*` block still answers 200 to every
   api call and looks healthy to a status check. `smoke.sh` step 4e asserts the content type for
   exactly this reason, and a seeded mutant confirmed it: `status=200 type=text/html`.

To develop the SPA against fixtures, do not run the container — run `npm run dev --workspace
@pyquest/web` from `pyquest/`. `VITE_API_LIVE` is unset there, so the gateway answers from
fixtures. That path is checked: with the api process killed outright, the gateway still answered
every call from fixtures.

## Ports

| Service | Host port | Container | Bound on | Why |
|---|---|---|---|---|
| postgres | **5433** | 5432 | `127.0.0.1` only | Only the `api` talks to it, and the `api` runs on this host. |
| gitea HTTP | **3080** | 3000 | all interfaces | §6.4 makes `git push` the verification mechanism; learners push from their own machines. |
| gitea SSH | **3022** | 22 | all interfaces | Same reason. |
| api | **3081** | 3081 | `127.0.0.1` only | Nothing off this machine dials it: `web` is its front door and proxies over the compose network. What is left is `curl`, `npm run e2e` and `smoke.sh`, all of which run here. |
| web | **3082** | 3082 | all interfaces | The one port a browser uses. It serves the SPA *and* carries `/api/*` to the api, so §6.4's other machine needs this and nothing else. |

**Postgres is on 5433, not 5432, on purpose.** This machine already runs an unrelated
`ec-postgres` container on 5432. All six ports above were probed free before being chosen, and
all sit below the Windows ephemeral range (49152+) so they cannot collide with a transient
outbound socket.

Every port is overridable in `.env`.

### Letting other machines reach Gitea

`GITEA_DOMAIN=localhost` works for a browser on this host and for `smoke.sh`, but nobody else can
push to `localhost`. Before handing out the remote, set `GITEA_DOMAIN` and `GITEA_ROOT_URL` to
this machine's LAN name or IP and `docker compose up -d` to apply — the value is baked into the
clone URLs Gitea displays. You will also need a Windows Firewall rule for 3080 and 3022.

---

## Everyday commands

```sh
docker compose up -d          # bring the stack up
docker compose ps             # health status
docker compose logs -f gitea  # follow a service
docker compose stop           # stop, keep containers and volumes
docker compose down           # remove containers, KEEP volumes  <- the normal teardown
docker compose down -v        # remove containers AND DESTROY ALL DATA
```

`down -v` deletes `pyquest_postgres_data` and `pyquest_gitea_data`. That is every quest
attempt, every Journal entry, and every commit any learner has pushed. There is no undo except a
backup.

---

## Backups — §6.9

```sh
./backup.sh                   # writes to $BACKUP_DEST from .env
./backup.sh -d /e/elsewhere   # or override the destination
```

Each run writes `pyquest-backup-<timestamp>.tar.gz` containing:

| Member | What it is |
|---|---|
| `globals.sql` | role definitions — a dump restored without its roles restores as the wrong owner |
| `<progress>.dump` | `pg_dump -Fc` of the progress database (the Journal lives here) |
| `<gitea>.dump` | `pg_dump -Fc` of Gitea's metadata |
| `gitea-repositories.tar` | a `git clone --mirror` of every repository |
| `MANIFEST` | timestamp, repository count, and the exact image digests |

Repositories are mirrored with `git clone --mirror` rather than copied out of the volume. A
mirror is a real, self-contained git repository: it can be inspected and cloned with `git log`
alone, without Gitea running or even installed. That property is what makes the restore
rehearsal below mean something.

Anything older than `BACKUP_RETENTION_DAYS` (default 30) is pruned on each run.

`backup.sh` refuses to run unless both services report healthy. A tarball produced from a
half-started stack is worse than no tarball: it looks like a backup in the directory listing and
restores to nothing.

### Put it on a second disk

`BACKUP_DEST` defaults to `/c/pyquest-backups`, which is **the same physical disk as the Docker
volumes**, and that defeats the purpose. A same-disk backup survives `rm -rf`, a bad migration,
and a `down -v`; it does not survive the disk failing, which is the failure §6.9 exists to
cover. This machine currently has only one drive (C:), so this needs an external drive, a
second internal disk, or a NAS path before it counts as a backup.

In Git Bash, `/d/pyquest-backups` means `D:\pyquest-backups`.

### Scheduling it nightly

§6.9 says nightly. Register it with Task Scheduler:

```powershell
$sh = "C:\Program Files\Git\bin\sh.exe"
$action  = New-ScheduledTaskAction -Execute $sh `
    -Argument '-lc "/c/dev/learning-python-gamification/infra/backup.sh"'
$trigger = New-ScheduledTaskTrigger -Daily -At 2am
Register-ScheduledTask -TaskName "PyQuest nightly backup" -Action $action -Trigger $trigger `
    -Description "pg_dump + gitea repository mirrors, 30-day retention (spec 6.9)"
```

Confirm it produced a tarball the next morning. A scheduled job nobody has ever seen succeed is
not a backup either.

---

## Restoring — and rehearsing it

**A backup that has never been restored is a hope, not a backup.** §6.9 requires the restore to
be rehearsed once before week 3, because the Journal and a learner's commit history are the two
artifacts this project cannot regenerate.

### The rehearsal (safe, non-destructive — run this monthly)

```sh
./restore.sh /c/pyquest-backups/pyquest-backup-20260827T183925.tar.gz --scratch
```

Restores into throwaway `pyquest_scratch` and `gitea_scratch` databases and unpacks the
repository mirrors into a temp directory, then reports users, repositories, commit counts, and
each mirror's `HEAD`. Nothing live is touched. Clean up with:

```sh
./restore.sh --drop-scratch
```

This works because the dumps are custom-format (`-Fc`), so `pg_restore` can load them into a
database with a different name. No second Postgres server is needed to rehearse.

### The real thing (destructive — for the day the disk dies)

```sh
./restore.sh <tarball> --live
```

Drops and recreates the progress and Gitea databases, stops Gitea, replaces
`/data/git/repositories` from the mirrors, and restarts. It requires typing a confirmation
phrase. Anything written since the tarball was taken is lost.

If the volumes are gone entirely, `docker compose up -d` first — the stack rebuilds itself from
`.env` alone — then run the live restore.

---

## `smoke.sh` — the composition check

```sh
./smoke.sh            # against the current stack
./smoke.sh --clean    # destroy volumes first, prove a cold first boot
```

Compose files are **configuration**, which `test-filter-development` names as an explicit
exception to unit-test discipline. Unit-testing YAML measures nothing. The useful assertions are
the ones YAML cannot promise, so `smoke.sh` checks:

1. every healthcheck reaches **healthy** — not "starting", not "restarting"
2. Gitea's schema really lives in the shared Postgres, in a `gitea`-owned database, with exactly
   one Postgres container in the project (§6.1)
3. Gitea answers on its mapped host port
4. a real repository with a real commit can be created, and the bare repo exists on disk
5. `backup.sh` produces a readable dated tarball containing all five members
6. `restore.sh` restores it into scratch databases and **the exact commit and the exact
   Journal row come back**
7. it cleans up the account and stand-in table it created

This is not decoration. Every one of those failed at least once while it was being written. Step
1 caught a Gitea container that `docker compose config` had just pronounced valid and that was
crash-looping on a port conflict.

To confirm the check still bites, break something and watch it fail:

```sh
printf 'services:\n  gitea:\n    environment:\n      GITEA__database__HOST: no-such-host:5432\n' > mutant.yml
COMPOSE_FILE="docker-compose.yml;mutant.yml" ./smoke.sh   # must exit 1 at step 1
rm mutant.yml
```

---

## Windows notes

Everything here is POSIX `sh` and **must be run from Git Bash**, not PowerShell or `cmd`. The
scripts need `sh`, `curl`, `git`, `tar`, and `base64`; Git for Windows supplies all five. WSL is
not required.

Two Git Bash behaviours cost real debugging time and are worth knowing before they bite:

- **Path mangling.** Git Bash rewrites any bare argument that looks like an absolute POSIX path
  into a Windows one, so `docker compose exec gitea git --git-dir=/data/...` arrives inside the
  container as `C:/Program Files/Git/data/...`. Wrap container-side paths in `sh -c "..."`,
  where they are just string data, or prefix the command with `MSYS_NO_PATHCONV=1`.
- **Line endings.** A `.sh` file saved with CRLF fails inside a Linux container with a confusing
  `\r: not found`. `.gitattributes` in this directory pins `*.sh` and `*.yml` to LF.

### Mirrored networking — `localhost` works, the LAN name does not

This machine runs WSL in **mirrored** mode (`networkingMode=mirrored` in `%USERPROFILE%\.wslconfig`),
and it changes two things that will otherwise waste an evening.

**Only IPv4 loopback is mapped into the WSL VM.** From *this* machine every non-loopback address for
*this same machine* times out — including its own LAN address, its `.local` name, and `[::1]`:

| From this machine | |
|---|---|
| `http://localhost:3080` | 200 |
| `http://127.0.0.1:3080` | 200 |
| `http://devastator-2025.local:3080` | times out |
| `http://192.168.4.102:3080` | times out |
| `http://[::1]:3080` | times out |

**This says nothing about other machines.** A timeout here is the host-loopback limitation, not a
firewall refusal, and the learner's laptop is on a completely different path. The only test that
answers "can he reach it" is *his laptop*. Do not conclude anything from a timeout on this box —
that mistake was made on 2026-09-06 and produced a confident, wrong diagnosis of a firewall problem.

The fix, if you want the LAN name usable from here too, is one line in `%USERPROFILE%\.wslconfig`
under `[wsl2]`, then `wsl --shutdown`:

```ini
hostAddressLoopback=true
```

**There is a second firewall, and it is not in `wf.msc`.** In mirrored mode inbound traffic to
container-published ports is governed by the **Hyper-V firewall**, whose default inbound action is
`Block`. Windows Firewall rules — the ones `install-autostart.ps1` creates — are correct and worth
having, and they are not what admits the learner's laptop. Both matter, and only one of them is
visible where you would look:

```powershell
# the one you will not find in wf.msc
Get-NetFirewallHyperVVMCreator                       # WSL's VMCreatorId
Get-NetFirewallHyperVRule -VMCreatorId '{...}' |
  Select-Object DisplayName, Enabled, Action, Protocol, LocalPorts
```

`netstat` on the Windows host shows **no listener** for 3080/3081/3082 in this mode, because the
listeners live in the WSL VM. That is normal and is not evidence of a stopped stack.

---

## Design decisions the spec left open

| Decision | Why |
|---|---|
| Postgres on host **5433** | 5432 was already taken on this machine by an unrelated container. |
| Postgres bound to **loopback**, Gitea to **all interfaces** | Only the api needs Postgres, and it is local. Gitea must be LAN-reachable or §6.4 does not work. |
| Images pinned by **tag *and* digest** | A 48-week campaign gives a floating tag many chances to drift. Even patch tags like `16.15-alpine` move when the base image is rebuilt. Same class of problem as the Ursina pinning backlog item. |
| `git clone --mirror` rather than a volume copy | A mirror is verifiable with `git log` alone, which is what makes the rehearsal a real check rather than a file-size comparison. |
| Custom-format (`-Fc`) dumps | Lets `pg_restore` target a differently-named database, which is the only reason a non-destructive scratch rehearsal is possible on one server. |
| `pg_dumpall --globals-only` included | Roles are not in a per-database dump; a restore without them fails on ownership. |
| Scratch rehearsal is the **default** mode of `restore.sh` | The safe mode should be the one you get by accident. |
| Gitea Actions enabled but no runner | §6.5 and the §9 roadmap want it; enabling the section now costs nothing and needs a registered `act_runner` before it does anything. |
| Registration disabled | Two players, both provisioned by the DM. |
| `START_SSH_SERVER=false`, **stated not omitted** | See below. |

### Why `START_SSH_SERVER` is written out explicitly

The `gitea/gitea` image already runs OpenSSH on container port 22 and wires it to Gitea through
`AuthorizedKeysCommand`. Setting `START_SSH_SERVER=true` starts Gitea's *built-in* Go SSH server
as well, the two fight over `:22`, and the container crash-loops with `bind: address already in
use`.

It is set to `"false"` rather than left out because `app.ini` is written into the `gitea_data`
volume on first boot, and Gitea's `environment-to-ini` only overwrites keys that are **present**
in the environment. Deleting the line does not restore the default — it freezes whatever the
volume already holds. Several settings in `docker-compose.yml` are spelled out for the same
reason.

---

## Changing the Gitea database credentials

`initdb/01-create-gitea-db.sh` runs **only on the very first boot**, when the `postgres_data`
volume is empty. Postgres ignores `/docker-entrypoint-initdb.d` entirely once the data directory
exists. Editing `GITEA_DB_*` in `.env` afterwards will not migrate anything — Gitea will simply
fail to authenticate.

To rotate the password on an existing stack:

```sh
docker compose exec -T postgres psql -U "$POSTGRES_USER" -d postgres \
  -c "ALTER ROLE gitea WITH PASSWORD 'the-new-password';"
# then update GITEA_DB_PASSWORD in .env and:
docker compose up -d gitea
```

---

## Secrets

`.env` is gitignored at the repo root and must never be committed. `.env.example` is committed
and contains only `CHANGEME` placeholders.

The backup tarball contains full database dumps, including Gitea's user table and its hashed
passwords. It is not encrypted. Treat `BACKUP_DEST` as sensitive — if it is a NAS or an external
drive that leaves the house, encrypt it.

`GITEA_SECRET_KEY` signs sessions and encrypts stored tokens. Changing it invalidates every
session and every stored OAuth token, so generate it once and keep it.

## No command — starting at sign-in

The stack is supposed to be there without anybody remembering it. Two mechanisms, because one is
not enough:

| Mechanism | Covers | Does not cover |
|---|---|---|
| `restart: unless-stopped` on every long-running service | the daemon restarting, and a reboot | a container that was **removed** — which `docker compose … down` does — and migrations |
| `infra\autostart.cmd`, from the Startup folder | everything, including a cold start and the migration job | a machine nobody signs in to |

Install both:

```powershell
# elevated, once. Firewall rules need administrator; the shortcut does not.
powershell -NoProfile -ExecutionPolicy Bypass -File infra\install-autostart.ps1

# and to undo it
powershell -NoProfile -ExecutionPolicy Bypass -File infra\install-autostart.ps1 -Uninstall
```

It writes a shortcut to `autostart.cmd` into `shell:startup` (runs minimized) and opens the LAN
ports. It refuses to run from a git worktree, because a Startup shortcut into one points at a
directory that vanishes when the branch merges — that mistake was made once already.

`autostart.cmd` waits up to 300s for the Docker daemon, runs `start-full.cmd` into
`infra\logs\autostart.log` (previous boot kept as `autostart.prev.log`), and on failure raises a
desktop notification naming that log. It waits with `ping`, never `timeout`: `timeout` reads the
console and dies on redirected stdin, which is exactly what a Startup shortcut hands it.

**Sign-in, not boot.** Docker Desktop is a desktop application and starts when a user signs in, so
a boot-time trigger would poll a daemon that is never coming. §6.4's availability is an arrangement
— the machine stays on, signed in, locked — and the goal is that nothing has to be *typed*, not
that nobody has to sign in.

### Why this exists

On 2026-09-06 `api`, `runner` and `web` all exited 255 at the same instant — the Docker daemon
stopping, not a crash; the api's last log line was a healthy `/health` 200 — and stayed down, while
postgres and gitea came back because only they carried a restart policy. Nothing noticed until
somebody opened the SPA. `smoke.sh` step 4d now asserts the policy on each container, reading
`docker inspect` rather than the compose file: the policy is baked into a container's `HostConfig`
at **create** time, so editing YAML without `--force-recreate` leaves a stale container behind a
correct-looking file.

## One command

```
infra\start-full.cmd
```

postgres and gitea, then the migration job to completion, then api, runner and web — each waited
for until its healthcheck passes. **It exits non-zero if anything is wrong**: a missing `.env`, a
failed migration, or a service that never reaches healthy. `docker compose up -d` returns success
the moment a container is *created*, which is also true of one that then crash-loops, and a start
script that reports success while the api is dying is worse than no script at all.

Then claim the DM seat, because nobody can sign in until somebody does:

```
infra/bootstrap.sh              # ONE TIME ONLY — prints the secret once
infra/bootstrap.sh --status     # safe any time; writes nothing
```

Paste it into the SPA's sign-in screen under *"Setting this up for the first time?"*.

The script exists only to assemble `DATABASE_URL` out of `.env` so nobody has to remember the
connection string. **The secret is the only thing on stdout** and every other line goes to stderr,
so `infra/bootstrap.sh | clip` puts it on the clipboard and nothing else.

It is single-use: spending it creates the DM, and after that the script refuses to arm another —
re-arming a consumed bootstrap beside an existing DM is a second way in that nobody remembers
leaving open. Every account after the first is made from the Console.

## Pushing a change into the running stack

```
infraounce.cmd api        # or web, or migrate
```

Rebuilds that profile's images and recreates **only** its own containers. This is the local loop
the household has instead of CD: §6.4 puts the api on the parent's machine, so "deploy" means the
container on this desk restarts. Nothing is pushed to a registry and there is none.

Two things it does deliberately:

- **It names its services** rather than inferring them. `docker compose --profile api up` starts
  every service in that profile *and every service with no profile*, so postgres and gitea would
  come up too — `--no-deps` does not prevent that, because they are unprofiled rather than
  dependencies.
- **`--no-deps`**, so bouncing the api does not restart Postgres underneath it. A dependency is
  something to wait for at startup, not something to recycle when a route handler changes.

## Two things that will bite

**A broken proxy answers 200.** `apps/web/Caddyfile` ends in `try_files {path} /index.html` so the
SPA owns its own routes and `/area/3/quest/a3-recipe-book` survives a reload. That fallback catches
*everything* unmatched — so if the `handle /api/*` block is broken or missing, every api call gets
the SPA shell with a **200 status**, and any check reading status codes calls the stack healthy.
Assert on the content type. `smoke.sh` step 4e does; a seeded mutant returned `status=200
type=text/html`, which is precisely the shape of the trap.

*(This section used to warn that `VITE_API_URL` was baked into the bundle at build time. It no
longer exists — the SPA derives the api from the origin that served it. See "What makes the browser
talk to the API".)*

**An old `runner_spool` volume keeps its old ownership.** Docker creates a named volume
`root:root 0755` and seeds it from the image only when it is *first* created. The api and the
runner are both non-root, so a volume made before 2026-09-01 is unwritable by either:

```
docker volume rm pyquest_runner_spool
```

once, after which it is seeded correctly from the api image. The symptom is
`EACCES mkdir /spool/incoming` in the api's log.
