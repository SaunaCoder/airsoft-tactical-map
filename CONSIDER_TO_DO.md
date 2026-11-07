# Consider to do

Ideas outside the current requirements in `CLAUDE.md`. Not planned yet - pick one up only after deciding it is worth it.

## 1. Estonian Land Board map layers (highest value, smallest change)

Use Maa- ja Ruumiamet (Estonian Land Board) open data instead of, or next to, OpenStreetMap.

- **Orthophotos** at roughly 10-25 cm per pixel, much sharper than Esri or Google imagery around Loksa.
- **Other layers:** Estonian base map / topographic map, hillshade (relief), hybrid overlay (roads and names on top of the photo).
- **No API key, no account.** Nothing to add to `.env`, nothing exposed in the browser.
- **Projection:** native is L-EST97 (EPSG:3301), but Web Mercator versions of the tiles exist and work with Leaflet as is. Using EPSG:3301 directly would need Proj4Leaflet, which is outside the tech stack. Use the Web Mercator tiles and mention the trade-off in the README.
- **Attribution:** the open data licence requires a credit line (something like "Maa- ja Ruumiamet, <year>"). Check the exact wording and current tile endpoints on the geoportal before using them.

Implementation notes:
- Tile layers live in `apps/web/src/lib/core/map.ts`.
- Add a layer switcher with Leaflet's built-in `L.control.layers` (orthophoto / topo / OSM). Make the toggle at least 48x48 px and add it to the touch target audit in `e2e/mobile.spec.ts`.
- Set `maxNativeZoom` to the provider's maximum and keep `maxZoom` higher, so Leaflet upscales instead of showing grey tiles.
- `e2e/fixtures.ts` blocks only OSM tiles - block the new tile host too.
- Satellite tiles are heavier than OSM tiles; keep that in mind for mobile data (see offline tiles below).

Fallback imagery outside Estonia, if ever needed: Esri World Imagery (no key for testing, note the `{z}/{y}/{x}` order) or MapTiler Satellite (free tier, key restricted by domain). Do not use the unofficial Google tile URLs (`mt1.google.com/vt/lyrs=s`) - that violates Google's terms.

## 2. MGRS coordinates

Show your own position and a tapped point as an MGRS grid reference (e.g. `35V MF 12345 67890`), the format military navigation uses instead of lat/lng.

- Either the `mgrs` npm package (new library - needs approval) or a ~100 line lat/lng -> UTM -> MGRS conversion in pure functions with Vitest tests against known reference points.

## 3. Night mode

A dimmed or red-tinted map so the screen does not ruin night vision or give away positions in the dark. Can be done with CSS filters on the tile layer plus a dark UI theme.

## 4. Offline map tiles

Already P2 in `CLAUDE.md`. Worth moving up: "works where mobile signal does not" is a strong point for field use.

## 5. README: be accurate about security

No accounts was a UX decision (create a room and go), not a security one - say so. What can honestly be described as deliberate security work:

- Leader token from a cryptographically secure RNG, server stores only its hash, timing-safe comparison.
- Permissions enforced on the server, leader UI hiding is cosmetic only.
- Every socket event and API body validated with Zod; invalid payloads are rejected without crashing or broadcasting.
- Side effect of no accounts: almost no personal data is stored, and rooms expire.

Known limitations to list openly (or fix):

- Anyone who has the 6 character room code can join and see everyone's live positions.
- No rate limiting on room joins or room creation, so join codes could be brute forced in principle.
- Positions are protected in transit by HTTPS only; the server sees and stores everything in plain form.
