import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

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
     * proxy sits unused until someone deliberately points dev at a running stack.
     */
    proxy: {
      '/api': { target: 'http://localhost:3081', changeOrigin: false },
    },
  },
});
