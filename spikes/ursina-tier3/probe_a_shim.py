# THROWAWAY — spike probe, shimmed. Tier 0-3 vocabulary only.
from world import *

palette = ['grass', 'dirt', 'stone']

for step in range(6):
    for depth in range(3):
        kind = palette[depth]
        place(step - 3, step - depth, 0, kind)

for height in range(4):
    place(3, height + 6, 0, 'water')

start()
