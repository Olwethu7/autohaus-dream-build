# MLG Autohaus — Deployment

## One-click (Lovable)

1. Click **Publish** in the Lovable editor — your site goes live at `*.lovable.app`.
2. (Optional) Connect a custom domain from **Project Settings → Domains**.

That's it. Lovable Cloud provisions the database, auth, storage, and server functions automatically.

## Self-hosted

1. Copy `.env.example` to `.env` and fill in every value.
2. `bun install`
3. `bun run build`
4. Deploy the build output to any Node-compatible host (Cloudflare Workers, Vercel, Netlify Edge, Fly).

## Default admin

After first deploy, sign in with:

- **Email:** `admin@mlgautohaus.com`
- **Password:** `ChangeMe123!`

> **Change this password immediately** from your account settings.
