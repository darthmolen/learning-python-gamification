# Setting up this machine

This branch was assembled by `tools/learner-setup/pack.sh` in the campaign repository and
copied here. It is transport, not a plan.

**Nothing on this page restates an instruction that lives somewhere else.** Every step points
at the file that owns it. A second copy of a checklist drifts from the first one silently,
and the person who follows the stale copy has no way of knowing they did.

The index for all of it is [`tools/README.md`](tools/README.md) — what each machine needs, in
what order, and what proves each one works.

---

## The order, and why it is this one

[`tools/README.md`](tools/README.md) gives the order and the week each install is first
needed. Two things are worth knowing before you start rather than after:

**Python is first and everything else is downstream of it.** Week 1, Area 0 session 1 opens a
REPL. And read [`tools/python/README.md`](tools/python/README.md) on `py -3.14` — on at least
one machine here, `python` means 3.12 in PowerShell and 3.14 in Git Bash, so a `pip install`
under the wrong one installs a package the other cannot see and the failure arrives much later
wearing a different face.

**Do not install VS Code early.** Week 7, not before. Area 0's DM guide is explicit: it is
Area 2b vocabulary and costs a session for no gain if it arrives ahead of time. Areas 0 and 1
want the Quest screen, or Notepad, and nothing else.

**The long pole is ursina.** `pip install -r curriculum/lib/requirements.txt` drags panda3d
down the wire. Start it, then do something else while it runs — the VS Code work below is
hands-on and the download is not.

| # | Install | Instructions | What proves it |
|---|---|---|---|
| 1 | Python 3.14 | [`tools/python/README.md`](tools/python/README.md) | `py -3.14 --version` |
| 2 | An editor | — | Notepad is genuinely sufficient until week 7 |
| 3 | git | [`tools/git/README.md`](tools/git/README.md) | `git --version`, and an identity configured **before** session 1 |
| 4 | The remote | [`tools/git/local-lan-learner.md`](tools/git/local-lan-learner.md) | a real push from this machine, landing on the host |
| 5 | VS Code + profile | [`tools/vscode/README.md`](tools/vscode/README.md) | **its §4 checklist** — see the gate below |
| 6 | ursina | [`tools/ursina/README.md`](tools/ursina/README.md) | `py -3.14 curriculum/lib/smoke.py` |

---

## The two gates

These are the steps that cannot be done anywhere but here, and both have a plan waiting on
them. Everything above is an install; these two are measurements, and an unrecorded
measurement did not happen.

### Gate 1 — the VS Code profile is verified, not merely imported

[`tools/vscode/README.md`](tools/vscode/README.md) §3 installs it, **§4 is the gate.**

Work §4 line by line and do not skim it. **Half the strip is not settings.** Activity bar,
minimap, breadcrumbs, status bar, tabs and git integration travel in the JSON; Outline,
Problems, Source Control, Testing and Extensions are view visibility, which VS Code keeps in
`globalState`, and the hand-authored file's `globalState` is empty because there was no editor
to capture it from.

So the profile gets you most of the way and **cannot** get you all the way. Import it, hide
the remaining five views by hand, work the whole checklist, then re-export over
[`tools/vscode/pyquest-area2.code-profile`](tools/vscode/pyquest-area2.code-profile). That
re-export is what turns the directory from a plan into an artifact. Without it the gate is
open and Area 2 is not ready to be taught.

Then open one real exercise in it and use it, rather than admiring it:
[`curriculum/area-2/exercises/session-2/motto.py`](curriculum/area-2/exercises/session-2/motto.py),
which is the file §4's `py -3.14 motto.py` line means.

### Gate 2 — the ursina framerate on this machine

```sh
py -3.14 -m pip install -r curriculum/lib/requirements.txt
py -3.14 curriculum/lib/smoke.py          # seven checks; needs a real display
py -3.14 tools/ursina/stress.py           # four sizes, two modes, eight runs
```

`smoke.py` first. It asserts the pin, this file and the installed version all agree — if it
fails, anything measured afterwards is measuring the wrong engine.

Then [`tools/ursina/stress.py`](tools/ursina/stress.py), which reports steady-state fps at
1,000 / 2,500 / 5,000 and 8,000 blocks, fused through the shim and naive. Its timing method
is the spike's, so its numbers are comparable with the ones in
[`spikes/ursina-tier3/README.md`](spikes/ursina-tier3/README.md) — and those came off an
RTX 5090, which is exactly why they do not answer the question for a laptop.

**The figure that decides something is 5,000 blocks, fused.**

- **≥ 60 fps** — the ~5,000-block authoring cap stands, and Area 3 exercises can be written
  against a measured number.
- **below 60** — the cap comes down *before* Area 3 content is authored to it, and the number
  that does hold 60 becomes the new cap.

A dependable way to tell the shim is doing its job: naive mode should be dramatically worse at
every size. If the two columns are close, `combine()` is not running and the number is not the
number.

---

## What goes back

Fill in [`RESULTS.md`](RESULTS.md), commit on this branch, push.

That is not bookkeeping. Both gates exist because a claim about another machine is not
evidence: *"measured and recorded rather than assumed"*, and *"an artifact that has only been
authored has not been verified"*. A gate you passed and did not write down is a gate somebody
re-opens in three months, because nothing in the repository says otherwise.

Blank answers are worth committing too. "Did not get to it" and "went badly" look identical
from the other machine, and they are not the same thing.
