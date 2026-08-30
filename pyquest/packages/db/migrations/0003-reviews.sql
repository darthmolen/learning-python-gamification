-- 0003 — the §5.4 ladder, and the §5.5 guarantees that jump ahead of it.

-- `concept_id`, not `concept`: SQL is snake_case, TypeScript is camelCase, and the repository
-- maps at its boundary as it does for every other column.
--
-- The rung bound is the ladder's length. The contract restates it as `TOP_RUNG_BOUND` and the
-- engine's suite asserts the two agree; this CHECK is the third place the same number is pinned,
-- and that is deliberate — a rung past the top implies an interval that does not exist.
CREATE TABLE concept_reviews (
  player_id        uuid     NOT NULL REFERENCES players (id) ON DELETE CASCADE,
  concept_id       text     NOT NULL,
  -- The ladder counts in days, so this is a DATE.
  last_reviewed_at date     NOT NULL,
  rung             smallint NOT NULL CHECK (rung BETWEEN 0 AND 4),
  PRIMARY KEY (player_id, concept_id)
);

-- Datamine's +3 and +10 day guarantees, which are a second source `dueInvasions` merges.
--
-- The primary key makes scheduling the same review twice impossible.
--
-- **No composite foreign key to `concept_reviews`.** Tempting, and wrong. A Datamine is granted
-- when a quest is failed enough times and schedules reviews for that quest's concepts; a
-- `concept_reviews` row is written when a concept first goes onto the ladder. Nothing guarantees
-- the second happens before the first, so the FK would make a legal sequence fail at write time.
-- The engine already handles the gap — `dueInvasions` skips a forced review whose concept has no
-- ladder row — and an integration test pins that behaviour instead.
--
-- `source` is an enum of one today and exists because §5.5 is not the only thing that could ever
-- schedule a forced review. A CHECK with one value is cheaper than a migration later.
CREATE TABLE forced_reviews (
  player_id  uuid        NOT NULL REFERENCES players (id) ON DELETE CASCADE,
  concept_id text        NOT NULL,
  due_on     date        NOT NULL,
  source     text        NOT NULL CHECK (source IN ('datamine')),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (player_id, concept_id, due_on)
);
