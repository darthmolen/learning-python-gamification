"""Broken Sigil 6 — Not a Number

Broken on purpose. Predict first, then run.

int() turns text into a number. Usually.

Run:  py -3.14 b6_not_a_number.py
"""
# concepts: reading-errors, int, str
# dc: 10
# expect: ValueError

import turtle

size = int("ten")
turtle.forward(size)

turtle.done()
