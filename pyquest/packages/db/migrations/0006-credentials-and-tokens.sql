-- 0006 — who may ask, and what proves it.
--
-- `planning/**/feature_accounts-and-auth_2026-08-30.md` Phase 1. Three tables, and the names are
-- the first decision rather than an afterthought.
--
-- **Nothing here is called `sessions`.** Migration 0004 already owns that word and it means a
-- *teaching* session — a Saturday morning, attended or forgiven, with a `scheduled_for` date. Two
-- unrelated meanings one letter apart in one schema is how somebody joins the wrong table at ten
-- at night. The token store is `api_tokens`.
--
-- **No credential lives on `players`.** Reading a player is the most common query in the api, and
-- a hash on that row is a hash in every result set that ever selects `*`. Its own table means a
-- player can be read without a secret coming with it.
--
-- **No email, no date of birth, no recovery question.** §6.5: no age gate, and nothing he writes
-- leaves the house. Reset is the DM's act at the Console (§6.8), which is why there is nothing
-- here to send a link to. Every field this schema does not have is a field that cannot leak.

-- The password, as a verifier rather than as a password.
--
-- `hash` holds a self-describing string — algorithm, parameters, salt and derived key — so the
-- cost can be raised later without a migration and without a column that says which scheme each
-- row used. See `packages/db/src/auth.ts`; the format is that module's and this table only stores
-- it.
--
-- One row per player and the primary key says so. A player with two passwords is a player whose
-- old one still works, which is exactly what a reset must not leave behind.
CREATE TABLE player_credentials (
  player_id  uuid        PRIMARY KEY REFERENCES players (id) ON DELETE CASCADE,
  hash       text        NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  -- Set on every successful password change, so the Console can say when it last happened.
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- A bearer token, stored as a digest of itself.
--
-- **The token is never stored.** `token_sha256` is a digest, so a copy of this table is not a
-- ring of keys: an attacker holding it still cannot present a token, because the digest is not
-- the credential. The plaintext exists exactly once, in the response to `POST /api/session`.
--
-- `expires_at` is a column rather than a policy in code so that expiry survives the api being
-- restarted, and so a token can be revoked by deleting the row. §6.4 puts this api on a household
-- LAN over plain HTTP: the expiry is what limits how long a token that was overheard is worth
-- anything, and it is the honest half of a posture that is otherwise "nobody is listening".
CREATE TABLE api_tokens (
  token_sha256 text        PRIMARY KEY,
  player_id    uuid        NOT NULL REFERENCES players (id) ON DELETE CASCADE,
  created_at   timestamptz NOT NULL DEFAULT now(),
  expires_at   timestamptz NOT NULL,
  -- What asked for it. Not identity — a label a person can recognize in a list of live tokens.
  label        text        NULL
);
-- No CHECK that `expires_at` is after `created_at`, and its absence is deliberate. Postgres
-- applies a CHECK to updates as well as inserts, so that constraint would forbid the one
-- operation an expiry column is most useful for: revoking a live token by expiring it now. The
-- rule it was reaching for — a token is only good while unexpired — is enforced where it belongs,
-- in `playerForToken`'s WHERE clause, on every single read.

-- Signing out everywhere, and the Console's "who is signed in" list, both read by player.
CREATE INDEX api_tokens_player_idx ON api_tokens (player_id);

-- The one way in, for the household that has nobody in it yet.
--
-- Somebody has to be first, and the first account cannot be created by an authenticated DM
-- because there is no DM. A script writes a secret here and prints it once; presenting it claims
-- the DM seat.
--
-- **It is a table and not an endpoint.** An api that hands out a bootstrap secret is an api that
-- hands out the household. The secret arrives by somebody running a script on the machine the
-- api runs on, which is a permission the filesystem already models.
--
-- **Single-use, and `consumed_at` is how.** A secret that can be spent twice is a second way in
-- that nobody remembers leaving open. The one-row idiom is 0004's, and the reason is the same:
-- two live bootstrap secrets is not a state this household has any use for.
CREATE TABLE bootstrap_secret (
  id           boolean     PRIMARY KEY DEFAULT true CHECK (id),
  secret_sha256 text       NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  -- Null until spent. Non-null is a permanent record that it was used, and when.
  consumed_at  timestamptz NULL,
  -- The player it created, so the record says what the secret bought.
  claimed_by   uuid        NULL REFERENCES players (id) ON DELETE SET NULL,
  -- Spent and claimed are one fact, so they are written by one statement.
  --
  -- This wanted to be DEFERRABLE, because the claim looks like two moments: consume the secret,
  -- then record the player it made. Postgres does not defer a CHECK, and being told so was the
  -- better answer — `claimBootstrap` now creates the player *first* and consumes the secret in a
  -- single UPDATE that sets both columns. That UPDATE's own WHERE is what makes the secret
  -- single-use, and a caller who loses the race rolls back the player it had speculatively made.
  CONSTRAINT bootstrap_secret_claim_matches_consumption
    CHECK ((consumed_at IS NULL) = (claimed_by IS NULL))
);
