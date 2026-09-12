---
kind: stub
status: open
date: 2026-09-10
---

# The curriculum types `ls` at a learner who is on Windows

**Status:** Backlog
**Date Discovered:** 2026-09-10
**Discovered During:** the Practice 0 dry run, the evening before it was first taught

## Context

The learner's machine is Windows. The curriculum tells them to type `ls`, `pwd`, `cp` and
`rm -rf`, none of which are Command Prompt commands — and two of which are worse than merely
absent:

- **`ls` and `pwd` "work" in PowerShell** as aliases for `Get-ChildItem` and `Get-Location`, so a
  learner who happens to open PowerShell gets output and a learner who opens Command Prompt gets
  `'ls' is not recognized`. Same instruction, two outcomes, and the failure looks like they typed
  it wrong.
- **`rm -rf scratch` fails in PowerShell**, because `rm` is aliased to `Remove-Item`, which has no
  `-rf`. It is not a missing command; it is a present command that refuses the flags, which is a
  much more confusing error for somebody in week six.

## Known scope

Measured 2026-09-10. **Concentrated almost entirely in Area 2**, which is the git and toolchain
area — Areas 0, 1 and 3 are Python at a terminal and barely touch the shell.

Learner-facing files carrying POSIX commands:

```text
curriculum/area-2/lesson.md
curriculum/area-2/practices/practice-2/w2_the_first_commit.md
curriculum/area-2/practices/practice-3/w3_the_log_as_a_story.md
curriculum/area-2/practices/practice-4/w4_push_and_prove_it.md
curriculum/area-2/practices/practice-5/w5_where_the_file_actually_goes.md
curriculum/area-2/practices/practice-6/w6_a_real_editor.md
curriculum/area-2/practices/practice-7/w7_its_own_python.md
```

Rough counts across the curriculum: 27 × `ls`, 16 × `pwd`, 6 × `rm -rf`, 3 × `cp`, 3 × `cat`,
1 × `mv`. DM-facing files (`dm-guide.md`, the practice plans) are **not** in scope — the DM runs
Git Bash, and `pack.sh` is a POSIX script that requires it.

**Already converted**, because they were needed before this stub could wait:
`curriculum/area-0/practices/practice-0-a-machine-of-your-own.md` and
`curriculum/area-2/practices/practice-1/w1_the_folder_that_remembers.md`.

## The decision this needs first

**Which shell does the learner use?** The sweep is mechanical once that is answered and
guesswork until it is.

- **Command Prompt** — `dir`, `cd`, `copy`, `rmdir /s /q`, `dir /a`. What the two converted files
  now assume. Simplest to teach, no profile, no execution policy.
- **PowerShell** — the Windows 11 default, and the aliases make `ls` and `cd` read naturally. But
  the flags diverge (`rm -rf` is the trap above) and `python` resolves differently there, which
  `tools/python/README.md` already records as a live hazard.
- **Git Bash** — installed anyway since git became install #1, and every POSIX command in the
  curriculum would simply be correct. Against it: it is a fourth thing to explain in week one,
  and §6.4's whole argument is that the learner's machine should be ordinary.

**A cheaper answer than converting anything: pick a shell and say so once, at the top of Area 2.**
The commands are only wrong relative to a shell nobody named. Naming Git Bash would make the
existing text correct as it stands.

## Trigger for Promotion

**Week 6, when Area 2a is first taught** — that is the first evening a learner types a shell
command that is not `py -3.14`. Before then it costs nothing, and the decision above is worth
making calmly rather than at the keyboard.
