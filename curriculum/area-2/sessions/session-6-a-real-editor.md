# Session 6 — A Real Editor

**Concepts:** `vscode` · resurfaces `files-on-disk`, `running-scripts`
**Files:** `sessions/session-6/`
**Journal:** what the editor took away, and which one thing he wants back

**There is no quest tonight.** Five quests plus a boss is the shape of an area (§5.2) and
this is the session that does not carry one. `vscode` is tagged by Boss 2, which tags all
fourteen. That is not a gap: an editor is a tool he uses for the next six areas, and
inventing an assessment for "he opened a folder" would be a quest built to fill a row in
a table.

**Do the setup before he sits down.** Importing a profile in front of an eleven-year-old
is twenty minutes of him watching an adult read a menu.

---

## Before the session

Work `tools/vscode/README.md` §3 on his machine: **Profiles: New Profile… → name it
`PyQuest` → Copy from → Import Profile… → Select File…**, then switch to it. There is no
`Profiles: Import Profile` command; import lives inside profile creation, and this page
said otherwise until somebody typed it into a real palette.

Then look at it for one minute against §4's list.

**If some of the panels are still there** — Outline, Problems, Source Control, Testing,
Extensions — that is the re-export that has not happened yet
(`planning/reminders/follow-up_re-export-the-vscode-profile_2026-09-01.md`), not something
he did. Hide them by hand, right-click and untick, and carry on with the session. Half of
the strip is view visibility rather than settings and cannot travel in a hand-authored
file; `tools/vscode/README.md` §4 explains why in full.

The session survives either way. What it does not survive is stock VS Code with every
panel showing, which is the thing the profile exists to reject.

---

## Beat 1 — Invasion (3 minutes)

1. What has to be true about where you are standing for `py -3.14 thing.py` to work?
2. What is the difference between the REPL and a file?
3. Name two ways to find out which directory you are in.

---

## Beat 2 — The hook (8 minutes)

**Show him a normal VS Code first.** Yours, or a screenshot from the internet — icons
down the left, a minimap, breadcrumbs, a status bar, tabs, a problems panel, a
notification asking about an extension.

> "That is what everybody's looks like. How many of those do you think I use in a day?"

Then open his.

The reaction to want is the one that came back from the machine the first time this was
imported: **"much simpler."** That is the whole design intent of a stripped profile
reported in two words by the person who has to look at it.

Then say the honest thing, immediately, because a stripped tool he cannot un-strip is a
cage:

> "None of it is gone. It comes back one piece at a time, when you have something to use
> it for. And you can have all of it back in one second whenever you want —
> **Profiles: Switch Profile → Default.** I will show you."

**Show him.** Switch to the default profile, let him see the noise, switch back. A tool
he knows how to leave is a tool.

---

## Beat 3 — The work (30 minutes)

### `sessions/session-6/w6_a_real_editor.md`

- **Step 1 — open a folder, not a file.** The single most common wrong start, and worth
  getting right in the first thirty seconds. VS Code with one file open is a worse
  Notepad; with a folder open it knows where it is standing, which is last week's lesson
  in a new tool.
- **Step 2 — inventory what is missing**, and have him write down **one** thing he wants
  back and what he would use it for. That sentence is the mechanism of the whole ladder
  (`tools/vscode/README.md` §6): a rung is a quest — *show me you need it* — and never a
  setting turned back on because he asked nicely. Area 3 restores the first one.
- **Step 3 — the integrated terminal**, and the second stall: ``Ctrl+` `` opens it in the
  folder he opened, not the folder of the file he is looking at. Make him run `pwd`
  before he runs anything else. Every session from here begins with that reflex.

### Step 4 is the session, and it is four minutes long

The five steps in order, **without saving until step 4**: run it, change it, run it
again, watch it print the old answer, save, run it again.

**Do not warn him.** Let the stale run happen. The moment where he insists he changed it
and the screen insists he did not is the entire lesson, and it is worth more than any
sentence you could say instead.

Then the question, which is the one from `dm-guide.md` §4:

> "Look at the top of the editor — is there a mark next to the name? What does it mean?"

**`files.autoSave` is off on purpose and stays off.** It is written down as a decision in
`tools/vscode/README.md` §5 rather than left as a default, precisely so a later reader
does not helpfully switch it on and delete this session.

### Step 5 — the Run button

He will find it. Let him press it, then have him run the same file from the terminal, and
ask the only question that matters tonight:

> "Which Python did the button use? Which one did the terminal use? How do you know?"

He cannot answer the first one, and that is correct — the button did not tell him. **Do
not ban the button.** Rule it out for this year on the honest grounds that it hides the
one thing next session is entirely about.

### Step 6 — real work in it

Open something from session 5 and improve it. Then commit and push **from the terminal
inside the editor.** Git integration is switched off in this profile, deliberately: he
learned the commands for four sessions and the buttons arrive in Area 7 as a convenience.
Say that out loud — it lands better as a promise than as a restriction.

---

## Beat 4 — Choice board (in the work time)

- **The Tour** — find three things this editor does that Notepad cannot, and show them to
  the DM.
- **The Colours** — change the theme and the font size. It is his editor and this is the
  cheapest possible dose of that.
- **The Comparison** — switch to the Default profile, list five things that appeared, and
  switch back.
- **The Case** — write the strongest argument he can for one panel coming back early. If
  it is genuinely good, Area 3 is two weeks away and the ladder has a rule for it.
- **Something else** — anything, as long as he says what he expects first.

---

## Beat 5 — Journal (5 minutes)

Same four prompts. Tonight's entry should name **the one thing he wants back and what
for** — that is the sentence the Area 3 rung is unlocked with, and it is much better
coming out of his journal in week seven than being asked for cold in week nine.

---

## Where he will stall

See `dm-guide.md` §4. The predicted five:

1. **Runs the file and gets the old behaviour.** The number one VS Code stall in the
   world. The mark on the tab is the answer and he should find it.
2. **Opens a file rather than a folder.** Close it, open the folder, ask what appeared.
3. **The terminal is in the wrong directory.** Last week's lesson in a new place: what
   does the terminal think the current folder is?
4. **Wants the removed panels back.** Good. Which one, and what for — written down.
5. **Hunts for a Run button.** Let him press it once, then the terminal, then ask which
   one told him which Python it used.

## What you may not say

When he insists he changed the file: **do not look at his screen and tell him he did not
save.** Ask him to look at the top of the editor and tell you what is different.

When he asks why he cannot have the minimap: not "you do not need it" — **"what would you
use it for?"** If he has a real answer, write it down, because that is how the rung
ships.

When something in the profile is obviously still showing: say it is yours, not his. It is
true, and an adult debugging an editor in front of him for fifteen minutes is the session
being eaten.
