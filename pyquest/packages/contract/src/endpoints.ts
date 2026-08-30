/**
 * The wire surface — routes, request bodies, and the error shape. Owned by the `api` track.
 *
 * Empty on purpose, and empty is the point. `feature_api-and-runner` owes this package a route
 * table, the bodies its handlers parse, and one error shape; that plan cannot start while those
 * would land in a file `db` is also editing. So the file exists before its contents do, with an
 * owner, so that the work can begin without a merge conflict being the first thing it meets.
 *
 * It carries no `export {}` and no placeholder type. A marker export would be one more thing to
 * delete before real work starts, and this file's whole job is to have nothing in the way.
 *
 * What belongs here:
 *
 * - The route table — path, method, and the payload each returns, drawn from `payloads.ts`.
 * - Request bodies: what Submit posts, what a journal entry carries, what a Defend answer sends.
 * - One error shape, shared by every route. Not one per handler — a client that must learn a new
 *   failure shape per endpoint will parse none of them.
 *
 * What does not: response payloads (`payloads.ts`, owned by `main`), row shapes (`progress.ts`,
 * owned by `db`), and anything the other two would also need, which belongs in `primitives.ts`
 * and is a conversation with `main` rather than a local edit.
 *
 * When the first shape lands here, `index.ts` gains one line to re-export this module. That is
 * the single edit to a `main`-owned file this split could not remove, because a file with no
 * exports is not a module and cannot be re-exported from.
 */
