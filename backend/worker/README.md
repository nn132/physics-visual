Cloudflare Worker for physics-visual

This worker implements a small API endpoint used by the front-end: POST /api/parse-problem
It calls an OpenAI-compatible API (DeepSeek/OpenAI) using a secret API key.

Files:
- index.js - Worker source
- wrangler.toml - Wrangler configuration

Quick deploy (recommended: use Wrangler v2)
1. Install Wrangler: `npm install -g wrangler`
2. Login: `wrangler login` (opens Cloudflare dashboard to authorize)
3. From this directory run:
   - `wrangler publish --name physics-visual-worker --env production`

Set secret (API key)
- `wrangler secret put OPENAI_API_KEY` and paste your key

Route binding options
- If you use Pages and want the worker to live under your pages.dev domain, use the Pages Functions integration or create a route in your zone for `physics-visual.pages.dev/api/*`.
- If using route in wrangler.toml, replace `<YOUR_ZONE_ID>` with your Cloudflare Zone ID.

Notes
- Keep your API key secret. Do not push it to GitHub.
- Test locally with `wrangler dev index.js --ip 0.0.0.0 --port 8787` and point your front-end to `http://127.0.0.1:8787/api/parse-problem` for local dev.
