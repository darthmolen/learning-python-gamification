# Reference — Datamine payloads

**This directory is yours, not his.** Do not copy it onto his machine.

Spec §5.5 defines **Datamine**: after two genuine attempts and one written sentence
about what he tried, he may unlock the reference solution. It is a legal, named, costed
move — not cheating, and not a failure. Shame produces hiding, and hiding destroys your
signal about what he actually knows.

These are the payloads for the Area 1 exercises most likely to need one.

## The rules that come with using one

Unchanged from Area 0, plus one addition at the end that is specific to loops.

1. **Two genuine attempts first.** Not two minutes of staring. Two attempts.
2. **One written sentence** in the Journal about what he tried. This is the price and
   it is not optional, because it is the part that does the teaching.
3. **Show him the whole thing**, not a drip-feed. A half-revealed answer is the worst of
   both.
4. **Ask him to explain it back.** If he cannot, he has not received it.
5. **Invasion that concept next session, and again the session after.** §5.5 guarantees a
   review at +3 days and +10 days. Do it by hand; there is no engine yet.
6. **Make him change a number in it.** New for Area 1, and it costs fifteen seconds. A
   loop he has read and a loop he has steered are different amounts of understanding,
   and only one of them survives to next week.

## What is here

| File | Unlocks | Notes |
|---|---|---|
| `r3_the_shrinking_line.py` | `s3e2` choice (c) | Two values changing at two rates in one `while` |
| `r5_the_gatekeeper.py` | `s5e3` task 4 | The ladder decides; the loop draws. A bool with a job |
| `r7_the_rosette.py` | `s7e3` choices (a) and (b) | The outer counter used, and band edges that survive a dial change |
| `r8_the_ink_budget.py` | `s8e3` choices (b) and (c) | Two stop conditions, and the `and`/`or` swap that catches everyone |
| `r9_mandala.py` | Session 9 | A complete, honest mandala. Whole, or not at all |
| `session-6-answers.md` | The six broken loops | Read before session 6, not during |

Every one of these carries the same header tags as the exercises and is run by the same
harness. They are checked code, not sketches.

**`r9_mandala.py` uses nothing above Area 1.** No functions, no lists, no `random`, no
modulo. That is deliberate and it is worth saying out loud when you show it: a reference
solution that reaches for vocabulary he has not met teaches him that the good version
was out of his reach, which is the opposite of what the payload is for.

## What is deliberately not here

There is **no reference solution for any choice board**, for the polygon engine, or for
Boss 1.

Those are open-ended. There is no answer to unlock, because there is no single right
picture — and offering one would quietly convert an exercise about making something into
an exercise about guessing what the author had in mind. That is precisely the failure
spec §2.3 diagnoses in the puzzle platforms.

If he is stuck on one of those, he is not stuck on knowledge. He is stuck on scope, and
the fix is a smaller first step, not an answer.

## The Area 1 stall that is never a Datamine

**"It hangs and I do not know why."**

That is not a knowledge gap and showing him an answer will not help. It is one of three
things, every time, and the question that finds it is always the same:

> "What has to change for that condition to become false? Show me the line that changes it."

Do not spend a Datamine on it. Spend the question.

## Verifying these still run

They are covered by the area's harness along with everything else:

```
py -3.14 verify.py
```
