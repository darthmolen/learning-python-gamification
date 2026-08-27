# THROWAWAY — what a Tier 3 learner writes by accident: three nested loops.
from world import *
for x in range(20):
    for y in range(20):
        for z in range(20):
            place(x, y, z, 'stone')
start()
