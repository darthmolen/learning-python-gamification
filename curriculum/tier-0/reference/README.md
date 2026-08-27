# Reference — Datamine payloads

**This directory is yours, not his.** Do not copy it onto his machine.

Spec §5.5 defines **Datamine**: after two genuine attempts and one written sentence
about what he tried, he may unlock the reference solution. It is a legal, named, costed
move — not cheating, and not a failure. Shame produces hiding, and hiding destroys your
signal about what he actually knows.

These are the payloads for the Tier 0 exercises most likely to need one.

## The rules that come with using one

1. **Two genuine attempts first.** Not two minutes of staring. Two attempts.
2. **One written sentence** in the Chronicle about what he tried. This is the price and
   it is not optional, because it is the part that does the teaching.
3. **Show him the whole thing**, not a drip-feed. A half-revealed answer is the worst of
   both.
4. **Ask him to explain it back.** If he cannot, he has not received it.
5. **Patrol that concept next session, and again the session after.** §5.5 guarantees a
   review at +3 days and +10 days. Do it by hand; there is no engine yet.

## What is here

| File | Unlocks | Notes |
|---|---|---|
| `r5_ask_and_draw.py` | `s5e1` tasks 3 and 4 | Colour input, side count, computed total turn |
| `r6_nameplate.py` | Commission A | A complete, honest Tier 0 nameplate |
| `session-3-answers.md` | The seven broken sigils | Read before session 3, not during |

## What is deliberately not here

There is **no reference solution for the choice boards**, for `s1e1`, for `s2e2`, or for
Commissions B and C.

Those are open-ended. There is no answer to unlock, because there is no single right
picture — and offering one would quietly convert an exercise about making something into
an exercise about guessing what the author had in mind. That is precisely the failure
spec §2.3 diagnoses in the puzzle platforms.

If he is stuck on one of those, he is not stuck on knowledge. He is stuck on scope, and
the fix is a smaller first step, not an answer.

## Verifying these still run

They are covered by the tier's harness along with everything else:

```
py -3.14 verify.py
```
