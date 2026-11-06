import { createRoomAsLeader, expect, joinRoom, memberLabel, newUser, test } from './fixtures.ts';

const ALPHA_GPS = { latitude: 50.45, longitude: 30.52 };
const BRAVO_GPS = { latitude: 50.4506, longitude: 30.5212 };

test('members see each other live on the map with name labels', async ({ browser }) => {
  const leader = await newUser(browser, ALPHA_GPS);
  const player = await newUser(browser, BRAVO_GPS);
  const code = await createRoomAsLeader(leader, 'Alpha');
  await expect(memberLabel(leader, 'Alpha')).toBeVisible();

  await joinRoom(player, code, 'Bravo');

  // The player gets Alpha from the room snapshot; the leader gets Bravo from a live position:updated.
  await expect(memberLabel(player, 'Alpha')).toBeVisible();
  await expect(memberLabel(player, 'Bravo')).toBeVisible();
  await expect(memberLabel(leader, 'Bravo')).toBeVisible();
});

test('a moving player moves on the other screens', async ({ browser }) => {
  const leader = await newUser(browser, ALPHA_GPS);
  const player = await newUser(browser, BRAVO_GPS);
  const code = await createRoomAsLeader(leader, 'Alpha');
  await joinRoom(player, code, 'Bravo');

  const bravo = memberLabel(leader, 'Bravo');
  await expect(bravo).toBeVisible();
  const before = (await bravo.boundingBox())!;

  // ~100 m north; arrives after the client's send interval.
  await player.context().setGeolocation({ latitude: BRAVO_GPS.latitude + 0.001, longitude: BRAVO_GPS.longitude });
  await expect.poll(async () => (await bravo.boundingBox())?.y ?? Infinity, { timeout: 10_000 }).toBeLessThan(before.y - 20);
});

test('denied GPS shows a banner and the map still works', async ({ page }) => {
  // The default context has no geolocation permission.
  await createRoomAsLeader(page, 'Alpha');
  await expect(page.getByRole('status')).toContainText('Location is blocked');
  await expect(page.getByTestId('map')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Center on me' })).toBeDisabled();
});
