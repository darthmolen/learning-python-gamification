# Journal — the first entry

Read this out loud before he writes entry 1. Once, at the end of session 1. It never
needs reading again.

---

## What to say

> "Last thing tonight, and it takes five minutes.
>
> You are going to keep a log. One entry every session, for the whole year. Three
> questions, every time: what you built, what broke, and what you would do differently.
>
> It is worth ten XP an entry, and it is paid for what is *in* it, not for the fact that
> it exists. 'Did turtle, it was fine' is worth zero and I will say zero. I am not being
> harsh — an entry with nothing in it is worth nothing to you in six weeks, and six weeks
> from now is who you are writing it for.
>
> Here is the actual reason. In about a month there is a boss fight, and the night
> before it you are going to reread everything you wrote tonight and since. You will
> find it easy. That feeling — reading your own writing from a month ago and finding it
> obvious — is the best proof you will ever get that you are getting better at this.
> Nothing else gives you that. Not a score, not a badge, not me telling you.
>
> Write it in your own words. I am never going to correct your spelling in it."

Then leave him alone to write it. Do not hover, do not suggest, do not read over his
shoulder while he types.

---

## The first entry's prompts

Copy `TEMPLATE.md` to `journal/entries/session-01.md` and let him work through it.

If he is stuck on **what I built**, these are legal nudges — they are questions about the
session, not about what to write:

- "What was the first thing you typed that made something happen?"
- "What did you change, and what happened when you did?"
- "Which of the three files did you spend longest on?"

If he is stuck on **what broke**, and he says nothing broke, one push only:

- "What about the first time you typed `turtle`? Did you get it right first time?"
- "Did the window ever go somewhere you didn't expect?"
- "Was there anything you expected to work that didn't?"

If he says nothing broke after that, let it go and write your reply about it instead.
Pushing twice turns this into homework, and homework dies.

If he is stuck on **what I would do differently**, this is the hardest one and it is
acceptable for the first entry to be thin here. One nudge:

- "If you started tonight again from scratch, knowing what you know now, what would you
  do first?"

---

## Your reply, that same evening

Written under the line in the same file, before he goes to bed. Non-negotiable — a
Journal nobody answers becomes a diary, and a diary becomes an unfilled form.

Reply to the **content**. Ask one real question about something he wrote. Tell him
something true about your own week that connects to it — you got an error today too, and
you can say which one.

From Area 2a this becomes a comment on a commit in Gitea, and from there it is code
review. Starting the habit now, in a plain file, means the tooling arrives to a habit
that already exists rather than the other way round.

---

## Where the entries live

```
journal/
  TEMPLATE.md          copy this each time
  entry-01-prompt.md   this file
  entries/
    session-01.md
    session-02.md
    ...
```

In Area 0 this is a folder on the learner's machine and nothing more. In Area 2a it becomes a git
repository, and these first six entries become its first real commit — which is a much
better first commit than an empty README, and is the reason the Journal starts here
rather than waiting for the tooling the spec schedules for week 3.
