"""The Growing Spiral.

Fill in the body. Run costs nothing -- it happens in your browser. Submit sends it to the
server, which has tests you cannot read (spec §6.3).

A plain script, no `def`. Orders one under the other, the way every Area 1 file is written.
"""

import turtle

# 1. Keep a running total of ink, starting at 0, BEFORE any loop.
# 2. Three arms. For each arm:
#       twelve lines. The first is 10 long and each one after is 5 longer.
#       turn left 90 after every line, and add its length to the total.
#    Then turn left 120 before the next arm.
# 3. At the very end, print exactly one line:   Ink used: <total>

turtle.done()
