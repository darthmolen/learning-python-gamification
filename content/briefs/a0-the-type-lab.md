# The Type Lab

Session 4 gave you four kinds of thing and one instrument for asking which is which:
`type(x)`. This is the four questions from the end of that session, and every one of them
is a `print` away.

**Answer by experiment.** Do not ask anybody. Write your prediction down first if you like —
being wrong on paper is how this works, and a wrong prediction you kept in your head teaches
you nothing.

## What to do

The starter prints six answers. Every one is wrong or unfinished on purpose.

1. There is a **second division operator**, one character different from `/`, and it gives a
   whole number. Find it, and fix the first two lines to use it.
2. Fix lines three and four so they report the type of the **converted** value.
   `int("120")` and `str(120)` are the conversions — what kind is each result?
3. `int("12.5")` does not work. Run it on its own and read what falls out. Replace
   `"no idea yet"` with the **name of the error**, as one word.
4. `True + True` has an answer, and it is a number. Predict it, run it, then decide whether
   you approve.

## The rule that matters

**Keep the labels exactly as they are.** Only the values after the colon change. The labels
are how this gets checked:

```text
floor division: 33
whole number division gives: <class 'int'>
```

## Done when

All six lines report what Python actually does, and `no idea yet` appears nowhere.
