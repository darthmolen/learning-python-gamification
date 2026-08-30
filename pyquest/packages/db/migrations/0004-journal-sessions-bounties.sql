-- 0004 — the streak, the Journal, and the bounties either player can post.

-- §5.6. One entry per session day, and the sha is what makes the entry real rather than claimed:
-- push is the verification mechanism (§6.4), so an entry that names no commit names nothing.
CREATE TABLE journal_entries (
  player_id    uuid    NOT NULL REFERENCES players (id) ON DELETE CASCADE,
  session_date date    NOT NULL,
  commit_sha   text    NOT NULL CHECK (commit_sha ~ '^[0-9a-f]{7,40}$'),
  xp_awarded   integer NOT NULL CHECK (xp_awarded >= 0),
  PRIMARY KEY (player_id, session_date)
);

-- §5.9's streak is derived from these rows and never stored.
--
-- The uniqueness on `scheduled_for` is deliberate and does not come from the spec: the streak
-- counts session *days*, so two rows for one date would let a single Saturday count twice, and a
-- streak that can be inflated by writing a row is not a streak. Two sittings in a day are one
-- session with a longer note.
--
-- `forgiven_by` is the only counter a human may adjust, and it names who did it, because a
-- forgiveness nobody signed is one nobody can discuss.
CREATE TABLE sessions (
  id            bigserial PRIMARY KEY,
  scheduled_for date      NOT NULL UNIQUE,
  attended      boolean   NOT NULL DEFAULT false,
  forgiven_by   uuid      NULL REFERENCES players (id),
  note          text
);

-- §5.8: either player posts for the other, and both pay.
--
-- The last CHECK is the one worth reading twice. A bounty with a claimant is not open, and a
-- bounty with no claimant is not anything else — writing that as an equality between two
-- booleans covers both directions in one line, so a claimed bounty cannot pretend to be open and
-- an open one cannot carry a claimant.
CREATE TABLE bounties (
  id         bigserial   PRIMARY KEY,
  posted_by  uuid        NOT NULL REFERENCES players (id),
  claimed_by uuid        NULL REFERENCES players (id),
  title      text        NOT NULL CHECK (length(trim(title)) > 0),
  xp         integer     NOT NULL CHECK (xp > 0),
  state      text        NOT NULL CHECK (state IN ('open', 'claimed', 'done', 'withdrawn')),
  posted_at  timestamptz NOT NULL DEFAULT now(),
  claimed_at timestamptz NULL,
  CONSTRAINT bounties_claim_matches_state CHECK ((state = 'open') = (claimed_by IS NULL))
);
