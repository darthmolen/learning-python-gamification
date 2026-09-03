# Check the editor's keyboard escape hatch in a real browser

**Raised:** 2026-09-01
**Raised by:** the SPA accessibility sweep (`planning/in-progress/feature_spa_2026-08-28-v2.md`, Phase 4)
**Needs:** a person, a browser, and about two minutes
**Blocks:** the plan's "every screen operable by keyboard" criterion being fully honest

## What to do

Open the Quest screen on any `hidden-tests` quest. Click into the code editor, then:

1. Press **Tab**. It should insert indentation rather than moving focus. (Python is
   whitespace-significant; this is deliberate.)
2. Press **Escape**, then **Tab**. Focus should leave the editor and land on **Run**.
3. Tab twice more and confirm **Submit** is reachable.

If step 2 does not work, `Ctrl-m` is CodeMirror's own latching equivalent — try that, and say
which one worked.

## Why a person has to do it

**jsdom cannot express tab-focus mode.** Releasing Tab depends on the browser's own focus move
after CodeMirror declines to consume the key, and the test runner does not model it. This was
checked rather than assumed: CodeMirror's *own* `Ctrl-m` binding fails identically under vitest,
which is how we know it is the environment and not our binding.

`apps/web/src/screens/a11y.test.tsx` therefore asserts the on-screen instruction and the tab
order, and deliberately does not assert the key. This reminder is the other half.

## The bug this came out of, which is the reason not to skip it

`Editor.tsx` carried a comment saying the trade was safe because "Escape-then-Tab still leaves —
CodeMirror's own behaviour". **That is Monaco's behaviour, not CodeMirror's.** CodeMirror binds
Escape to `simplifySelection`; the real hatch is `Ctrl-m`, and nothing on screen mentioned it.

Run, Stop and Submit all follow the editor in the DOM, so for as long as that comment stood, a
learner who tabbed into the editor could not reach the button that submits his work — on the one
screen he spends an evening in. The comment was confident and wrong, and it was wrong for as long
as it took somebody to actually try it.

Escape is now bound to `temporarilySetTabFocusMode` and the screen says
*"Tab indents. Press Escape, then Tab, to move on."* **That sentence is currently a claim, and
this reminder is what turns it into a fact.**
