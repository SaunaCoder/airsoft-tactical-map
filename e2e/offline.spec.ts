import { createRoomAsLeader, expect, joinRoom, newUser, openTeam, test } from './fixtures.ts';

const ALPHA_GPS = { latitude: 50.45, longitude: 30.52 };
const BRAVO_GPS = { latitude: 50.4506, longitude: 30.5212 };

test('a player who loses connection sees "Offline" and catches up after reconnecting', async ({ browser }) => {
  const leader = await newUser(browser, ALPHA_GPS);
  const player = await newUser(browser, BRAVO_GPS);
  const code = await createRoomAsLeader(leader, 'Alpha');
  await joinRoom(player, code, 'Bravo');
  const leaderMembers = await openTeam(leader);
  await leader.getByRole('button', { name: 'Close' }).click();

  await player.context().setOffline(true);
  await expect(player.getByText('Offline')).toBeVisible();
  // With the network gone, the server only learns about it from the missed heartbeat (10 s + 5 s).
  await openTeam(leader);
  await expect(leaderMembers.getByRole('listitem').filter({ hasText: 'Bravo' }).getByLabel('offline')).toBeVisible({
    timeout: 20_000,
  });
  await leader.getByRole('button', { name: 'Close' }).click();

  // The game goes on while the player is offline.
  await leader.getByTitle('Draw Marker').click();
  await leader.getByTestId('map').click({ position: { x: 100, y: 600 } });
  await expect(leader.locator('.drawing-marker')).not.toHaveCount(0);

  await player.context().setOffline(false);
  await expect(player.getByText('Offline')).toBeHidden();
  await expect(player.locator('.drawing-marker')).toHaveCount(1); // from the fresh room:state
  await openTeam(leader);
  await expect(leaderMembers.getByRole('listitem').filter({ hasText: 'Bravo' }).getByLabel('online')).toBeVisible();
});

test('the leader cannot draw while offline, and can again after reconnecting', async ({ browser }) => {
  const leader = await newUser(browser, ALPHA_GPS);
  await createRoomAsLeader(leader, 'Alpha');
  await expect(leader.getByTitle('Draw Marker')).toBeVisible();

  await leader.context().setOffline(true);
  await expect(leader.getByText('Offline')).toBeVisible();
  await expect(leader.getByTitle('Draw Marker')).toHaveCount(0);

  await leader.context().setOffline(false);
  await expect(leader.getByText('Offline')).toBeHidden();
  await leader.getByTitle('Draw Marker').click();
  await leader.getByTestId('map').click({ position: { x: 100, y: 600 } });
  // Hint marker that follows the cursor + the placed one; the placed one must survive a reload.
  await leader.reload();
  await expect(leader.locator('.drawing-marker')).toHaveCount(1);
});
