# Gitea Is Not Yet Reachable From the Son's Laptop

**Status:** Backlog
**Date Discovered:** 2026-08-27
**Discovered During:** `planning/in-progress/feature_phase0-tier0-foundation_2026-08-27.md`, Wave 1

## Context

Spec §6.4 makes `git push` the verification mechanism: the API runs on the parent's machine, the
son codes on his own, so his code reaches the server the only way code travels between machines.
*If you did not push it, it did not happen.*

Gitea is up and healthy, with HTTP on 3080 and SSH on 3022 bound to all interfaces. But
`GITEA_DOMAIN` is still `localhost`, so the clone URLs Gitea advertises are only correct on the
machine hosting it. The son's laptop cannot use them, and Windows Firewall has not been opened for
either port.

Nothing is wrong with the stack. This is the last mile between "the service runs" and "the other
person in the house can reach it", and it is invisible until someone tries.

## Known Scope

- Set `GITEA_DOMAIN` / `GITEA_ROOT_URL` to the host's LAN name or static address
- Firewall rules for 3080 and 3022, scoped to the local subnet
- Create his account and his repository (spec §7 — one repository for all his projects, and he
  chooses the name; it is the cheapest large dose of autonomy available)
- His SSH key, generated on his machine
- Verify by cloning and pushing **from the son's laptop**, not from the host

## Trigger for Promotion

**Area 2a, weeks 6–7** — The Scribe's Rite, whose win condition is that he pushes and the board
updates by itself. Worth doing earlier and opportunistically, since it needs his laptop in reach,
which the two outstanding Ursina measurements also do.
