-- 0005 — the queue the API and the runner share (§6.6).
--
-- The column definitions are `planning/feature_api-and-runner_2026-08-28.md`'s appendix, because
-- the queue's shape follows from how Submit works and that is the api plan's subject. This is the
-- migration for that one definition; there is not a second one.
--
-- `status` carries the STORAGE states. `claimed` is a worker having taken the row, and the
-- client-facing translation — `claimed` reads as `running` — lives in the api's `JobState`,
-- not here. A row shape that does not mirror the row is a second definition of the table.
--
-- `payload` carries identifiers, never content: the submitted code (which is progress and belongs
-- here) plus the quest id, the verifier type and the repository-relative path to the tests. The
-- hidden tests themselves stay in git, and the runner reads them from the content root it already
-- mounts. Putting them here would be content in Postgres and a stale copy besides.
CREATE TABLE runner_jobs (
  id               bigserial   PRIMARY KEY,
  player_id        uuid        NOT NULL REFERENCES players (id),
  -- Resolved against content, not a foreign key (§6.7).
  quest_id         text        NOT NULL,
  -- Set when the attempt row is written, which is after the job has a verdict.
  attempt_id       bigint      NULL REFERENCES attempts (id),
  status           text        NOT NULL CHECK (
                                 status IN ('queued', 'claimed', 'passed', 'failed', 'timed-out', 'killed')
                               ),
  payload          jsonb       NOT NULL,
  -- Test output, truncated to the runner's output cap.
  result           jsonb       NULL,
  -- The same union the api's error shape uses.
  error_code       text        NULL,
  created_at       timestamptz NOT NULL DEFAULT now(),
  claimed_at       timestamptz NULL,
  -- Worker identity, for stuck-job forensics.
  claimed_by       text        NULL,
  -- A claimed job past this is reclaimable. The lease is what stops a worker that died mid-job
  -- from parking a submission forever, which an 11-14-year-old experiences as "the button did
  -- nothing."
  lease_expires_at timestamptz NULL,
  attempts_made    smallint    NOT NULL DEFAULT 0 CHECK (attempts_made <= 3)
);

-- Claiming orders by `created_at` within `status`. A sequential scan is fine at two players; the
-- index is here because it is the kind of thing nobody revisits and it costs nothing now.
CREATE INDEX runner_jobs_queue_idx ON runner_jobs (status, created_at);
