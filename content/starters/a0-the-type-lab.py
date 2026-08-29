"""The Type Lab — answer by experiment, then report what you found.

Session 4 gave you four kinds of thing and one instrument for asking which is
which: type(x). This quest is the four questions from the end of that session.

Every one of them is a print away. Do not ask anybody, and do not guess —
run it and find out. Write your prediction down first if you like; being
wrong on paper is how this works.

Run:  py -3.14 solution.py
"""

print("floor division:", 100 / 3)
print("whole number division gives:", type(100 / 3))
# ruff: UP003 wants `type("120")` written as `str`. Not here — asking type() what a
# literal is IS the exercise, and rewriting it hands the learner the answer.
print('int("120") is:', type("120"))  # noqa: UP003
print('str(120) is:', type(120))  # noqa: UP003
print('int("12.5") does:', "no idea yet")
print("True + True is:", "no idea yet")


# --- YOUR MOVE ---------------------------------------------------------------
# Six answers. Every line above is wrong or unfinished on purpose.
#
# 1. There is a SECOND division operator, one character different from /, and
#    it gives a whole number. Find it. Fix the first two lines so they use it.
#
# 2. Fix lines three and four so they report the type of the CONVERTED value,
#    not the type of what you started with. int("120") and str(120) are the
#    conversions. What kind is each result?
#
# 3. int("12.5") does not work. Run it on its own and read what falls out.
#    Replace "no idea yet" with the NAME of the error, as one word.
#
# 4. True + True has an answer, and it is a number. Predict it, run it, then
#    decide whether you approve. Replace "no idea yet" with the answer.
#
# Keep the labels exactly as they are. Only the values after them change.
# -----------------------------------------------------------------------------
