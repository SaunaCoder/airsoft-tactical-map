# Consider to do

Ideas outside the current requirements in `CLAUDE.md`. Not planned yet - pick one up only after deciding it is worth it.

## 1. MGRS coordinates

Show your own position and a tapped point as an MGRS grid reference (e.g. `35V MF 12345 67890`), the format military navigation uses instead of lat/lng.

- Either the `mgrs` npm package (new library - needs approval) or a ~100 line lat/lng -> UTM -> MGRS conversion in pure functions with Vitest tests against known reference points.

## 2. Night mode

A dimmed or red-tinted map so the screen does not ruin night vision or give away positions in the dark. Can be done with CSS filters on the tile layer plus a dark UI theme.

## 3. Offline map tiles

Already P2 in `CLAUDE.md`. Worth moving up: "works where mobile signal does not" is a strong point for field use.

## 4. README: be accurate about security

No accounts was a UX decision (create a room and go), not a security one - say so. What can honestly be described as deliberate security work:

- Leader token from a cryptographically secure RNG, server stores only its hash, timing-safe comparison.
- Permissions enforced on the server, leader UI hiding is cosmetic only.
- Every socket event and API body validated with Zod; invalid payloads are rejected without crashing or broadcasting.
- Side effect of no accounts: almost no personal data is stored, and rooms expire.

Known limitations to list openly (or fix):

- Anyone who has the 6 character room code can join and see everyone's live positions.
- No rate limiting on room joins or room creation, so join codes could be brute forced in principle.
- Positions are protected in transit by HTTPS only; the server sees and stores everything in plain form.
