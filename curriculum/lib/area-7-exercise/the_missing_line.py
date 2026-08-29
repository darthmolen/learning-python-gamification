# concepts: for, nesting, range, performance-intuition, reading-unfamiliar-code
# dc: 10
# expect: runs
"""A twenty-by-twenty-by-twenty world. Eight thousand blocks.

Nothing here is beyond Area 3. That is the point -- this is the program you
could have written in week 10, the first time you turned a loop bound up and
wanted to see how big you could go.

Run it with measure.py, which counts frames per second:

    py -3.14 curriculum/lib/area-7-exercise/measure.py

Then read README.md beside this file. It will ask you to delete one line.
"""

from world import place, start

SIDE = 20

for x in range(SIDE):
    for y in range(SIDE):
        for z in range(SIDE):
            place(x, y, z, "stone")

start()
