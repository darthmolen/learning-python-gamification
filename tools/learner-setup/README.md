# learner-setup — putting a machine into service, without doing it by hand again

**This is not a tool. It is the packaging**, which is why it has no row in the table in
[`tools/README.md`](../README.md): nothing here gets installed on anything.

It answers one question: *a machine needs to join the campaign — what does it get, and how
does it get there?*

## What it does

[`pack.sh`](pack.sh) reads [`manifest.txt`](manifest.txt), copies those paths into a clone of
the learner's own repository on a branch, adds [`SETUP.md`](SETUP.md) and
[`RESULTS.md`](RESULTS.md), and commits.

```sh
./pack.sh ../path/to/their-repo              # assemble and commit
./pack.sh ../path/to/their-repo --push       # and send it
```

Then, on the machine being set up:

```sh
git fetch && git checkout learner-setup
```

and read `SETUP.md`.

Re-running is safe. It updates the branch and reports what changed; if the payload has not
moved it commits nothing and says so.

## Why a branch, and not a zip

Because §6.4 makes `git push` the verification mechanism, and a machine that pulls its own
setup has already done the thing the campaign is about before it has installed anything. A zip
on a USB stick would work and would teach nothing.

It also means the results come **back** the same way. `RESULTS.md` is filled in on the machine
that was set up, committed, and pushed — so the evidence travels on the same wire as the
instructions, and there is no step where somebody reads a number aloud.

## Why the payload is a manifest and not a directory of copies

The obvious version of this directory is a folder with copies of `tools/`, `curriculum/lib/`
and the rest sitting in it, ready to hand over. That is the thing this directory deliberately
is not.

**Copies drift, and drift silently.** [`tools/README.md`](../README.md) already makes this
argument twice — it is why there is no `learner/` and `dm/` split ("the two copies would
drift"), and why [`tools/ursina/README.md`](../ursina/README.md) refuses to copy the version
pin out of `curriculum/lib/requirements.txt` ("two copies would drift and the assertion would
start lying"). A second copy of the VS Code checklist is the same mistake with more surface
area: the profile gets re-exported, the checklist gains a line, and the copy in `tools/`
does not.

So the payload is a **list of paths**, and the files stay owned by the one place that owns
them. Adding something to what a machine receives is one line in `manifest.txt`.

The same rule governs `SETUP.md`. It is a **map**, not a manual: it gives the order, says why
the order is what it is, names the two things that cannot be done anywhere but on the target
machine, and then points at the file that carries each instruction. Where it looks like it is
about to explain how to import a profile, it links to §3 instead.

## What is in the payload, in three parts

Read `manifest.txt` for the list; it is commented. The shape of it:

1. **The instructions** — `tools/`, minus this directory and minus
   [`tools/git/seed-gitea-users.sh`](../git/seed-gitea-users.sh), which runs against the
   host's containers and has no meaning on a learner's machine.
2. **What each install is verified against** — `curriculum/lib/` for ursina, one Area 2
   exercise for VS Code. An install nobody has exercised is not an install.
3. **The measuring instruments** — [`tools/ursina/stress.py`](../ursina/stress.py) and the
   spike harness its timing method comes from.

**Deliberately not carried:** the application, `infra/`, the API, the SPA, the content
pipeline. Those run on the DM's machine (§6.1). Shipping them would put a copy of the host on
a machine that should be reaching the host over the network — which is the one behaviour Area
2a exists to establish.

## Where this came from

The first run of this was done by hand, on 2026-08-30, for the two gates in `SETUP.md` — the
VS Code profile and the ursina framerate, which between them were holding
`feature_area-2-scribes-rite-and-sandbox` and `feature_world-shim` in the blocked column, and
Area 3 behind those. Doing it by hand once was how the payload got worked out. This directory
exists so that the second machine costs a command.

## Adding to it

One line in `manifest.txt`, and the file itself stays where it lives. `pack.sh` checks every
manifest entry exists **before** it copies anything, so a typo fails on the DM's machine
rather than surfacing as a missing file on somebody else's.

If a new install joins the campaign, it needs a row in [`tools/README.md`](../README.md) and a
row in `SETUP.md`'s order table — the first says what it is and which week it is needed, the
second says where it falls in a sitting. Neither should describe how to install it; that is
what the tool's own README is for.
