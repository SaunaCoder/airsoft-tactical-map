# airsoft-tactical-map
Real-time tactical map for airsoft teams. The leader creates a room, players join by code or QR and share live GPS positions, and the leader draws markers, routes and zones that sync instantly. Reusable map templates for game prep. SvelteKit, Leaflet, Node.js, Socket.IO, MongoDB, Zod, Docker.

## Run locally

Requirements: Node 24+, Docker (for MongoDB), pnpm via corepack (`corepack enable`).

```bash
pnpm install
cp .env.example .env
pnpm dev            # MongoDB (docker compose) + server on :3000 + web on :5173
```

Open http://localhost:5173. Health check: http://localhost:5173/api/health.

Other scripts: `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm test:e2e` (first run: `pnpm exec playwright install chromium`), `pnpm build`.
