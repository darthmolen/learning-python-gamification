"""Put `curriculum/lib/` on the import path so the tests import `world` the way
the learner does -- `import world`, with the file sitting beside his own code.

pytest inserts the *test* directory on `sys.path`, not its parent, so without
this the suite would only pass by accident of where it happened to be run from.
"""

import sys
from pathlib import Path

LIB = Path(__file__).resolve().parent.parent
if str(LIB) not in sys.path:
    sys.path.insert(0, str(LIB))
