import { createRoomAsLeader, enterName, expect, newUser, openTeam, test } from './fixtures.ts';

test('player joins by code', async ({ browser }) => {
  const leader = await newUser(browser);
  const player = await newUser(browser);
  const code = await createRoomAsLeader(leader, 'Alpha');
  const leaderMembers = await openTeam(leader);

  await player.goto('/');
  await player.getByLabel('Join code').fill(code.toLowerCase());
  await player.getByRole('button', { name: 'Join room' }).click();
  await enterName(player, 'Bravo');

  await expect(player.getByText('Leader', { exact: true })).toBeHidden();
  const playerMembers = await openTeam(player);
  await expect(playerMembers).toContainText('Alpha');
  await expect(playerMembers).toContainText('Bravo');

  // The leader sees the player appear live, and drop when they leave.
  const bravoOnLeader = leaderMembers.getByRole('listitem').filter({ hasText: 'Bravo' });
  await expect(bravoOnLeader.getByLabel('online')).toBeVisible();
  await player.close();
  await expect(bravoOnLeader.getByLabel('offline')).toBeVisible();
});

test('player joins by scanning the QR code', async ({ browser }) => {
  const leader = await newUser(browser);
  const player = await newUser(browser);
  const code = await createRoomAsLeader(leader, 'Alpha');

  const leaderMembers = await openTeam(leader);
  await leader.getByRole('button', { name: 'Show QR code' }).click();
  const qr = leader.getByRole('img', { name: `QR code to join room ${code}` });
  await expect(qr).toHaveAttribute('src', /^data:image\/png;base64,/);
  const url = (await qr.getAttribute('data-url'))!;
  expect(url).toMatch(new RegExp(`/room/${code}$`));

  // A camera app just opens the encoded URL.
  await player.goto(url);
  await enterName(player, 'Bravo');
  await expect(leaderMembers).toContainText('Bravo');
});

test('unknown code shows an error', async ({ page }) => {
  await page.goto('/room/ZZZZZZ');
  await page.getByLabel('Your name').fill('Charlie');
  await page.getByRole('button', { name: 'Join', exact: true }).click();
  await expect(page.getByRole('alert')).toHaveText('Room not found');
});
