# `infra/` — the PyQuest stack

Postgres and Gitea, per spec §6.1. Backups and a rehearsed restore, per §6.9.

This pass ships only the two services that need no code of ours. `api`, `runner`, and `web`
are specified in §6.1, reserved in `docker-compose.yml`, and deliberately not implemented —
none of them can exist before the code they run does.

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

## Ports

| Service | Host port | Container | Bound on | Why |
|---|---|---|---|---|
| postgres | **5433** | 5432 | `127.0.0.1` only | Only the `api` talks to it, and the `api` runs on this machine. |
| gitea HTTP | **3080** | 3000 | all interfaces | §6.4 makes `git push` the verification mechanism; the son pushes from his own laptop. |
| gitea SSH | **3022** | 22 | all interfaces | Same reason. |
| *(reserved)* api | 3081 | — | — | Not yet implemented. |
| *(reserved)* web | 3082 | — | — | Not yet implemented. |

**Postgres is on 5433, not 5432, on purpose.** This machine already runs an unrelated
`ec-postgres` container on 5432. All six ports above were probed free before being chosen, and
all sit below the Windows ephemeral range (49152+) so they cannot collide with a transient
outbound socket.

Every port is overridable in `.env`.

### Letting the son reach Gitea

`GITEA_DOMAIN=localhost` works for the parent's browser and for `smoke.sh`, but the son cannot
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
attempt, every Journal entry, and every commit the son has pushed. There is no undo except a
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
be rehearsed once before week 3, because the Journal and the son's commit history are the two
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
| Registration disabled | Two players, both provisioned by the parent. |
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
