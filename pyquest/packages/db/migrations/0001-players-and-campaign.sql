-- 0001 — the household, the people in it, and the day it started.
--
-- Progress only. There is no `quests` table and there never will be: content lives in git
-- (§6.7), rows reference quest ids as strings, and the content validator is what guarantees
-- those resolve. A quests table here would be a second, stale copy of the curriculum.

-- `handle` is case-insensitive because a human typing it will not remember which case they
-- picked, and a second player differing only in capitalisation is not a second player.
CREATE EXTENSION IF NOT EXISTS citext;

CREATE TABLE players (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Routing and humans. Changeable, which is exactly why it is not the identity: the
  -- contract's `playerId` is `players.id`, and history does not get rewritten by a rename.
  handle       citext      NOT NULL UNIQUE,
  display_name text        NOT NULL CHECK (length(trim(display_name)) > 0),
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- Roles are a table, not a boolean. Kitchen Table mode (§5.11) is one adult holding both rows,
-- and an `is_parent` column would make every other arrangement a migration. The primary key is
-- what stops one player holding `dm` twice.
CREATE TABLE player_roles (
  player_id uuid NOT NULL REFERENCES players (id) ON DELETE CASCADE,
  role      text NOT NULL CHECK (role IN ('player', 'dm')),
  PRIMARY KEY (player_id, role)
);

-- The household's single row, and the home the campaign start date did not have.
--
-- The Area screen reads `week 10 of 48`, and a week number needs a date to count from. That date
-- is not content — content is identical for every household — and it is not per-player, since
-- both players share one campaign. It is household state, which is this database's subject.
--
-- Nothing stores the current week. It is whole weeks between `started_on` and `now`, computed by
-- the caller. A stored week number is a cached total that is wrong every Monday morning.
--
-- `id boolean primary key default true check (id)` is the one-row idiom, and the check is
-- exactly the line to delete on the day the modes backlog turns this into many.
CREATE TABLE campaign (
  id         boolean     PRIMARY KEY DEFAULT true CHECK (id),
  started_on date        NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
