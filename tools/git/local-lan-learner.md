# A learner's repository on the LAN Gitea

**A learner's machine, plus one DM step. Needed week 6, Area 2a.**

[`tools/git/`](../git/) installs the client and says the remote is a separate decision.
This is that decision taken the intended way: **Gitea on the DM's machine, reached over the
home network**. It is the only option that satisfies §6.4 — push is the verification
mechanism — and the only one legal for Boss 2, which needs the code to reach a genuinely
different machine.

Four steps, end to end: create the repository, clone it, add a file, push it back.

---

## The ports come from `infra/docker-compose.yml`

Not from Gitea's defaults, and not from what the container prints:

```yaml
    ports:
      # LAN-reachable on purpose: §6.4, learners push from their own machines.
      - "${GITEA_HTTP_PORT:-3080}:3000"
      - "${GITEA_SSH_PORT:-3022}:22"
```

| | Host port | Container | Used for |
|---|---|---|---|
| HTTP | **3080** | 3000 | The web UI, the API, and `http://` clone URLs |
| SSH | **3022** | 22 | `ssh://` clone URLs, once a key is loaded |

Both bind on **all interfaces** — deliberately, unlike Postgres on `127.0.0.1:5433`. Both
are overridable in `infra/.env`; if that file disagrees with the table, `.env` wins.

**3080 is not 3000 and 3022 is not 22.** Every URL below carries its port, and a clone URL
without one is a clone URL that will not work. HTTP is the path this page uses throughout:
it needs no key on the learner's machine, which is the whole difference between a week-6
session that runs and one that spends itself on `ssh-keygen`.

---

## Before any of this: the host has to be reachable

Two things are true of a fresh stack, and neither is a bug in it:

1. `GITEA_DOMAIN=localhost`, so the clone URLs Gitea *advertises* are correct only on the
   machine hosting it. Confirmed by asking the API for a new repository's URLs:

   ```
   "clone_url":"http://localhost:3080/<learner>/<repo>.git"
   "ssh_url":"ssh://git@localhost:3022/<learner>/<repo>.git"
   ```

   A learner who copies that out of the web UI is copying a URL that points at their own
   laptop.

2. Windows Firewall has no inbound rule for 3080 or 3022. Measured on the DM's machine,
   with the stack healthy:

   ```
   LAN 3080       -> 000     (never reached the server)
   localhost 3080 -> 200
   ```

   All three firewall profiles are on and neither port is opened, so the failure is the
   same from any other machine on the network.

Both are the standing backlog item
[`feature_gitea-lan-access-for-the-son_2026-08-27.md`](../../planning/backlog/feature_gitea-lan-access-for-the-son_2026-08-27.md).
**Clear it before the session, not during it.** On the DM's machine:

```sh
# 1. Find the host's LAN address
ipconfig | grep "IPv4"

# 2. Point Gitea at it — infra/.env
GITEA_DOMAIN=<host>
GITEA_ROOT_URL=http://<host>:3080/

# 3. Apply. The value is baked into the URLs Gitea displays.
cd infra && docker compose up -d
```

Then open the ports, scoped to the local subnet — an elevated PowerShell, run knowingly:

```powershell
New-NetFirewallRule -DisplayName "PyQuest Gitea HTTP" -Direction Inbound `
  -Protocol TCP -LocalPort 3080 -RemoteAddress LocalSubnet -Action Allow
New-NetFirewallRule -DisplayName "PyQuest Gitea SSH" -Direction Inbound `
  -Protocol TCP -LocalPort 3022 -RemoteAddress LocalSubnet -Action Allow
```

`-RemoteAddress LocalSubnet` is the part that matters. This is a home network service with
a password on it; it has no business answering anything further away.

Prove it from **the learner's machine**, before the session:

```sh
curl http://<host>:3080/api/healthz     # {"status":"pass", ...}
```

`<host>` is that LAN name or address throughout the rest of this page.

---

## 1. Create the repository

§7 gives the learner the naming: *one repository for all their projects, and they choose
the name.* It is the cheapest large dose of autonomy the week has. The DM creates the
account; the learner supplies `<repo>`.

Once, per learner, on the DM's machine:

```sh
cd infra
docker compose exec --user git gitea gitea admin user create \
  --username <learner> --email <learner>@localhost --password '<password>'
```

`--user git` is not optional — the Gitea CLI refuses to run as root, and `exec` defaults to
root.

Then the repository itself. **In the web UI** at `http://<host>:3080` is the better version
of this step: the learner signs in, clicks New Repository, and types a name they picked. The
API does the same thing without ceremony:

```sh
curl -X POST "http://<host>:3080/api/v1/user/repos" \
  -u '<learner>:<password>' \
  -H 'Content-Type: application/json' \
  -d '{"name":"<repo>","private":true,"auto_init":true,"default_branch":"main"}'
```

`auto_init` writes a README and a first commit, so the clone in step 2 arrives with
something in it rather than with Git's empty-repository warning — one less thing to explain
on the day. `default_branch: "main"` matches what a modern `git init` picks locally; leave
the two disagreeing and the first push invents a second branch.

**No hooks, no CI, no linter on a learner's repository** — §7, and `tools/git/` says why.

## 2. Clone it

On the learner's machine, in whatever directory their work lives:

```sh
git clone http://<host>:3080/<learner>/<repo>.git
cd <repo>
```

Type that URL rather than copying it out of the web UI, unless `GITEA_DOMAIN` has already
been set to the LAN name — the UI shows whatever `GITEA_DOMAIN` says, which is `localhost`
out of the box.

Git asks for the username and password once. On Windows, Git Credential Manager stores it,
and every later push is silent.

## 3. Add a file

```sh
touch hello.py
```

Then put something in it, because an empty file makes a commit that teaches nothing:

```sh
echo 'print("it pushed")' > hello.py
git add hello.py
git commit -m "first push from my own machine"
```

## 4. Push

```sh
git push origin main
```

```
To http://<host>:3080/<learner>/<repo>.git
   43732e1..af89b06  main -> main
```

Two hashes and an arrow. That line is the whole point of Area 2a: the code is now on a
different machine, and §6.4 is satisfied — *if you did not push it, it did not happen.*

---

## What proves it works

Not the absence of an error on the learner's machine. **Ask the server**, from the DM's
machine:

```sh
curl -u '<learner>:<password>' \
  "http://localhost:3080/api/v1/repos/<learner>/<repo>/contents/hello.py"
```

A JSON body naming `hello.py` and carrying a `sha` means the file is on the host. Without
curl: open `http://<host>:3080/<learner>/<repo>` in a browser and read back the commit
message the learner wrote.

## Exercised, not assumed

All four steps above were run end to end against the live stack on 2026-08-30 — repository
created, cloned, `hello.py` committed, pushed, then confirmed present through the API by
name and sha. The throwaway account and repository were deleted afterwards.

**One qualification, because it is the one that matters:** that run went over `localhost`,
on the host itself. The LAN leg is exactly what "Before any of this" measures as still
closed. The commands are right; the network in front of them is not open yet.

## Things that go wrong

| Symptom | Cause | Fix |
|---|---|---|
| Hangs, or `Could not resolve host`, from the learner's machine | Firewall closed, or `<host>` is wrong | The two checks in "Before any of this" |
| The clone URL in the web UI says `localhost` | `GITEA_DOMAIN` is still `localhost` | Set it, then `docker compose up -d` |
| `Connection refused` on 3000 or 22 | Those are container ports | Use 3080 and 3022 |
| `warning: auto-detection of host provider took too long (>2000ms)` | Credential Manager probing an unknown host for GitHub-style auth | Harmless — the push still lands. Silence it with `git config --global credential.http://<host>:3080.provider generic` |
| `LF will be replaced by CRLF` | Windows line endings | Harmless. Do not send a learner down this road in week 6 |
| `gitea admin` refuses to run | `exec` ran as root | `--user git` |
