# Results from setting up this machine

Fill in, commit on this branch, push.

**Blank rows are worth committing.** "Did not get to it" and "tried it and it went badly" look
identical from the other machine, and they are not the same thing.

**Machine:** *(model, CPU, RAM, GPU — the fps figures below mean nothing without it)*
**Set up by:**
**Date:**

---

## The installs

| # | Install | Done | What it printed |
|---|---|---|---|
| 1 | Python 3.14 | | `py -3.14 --version` → |
| 2 | An editor | | |
| 3 | git | | `git --version` → |
| 4 | The remote | | the two hashes and an arrow from a real `git push`: |
| 5 | VS Code + profile | | see gate 1 |
| 6 | ursina | | see gate 2 |

Anything that fought back — a download that failed, an installer option that was not where the
instructions said, a command that did not exist:

---

## Gate 1 — the VS Code profile

Worked from `tools/vscode/README.md` §4. That file is the authority; tick there or here.

**Chrome, all gone** — activity bar · minimap · breadcrumbs · status bar · editor tabs ·
Outline · Problems · Source Control · Testing · Extensions:

**Function** — `ms-python.python` present and the only extension · a `.py` shows colours and
line numbers · a terminal opens in the folder that is open · `py -3.14 motto.py` runs and
prints · editing without saving leaves a dot and running picks up the **old** file ·
**Profiles: Switch Profile** returns a normal editor, and switching back restores the strip:

**Re-exported over `tools/vscode/pyquest-area2.code-profile`?** *(yes / no — if no, the gate is
not passed. The five hidden views live in `globalState` and nothing but an export captures
them.)*

**Usable, not merely installed.** One Area 2 exercise opened and worked in it. What that was
like:

Anything cramped, confusing or wrong on this screen:

---

## Gate 2 — the ursina framerate

`py -3.14 curriculum/lib/smoke.py` → **pass / fail:**

ursina version it reported: *(the pin is 8.3.0; if it is not that, stop here and say so)*

`py -3.14 tools/ursina/stress.py`

| Blocks | Fused (shim) fps | Fused startup s | Naive fps | Naive startup s |
|---|---|---|---|---|
| 1,000 | | | | |
| 2,500 | | | | |
| 5,000 | | | | |
| 8,000 | | | | |

**5,000 fused is the figure that decides something.**

- **≥ 60 fps** — the ~5,000-block authoring cap stands.
- **below 60** — the cap comes down. Say what block count *does* hold 60, because that becomes
  the new cap and Area 3 needs telling before its exercises are written.

**Sanity check on the run itself:** naive should be dramatically worse than fused at every
size. If the two columns are close, `combine()` is not running and neither column is the
answer.

What the fps number does not capture — a stutter, fan noise, heat, a window that took an
alarming time to appear:

---

## Anything else this machine wants somebody to know
