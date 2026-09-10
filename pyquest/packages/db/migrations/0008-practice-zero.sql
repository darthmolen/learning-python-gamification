-- 0008 — a practice may be numbered zero.

-- 0007 wrote `CHECK (practice_n > 0)` with the comment "1-based, matching
-- curriculum/area-<n>/practices.yml", and that was true of the curriculum when it was written.
-- It is not true any more: Area 0 opens with **Practice 0 — create your first repository**.
--
-- The bootstrap became a practice because it could not stay a footnote. `tools/learner-setup/`
-- delivers its payload as a branch of the learner's own repository, and the payload contains
-- `tools/git/README.md` — the instructions for installing git. Receiving the instructions
-- required git, a clone and an account on a Gitea somebody else had made reachable. The ordering
-- was not awkward, it was circular, and the way out is to admit that setting the machine up is
-- work, do it at the table, and give it the number that says *before the rest*.
--
-- Zero is legal in every area rather than only Area 0. Restricting it would be a special case in
-- the one file roughly 150 quests are authored against, and Area 3's ursina install is the next
-- honest candidate for one.
--
-- **The constraint is relaxed, not dropped.** A negative practice number is still meaningless and
-- still refused: there is no practice minus one. `packages/content/src/schema.ts` says the same
-- thing with `nonnegative()`, and `packages/contract/src/endpoints.ts` says it on the wire — a
-- row the database accepted and the loader refused would be a tick the learner could set and
-- never see again.

ALTER TABLE practice_progress DROP CONSTRAINT practice_progress_practice_n_check;

ALTER TABLE practice_progress
  ADD CONSTRAINT practice_progress_practice_n_check CHECK (practice_n >= 0);
