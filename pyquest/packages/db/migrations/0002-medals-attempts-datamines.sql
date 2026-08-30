-- 0002 — what a player did, and what it paid.

-- §6.2, exactly as it writes it: the key is (player, quest, medal), which is what makes
-- "a medal pays once" true in the data rather than in a code path somebody has to remember.
--
-- `medal` carries no CHECK on purpose. The medal names are content vocabulary — `MEDALS` in
-- `packages/content` — and a list of them here would be content in Postgres, which §6.7 forbids
-- for the same reason there is no quests table. The contract's `MedalSchema` is the validator.
CREATE TABLE quest_medals (
  player_id  uuid    NOT NULL REFERENCES players (id) ON DELETE CASCADE,
  quest_id   text    NOT NULL,
  medal      text    NOT NULL,
  -- A date, not a timestamp: the contract types `earnedAt` as an ISO calendar date and nothing
  -- orders two medals within a day.
  earned_at  date    NOT NULL,
  -- What this medal paid at the moment it was earned. §5.10 prices the delta once, and zero
  -- stays legal: at the DC floor a medal genuinely pays nothing, which reads as a brag.
  xp_awarded integer NOT NULL CHECK (xp_awarded >= 0),
  PRIMARY KEY (player_id, quest_id, medal)
);

-- Every submit, passed or not. A scar is an attempt with `passed = false` (§5.3, §3.5) and there
-- is no separate scars table to disagree with this one about how many there were.
--
-- No ON DELETE CASCADE, deliberately: scars are never deleted, so deleting a player who has any
-- is refused rather than quietly taking his history with him.
--
-- `attempted_at` is a TIMESTAMPTZ because scars are a sequence and the order within a day is the
-- whole point of them.
CREATE TABLE attempts (
  id           bigserial   PRIMARY KEY,
  player_id    uuid        NOT NULL REFERENCES players (id),
  quest_id     text        NOT NULL,
  passed       boolean     NOT NULL,
  attempted_at timestamptz NOT NULL DEFAULT now(),
  detail       jsonb
);

CREATE INDEX attempts_player_quest_idx ON attempts (player_id, quest_id, attempted_at);

-- §5.5. One Datamine per quest per player, granted after real failures, and the note is required
-- by the spec — the CHECK is what makes "required" true of an empty string too.
CREATE TABLE datamines (
  player_id       uuid        NOT NULL REFERENCES players (id) ON DELETE CASCADE,
  quest_id        text        NOT NULL,
  -- Follows the attempt that triggered it, so it is an instant rather than a day.
  unlocked_at     timestamptz NOT NULL,
  attempts_before integer     NOT NULL CHECK (attempts_before > 0),
  note            text        NOT NULL CHECK (length(trim(note)) > 0),
  PRIMARY KEY (player_id, quest_id)
);
