# CLAUDE.md - Airsoft Tactical Map

Instructions for Claude Code working in this repository. Read this file fully before starting any task.

## Project

A real-time tactical map for an airsoft team. The leader creates a room, players join by code or QR, everyone sees each other's live positions, and the leader draws the game plan on the map. Zones and points of interest can be prepared as a template before the game.

This is a portfolio project. Code quality, clear architecture, tests and a good README matter as much as features.

## Git workflow (mandatory)

- **Never commit to `main`. Never push to `main`. Never merge into `main`.** No exceptions, even for one-line fixes.
- **Before writing any code**, create a branch:
  ```bash
  git checkout main
  git pull
  git checkout -b <type>/<short-descriptive-name>
  ```
- If you are already on a non-`main` branch that matches the current task, keep working on it. If the task is unrelated to the current branch, create a new one from `main`.
- Branch types:
  | Prefix | Use for |
  |---|---|
  | `bug/` | Bug fix |
  | `feature/` | New feature |
  | `doc/` | Documentation only |
  | `update/` | Change or improvement to an existing feature |
- Branch name: lowercase kebab-case, 2-5 words, the most suitable name for what the branch does. Examples: `feature/leader-drawing-tools`, `feature/join-room-by-qr`, `bug/reconnect-loses-room-state`, `update/gps-throttling-interval`, `doc/readme-architecture-diagram`.
- Commit in small logical steps with clear imperative messages (`Add room join code generator`, `Validate feature:add payload with Zod`).
- You may push the working branch (`git push -u origin <branch>`). Opening and merging PRs is done by a human.

## PR description (mandatory after finishing code)

When the code for a task is done and tests pass, output a PR description inside a single fenced block so it can be copied in one click. Use a four-backtick fence (````markdown) so code blocks inside the PR text don't break it.

Template:

````markdown
## <PR title>

**Branch:** `<type>/<name>` -> `main`
**Requirement:** <e.g. P0-4 Leader drawing tools>

### Summary
<1-3 sentences: what this PR does and why>

### Changes
- <change, grouped by slice: shared / server / web / infra>
- ...

### How to test
1. <step>
2. <step>
Expected: <result>

### Tests
- <unit/e2e tests added or updated>

### Notes
<trade-offs, follow-ups, known limitations, or "None">
````

## Tech stack

- **Frontend:** SvelteKit, TypeScript, Tailwind CSS
- **Map:** Leaflet + OpenStreetMap and Estonian Land Board (Maa- ja Ruumiamet, Web Mercator) tiles, Leaflet-Geoman for drawing tools
- **Backend:** Node.js, Express, TypeScript
- **Real-time:** Socket.IO (WebSocket)
- **Database:** MongoDB (Mongoose)
- **Validation:** Zod, shared between frontend and backend
- **Data format:** GeoJSON for all map features
- **Testing:** Vitest (unit), Playwright (end-to-end)
- **Infrastructure:** Docker + Docker Compose, nginx with HTTPS, Hetzner server

Do not add frameworks or libraries outside this list without asking first.

## Architecture: monorepo + vertical slices

pnpm workspaces monorepo. Code is organized **by feature (slice), not by technical layer**. Each slice owns everything it needs: schemas, server handlers, persistence, UI and tests.

```
airsoft-team-map/
├── apps/
│   ├── server/                     # Express + Socket.IO
│   │   └── src/
│   │       ├── core/               # bootstrap, config, db connection, socket server,
│   │       │                       # error handling, auth helpers (leader token)
│   │       ├── slices/
│   │       │   ├── rooms/          # create room, join code, leader token, join/leave, members, room state, expiry
│   │       │   ├── presence/       # live positions
│   │       │   ├── drawings/       # feature add/update/delete, undo, clear
│   │       │   └── templates/      # template CRUD, load template into room
│   │       └── main.ts
│   └── web/                        # SvelteKit
│       └── src/
│           ├── lib/
│           │   ├── core/           # socket client, map setup, geolocation, UI primitives
│           │   └── slices/
│           │       ├── rooms/
│           │       ├── presence/
│           │       ├── drawings/
│           │       └── templates/
│           └── routes/             # thin pages that compose slices
├── packages/
│   └── shared/                     # Zod schemas + inferred types + event names
│       └── src/
│           ├── geojson/
│           ├── rooms/
│           ├── presence/
│           ├── drawings/
│           └── templates/
├── e2e/                            # Playwright tests
├── infra/                          # Dockerfiles, nginx config
├── compose.yaml                    # docker compose (root, so `docker compose up` works from repo root)
└── .github/workflows/              # CI
```

A typical server slice:

```
slices/drawings/
├── drawings.schema.ts      # re-exports from @shared or slice-local Mongoose schema
├── drawings.service.ts     # business logic, pure where possible
├── drawings.socket.ts      # socket event handlers for this slice
├── drawings.routes.ts      # REST routes (if any)
├── drawings.service.test.ts
└── index.ts                # public API of the slice
```

Rules:
- A slice imports another slice **only through its `index.ts`**. Never reach into another slice's internals.
- Code goes into `core/` only when it is genuinely used by 2+ slices. Do not create generic `utils/` dumping grounds.
- Routes/pages in `apps/web/src/routes` stay thin: they compose slice components and stores.
- All Zod schemas for socket payloads and API bodies live in `packages/shared` and are imported by both apps. Types come from `z.infer`, never hand-written duplicates.
- Business logic (permission checks, code generation, undo stack, throttling math) is kept in pure functions so it can be unit tested without sockets or a database.

## Core rules

- **Server is the source of truth.** Permissions are enforced on the server. UI hiding of leader tools is cosmetic only.
- **Validate everything incoming.** Every socket event and every API request is parsed with its Zod schema before use. Invalid payload -> emit `error` to that client, do not crash, do not broadcast.
- **GeoJSON everywhere.** All map features are GeoJSON `Feature`s inside a `FeatureCollection`. Coordinates are `[lng, lat]` (GeoJSON order), not Leaflet's `[lat, lng]`. Convert only at the Leaflet boundary.
- **Leader token:** generated with a cryptographically secure RNG, returned once to the leader, stored on the leader's device (localStorage). The server stores only its hash (`leaderTokenHash`) and compares with a timing-safe comparison.
- **Join codes:** 6 characters, uppercase, without ambiguous characters (no `0/O`, `1/I/L`). Check for collisions with active rooms.
- **No accounts.** Players are identified per room by a generated member id + display name.
- **Mobile-first.** Design for a phone used one-handed outdoors: full-screen map, large touch targets (min 48px), minimal menus, high contrast.
- TypeScript `strict` mode everywhere. No `any` unless justified in a comment.
- Use hyphens (-), not em dashes, in docs and UI text.

## Requirements

Work in priority order. Do not start P1 items until all P0 items are done, unless explicitly asked.

### P0 - Must have (MVP)

1. **Create a room.** Anyone can create a room and becomes its leader. The room gets a short random join code (6 characters) and a leader token stored on the leader's device.
2. **Join a room.** Players join by entering the code or scanning a QR code. A player only needs a display name, no account.
3. **Live positions.** Each member shares their GPS position through the browser Geolocation API. All members see everyone on the map in real time, with name labels.
4. **Leader drawing tools.** The leader can add markers, draw lines/arrows and polygons (zones), and delete them. Changes are broadcast to all members instantly.
5. **Roles.** Only the leader can draw or edit. Members have view-only access to drawings. The server enforces this, not just the UI.
6. **Templates.** The leader can prepare a template before the game: outline the game zone, add points of interest, save it, and later load it into a room.
7. **Persistence.** Rooms and templates are stored in MongoDB. A player who reconnects gets the current room state.
8. **Mobile-first UI.** Works one-handed on a phone in the field: large buttons, a full-screen map, minimal menus.
9. **HTTPS deployment.** Deployed with Docker on Hetzner behind nginx with HTTPS. Browsers require HTTPS for geolocation.
10. **Validation and failure handling.** All incoming socket events and API requests are validated with Zod. Handle lost connection (auto-reconnect, visible "offline" state) and denied or unavailable GPS.
11. **Tests.** Unit tests for room and permission logic. At least two Playwright end-to-end tests: "leader adds a marker, player sees it" and "player joins by code".
12. **README.** Problem, features, architecture diagram, data flow (who sends what, through which event), how to run locally.

### P1 - Should have

1. **GPS smoothing and throttling.** Send positions at a sensible interval (every 3-5 seconds or after meaningful movement) and smooth jumpy readings.
2. **Member list.** Shows who's in the room, with a "last seen" time, so the leader notices when someone drops out.
3. **Undo and clear.** The leader can undo the last change or clear all drawings.
4. **Room expiry.** Inactive rooms expire automatically (MongoDB TTL index on `expiresAt`).
5. **CI.** GitHub Actions runs linting and tests on every push.
6. **GraphQL API for templates.** Create, read, update and delete templates through GraphQL instead of REST. Build P0 templates over REST behind a service layer so this swap only replaces the transport.

### P2 - Nice to have

1. **Monitoring.** Prometheus metrics (active rooms, connected members, events per second) with a Grafana dashboard.
2. **MapLibre GL** as an alternative map engine. Keep map code behind a thin adapter in `web/src/lib/core` so this is possible.
3. **Offline map tiles** for areas with weak signal.
4. **Export and import templates** as GeoJSON files.
5. **Teams inside a room** (e.g. color groups).

### Out of scope

Do not build these, even partially:
- User accounts and passwords
- Chat or voice
- Native mobile apps

## Data model (draft)

```ts
Room {
  code: string                 // 6 chars, unique among active rooms
  leaderTokenHash: string
  members: [{ id, name, lastPosition, lastSeen }]
  features: Feature[]           // stored as an array (max 500), sent as a FeatureCollection in room:state
  createdAt: Date
  expiresAt: Date              // TTL index (P1)
}

Template {
  name: string
  ownerKeyHash: string         // SHA-256 of the random owner key kept in the creating device's localStorage
  center: [lng, lat]
  zoom: number
  features: Feature[]          // same Feature schema as rooms, max 500
  createdAt, updatedAt: Date
}
```

The model is a draft. If a change is needed, update this section in the same PR.

## REST endpoints

| Method | Path | Notes |
|---|---|---|
| `POST` | `/api/rooms` | `201 { code, leaderToken }`. The token is returned only here |
| `GET` | `/api/templates` | summaries (no features), newest first |
| `POST` | `/api/templates` | body `templateInputSchema`, `201` with the template |
| `GET` / `PUT` / `DELETE` | `/api/templates/:id` | `404` for missing ids and for other owners' templates alike |

Template requests need the `x-owner-key` header (`401` without it). Errors are `{ error }` JSON: `400` invalid body, `404` not found, `500` without details.

## Socket events (draft)

| Direction | Event | Notes |
|---|---|---|
| Client -> Server | `room:join` | code, name, optional leader token, optional member id (reconnect). One join per socket |
| Client -> Server | `position:update` | `{ position: [lng, lat] }`, joined members only. Client sends at most every 3 s (newest fix always goes out); server drops updates < 1 s apart |
| Client -> Server | `feature:add` | leader only. `{ geometry, properties: { kind } }`: marker=Point, line/arrow=LineString, zone=Polygon. Server assigns the id |
| Client -> Server | `feature:update` | leader only. Full Feature (same id), replaces the stored one |
| Client -> Server | `feature:delete` | leader only. `{ id }` |
| Client -> Server | `template:load` | leader only. `{ templateId, ownerKey }`. Appends the template's features to the room with fresh ids, then `feature:added` per feature |
| Server -> Client | `room:state` | full snapshot to the joining client, sent on join and reconnect |
| Server -> Client | `member:joined` | `{ id, name, online, position }` to the others; also on reconnect, so renames propagate |
| Server -> Client | `member:left` | `{ memberId }` once the member's last socket disconnects |
| Server -> Client | `position:updated` | `{ memberId, position }` to the others (sender shows its own fix locally) |
| Server -> Client | `feature:added` | Feature with server id, to the whole room incl. the leader (clients render only confirmed state) |
| Server -> Client | `feature:updated` | Feature, to the whole room |
| Server -> Client | `feature:deleted` | `{ id }`, to the whole room |
| Server -> Client | `error` | sent only to the offending client |

Event names and payload schemas are defined once in `packages/shared` and used by both apps. Never hardcode event name strings in app code.

Clients emit room events only through `RoomSession.send` (or with an explicit `joined` check), never `socket.emit` directly: Socket.IO buffers emits made while disconnected and flushes them on reconnect *before* `room:join`, where the server rejects them. The server heartbeat is 10 s + 5 s, so a phone that drops off the network shows as offline within ~15 s; the browser's `offline` event makes the client side immediate.

## Testing

- **Vitest** for unit tests, colocated with the code (`*.test.ts`). Required for: join code generation, leader token check, permission checks per event, room state on reconnect, undo stack, GPS throttling/smoothing.
- **Playwright** for e2e in `e2e/`. Use two browser contexts for multi-user flows and mock geolocation via Playwright's geolocation permission + coordinates.
- `e2e/mobile.spec.ts` audits every screen for touch targets under 48x48 px. When adding a screen or control, add that state to the audit. Use `newUser()` from `e2e/fixtures.ts` for extra users (it blocks tile servers and closes the context after the test).
- Every bug fix (`bug/` branch) comes with a test that fails before the fix.
- Run lint, typecheck and tests before writing the PR description. Do not claim tests pass without running them.

## Commands

Expected root scripts (create them when scaffolding, keep this list in sync):

```bash
pnpm install
pnpm dev            # web + server in watch mode, MongoDB via docker compose
pnpm lint
pnpm typecheck
pnpm test           # Vitest across workspaces
pnpm test:e2e       # Playwright
pnpm build
docker compose up   # full stack over HTTPS: nginx + web + server + MongoDB (https://localhost)
```

`pnpm` comes from corepack (version pinned in root `package.json` `packageManager`). If `corepack enable` fails with EPERM on Windows, use `corepack enable --install-directory "%APPDATA%\npm" pnpm`.

## Local development notes

- `localhost` is a secure context, so geolocation works on desktop without HTTPS.
- Testing on a real phone needs HTTPS: `docker compose up` with `CERT_HOSTS` set to your LAN IP (self-signed cert generated by nginx). See README "Test on a phone".
- `E2E_BASE_URL=https://localhost pnpm test:e2e` runs the e2e suite against the Docker stack instead of the dev servers.
- Secrets and connection strings go in `.env` (git-ignored). Keep `.env.example` up to date.
- **Node 24+.** The server and `packages/shared` run on Node's native TypeScript type stripping: no build step, no `tsx`. Consequences: relative imports use the `.ts` extension, and only erasable syntax is allowed (no `enum`, `namespace`, parameter properties). `tsconfig.base.json` enforces this.
- `packages/shared` is consumed as TypeScript source (`exports` points at `src/index.ts`); Vite and Node both load it directly.
- **SvelteKit 3:** there is no `svelte.config.js`. Kit options are passed to `sveltekit({...})` in `apps/web/vite.config.ts`, and `tsconfig.json` extends `$app/tsconfig`.
- **No `$lib` alias in SvelteKit 3:** use the `#lib` subpath import from `apps/web/package.json` `imports`, with the full file path (`#lib/slices/rooms/index.ts`). Subpath imports don't resolve directory indexes.
- **TypeScript is pinned to 6.0.x**: typescript-eslint, svelte-check and SvelteKit don't support TS 7 yet.
- In dev, Vite proxies `/api` and `/socket.io` to the server on port 3000, so the web app always talks same-origin (as it will behind nginx).

## Definition of done

A task is done when:
1. Work is on a correctly named branch, not `main`.
2. Code follows the vertical slice structure and shared Zod schemas.
3. Server-side validation and permission checks are in place for any new event or endpoint.
4. Tests are added/updated and lint, typecheck and tests pass.
5. README or this file is updated if behavior, events, data model or commands changed.
6. A copyable PR description is printed using the template above.
