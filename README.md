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

## Run the full stack (HTTPS, like production)

```bash
docker compose up -d --build
```

Open https://localhost and accept the self-signed certificate warning. nginx terminates HTTPS and routes `/api` and `/socket.io` to the server and everything else to the SvelteKit app. The certificate is generated on first start and kept in the `certs` volume.

Run the e2e suite against this stack instead of the dev servers:

```bash
E2E_BASE_URL=https://localhost pnpm test:e2e
```

## Test on a phone

Browsers only allow GPS on HTTPS (or `localhost`), so a phone needs the HTTPS stack:

1. Find your computer's LAN IP (e.g. `192.168.1.50`) and put it in `.env`: `CERT_HOSTS=localhost,192.168.1.50`.
2. Recreate the certificate: `docker compose rm -sf nginx && docker volume rm airsoft-tactical-map_certs && docker compose up -d`.
3. On the phone (same Wi-Fi), open `https://192.168.1.50` and accept the certificate warning.
4. Allow your computer's firewall to accept inbound connections on port 443 if the page doesn't load.

To avoid the warning, mount a locally trusted certificate instead (e.g. made with [mkcert](https://github.com/FiloSottile/mkcert), with its root CA installed on the phone) as `fullchain.pem` and `privkey.pem` in the `certs` volume. In production, the same two files come from Let's Encrypt.
