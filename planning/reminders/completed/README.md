# Closed reminders

A reminder lands here once its `**Status:**` is `done` or `dropped` and its `**Closed:**`
line says what happened. Nothing is ever deleted — a reminder that was raised and answered is
the only record that somebody looked.

## Why a directory and not just a status

The VS Code extension globs `planning/reminders/*.md` — **one level, not recursive**
(`src/store.ts`). So a file moved in here leaves the active list without any change to the
extension, and without the list growing until it stops being read. That is the whole
mechanism: the status is the truth, and the directory is what keeps the truth short.

It also means **no `.md` file belongs in `planning/reminders/` that is not a reminder.** A
README at that level would be globbed, fail to parse, and show up as a malformed entry. That
is why this file is in here rather than one directory up.

## Closing one

Use the extension — it writes both lines and prompts for the note. Then move the file here.

The note is the part worth caring about. `**Status:** done` says a box was ticked;
`**Closed:** <date> — <what happened>` is the sentence somebody reads in three months when
they wonder whether the thing was ever really checked. Two of the notes in here record that
the instructions were wrong rather than the machine, which is not something a tick could have
carried.
