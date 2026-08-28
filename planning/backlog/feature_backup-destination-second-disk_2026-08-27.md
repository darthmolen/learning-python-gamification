# The Backup Destination Is Not Yet a Second Disk

**Status:** Backlog
**Date Discovered:** 2026-08-27
**Discovered During:** `planning/in-progress/feature_phase0-tier0-foundation_2026-08-27.md`, Wave 1

## Context

Spec §6.9 specifies a dated tarball "on a second disk", and names why: the Journal and his
commit history become irreplaceable quickly and are the two artifacts this project cannot
regenerate.

The backup and restore scripts are built, and the restore is rehearsed and verified — both
artifacts came back out of a tarball by exact content. But `BACKUP_DEST` defaults to
`/c/pyquest-backups`, because **this machine currently has one disk** (C:, 384 GB free).

That default survives an accidental `rm -rf`, a bad migration, and a container that eats its own
volume. It does not survive the disk failing, which is the case §6.9 is actually written for.
`infra/README.md` says so plainly rather than implying coverage that does not exist.

## Known Scope

- An external drive, a NAS path, or a cloud target
- Point `BACKUP_DEST` at it and re-run the restore rehearsal against that path
- Schedule the nightly job, which is also not yet automated — the script exists and runs, but
  nothing calls it on a timer

## Trigger for Promotion

**Before week 3**, which is when the Journal starts accumulating entries that cannot be
regenerated. Spec §6.9 already sets that deadline for the restore rehearsal; this is the other
half of the same requirement.
