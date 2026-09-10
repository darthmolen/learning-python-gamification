import { readFileSync } from 'node:fs';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

/**
 * Read one key out of `infra/.env` — the file Compose reads, and the one place the dev api's port
 * is configured.
 *
 * **Without this the two flows disagree.** `infra/dev-stack.sh` sources that file with `set -a`,
 * so a vite it starts inherits `DEV_API_PORT`; the documented two-terminal flow starts vite by
 * hand, where nothing has sourced anything and `process.env.DEV_API_PORT` is simply undefined.
 * Change the port in `infra/.env` and the api moves while a separately launched SPA keeps
 * proxying to 3083, and every live request fails with a connection error that names nothing.
 *
 * Parsed rather than sourced because this is a config file evaluated by Node, not a shell — and
 * deliberately not `dotenv`: one key, no interpolation, no export semantics, and no dependency
 * added to the SPA for the sake of a number. A missing file is not an error. `infra/.env` is
 * gitignored, so a fresh clone has none, and a SPA that refused to configure itself because the
 * *infrastructure* was not set up would be wrong — the fallback below is the documented default.
 */
function fromInfraEnv(key: string): string | undefined {
  try {
    const text = readFileSync(new URL(`../../../infra/.env`, import.meta.url), 'utf8');
    const match = new RegExp(`^${key}=(.*)$`, 'm').exec(text);
    return match?.[1]?.trim().replace(/^["']|["']$/g, '') || undefined;
  } catch {
    return undefined;
  }
}

/**
 * Where `/api/*` goes when the dev server is proxying — **the dev api on 3083, by default**.
 *
 * This used to be `http://localhost:3081` and that was the wrong default, not merely a hardcoded
 * one. 3081 is *production*: the api container the learner's browser reaches through `web` on
 * 3082. A dev SPA pointed there signs in against the real database and writes token rows,
 * attempts and journal entries into the one record §3.5 says is never edited — and it does it by
 * default, which is the part that matters. Content lives in git and progress lives in Postgres
 * (§6.7); this is the seam where a dev tool would cross it.
 *
 * So the default is 3083, the dev api `infra/dev-stack.sh` runs from source against
 * `pyquest_dev`, and reaching production is a **deliberate override**:
 *
 *     PYQUEST_API_TARGET=http://127.0.0.1:3081 npm run dev:live --workspace @pyquest/web
 *
 * `DEV_API_PORT` is read from the environment *and* from `infra/.env`, because `infra/.env`
 * already defines it and a port configured in one place that another place hardcodes is exactly
 * the disagreement this comment exists to prevent. The environment wins when both are set —
 * `dev-stack.sh` exports it, and an explicit export should beat a file.
 *
 * None of this is reachable without `VITE_API_LIVE`. Plain `npm run dev` answers from fixtures
 * and never asks the proxy anything — see the `server.proxy` comment below.
 */
const devApiPort = process.env['DEV_API_PORT'] ?? fromInfraEnv('DEV_API_PORT') ?? '3083';
const apiTarget = process.env['PYQUEST_API_TARGET'] ?? `http://127.0.0.1:${devApiPort}`;

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
    /*
     * The dev server is the api's front door too, exactly as the web container is in production.
     *
     * The SPA asks for `/api/...` — a relative URL, so the browser resolves it against whatever
     * origin served the page, and there is no address in the bundle to be right or wrong about.
     * That only works if something on THIS origin knows where the api is, which in the container
     * is `apps/web/Caddyfile` and here is this block. The same relative path works in both.
     *
     * No `rewrite`: the api registers its own routes under `/api/` already (`apps/api/src/
     * server.ts`), so stripping the prefix would turn `/api/tome` into a 404 from a healthy api.
     * The Caddyfile omits `strip_prefix` for the same reason.
     *
     * `npm run dev` still answers from fixtures unless the build sets `VITE_API_LIVE`, so this
     * proxy sits unused until someone deliberately points dev at a running stack. `npm run
     * dev:live` is that deliberate act — it is the same vite server in `--mode live`, which loads
     * `.env.live` and nothing else changes.
     *
     * The target is `apiTarget` above: the dev api on 3083, not production on 3081.
     */
    proxy: {
      '/api': { target: apiTarget, changeOrigin: false },
    },
  },
});
