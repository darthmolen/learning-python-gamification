# THROWAWAY — spike probe, shimmed. Contains a DELIBERATE mistake: 'diamond' is
# not a block kind the world knows. This is what the learner sees when a Tier 3
# typo meets the engine through the shim.
from world import *

wanted = ['grass', 'stone', 'diamond']

for i in range(3):
    place(i - 1, 0, 0, wanted[i])

start()
