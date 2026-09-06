-- 0007 — the practice spine's one progress row.

-- A practice is the unit of work; a session is the unit of time (ADR 0007). This table holds
-- the first and has nothing to do with the second.
--
-- **It is not `sessions` and could not be.** That table is keyed `scheduled_for date UNIQUE`,
-- is household-wide with no `player_id` at all, and its own comment settles the case: "two
-- sittings in a day are one session with a longer note." A practice is untimed by construction
-- — which is precisely why it is not called a session — so it cannot share a row with a
-- calendar date, and it must not feed §5.9's streak, which counts days.
--
-- **The tick gates nothing.** §5.2 lets him clear any three quests he chooses, §361 invites him
-- at a boss early, and the Tome promises every page is open from day one. Nothing reads this
-- back except the checkbox that wrote it. It is deliberately absent from the bundle the engine
-- consumes, so that it cannot quietly start deciding something later.
--
-- **It is scaffolding, and named as such** (ADR 0004). It is the game's own bookkeeping about a
-- game and it dies with the game, which is the right outcome for a scoreboard. The durable
-- record of a practice having happened is the journal entry, in the learner's own repository.
--
-- A manual tick is also the only honest mechanism available. A practice happens at a kitchen
-- table, out loud, with another person; the application cannot observe it, and a derived tick
-- would be the app inferring something it has no evidence for.
CREATE TABLE practice_progress (
  player_id    uuid        NOT NULL REFERENCES players (id) ON DELETE CASCADE,
  -- The eight areas of §3. Constrained here as well as in the contract because a row naming
  -- area 9 is a bug that outlives the process that wrote it.
  area         smallint    NOT NULL CHECK (area BETWEEN 0 AND 7),
  -- 1-based, matching `curriculum/area-<n>/practices.yml`. Not a foreign key: the spine lives
  -- in git and this database deliberately holds no content (§6.7).
  practice_n   smallint    NOT NULL CHECK (practice_n > 0),
  completed_at timestamptz NOT NULL DEFAULT now(),
  -- One tick per practice per player. Ticking twice is idempotent rather than an error, which
  -- is what lets the checkbox be a checkbox instead of a transaction.
  PRIMARY KEY (player_id, area, practice_n)
);
