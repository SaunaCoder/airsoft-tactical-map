import { expect, test } from '@playwright/test';
import { createRoomAsLeader } from './helpers.ts';

test('player joins by code', async ({ browser }) => {
  const leader = await (await browser.newContext()).newPage();
  const player = await (await browser.newContext()).newPage();
  const code = await createRoomAsLeader(leader, 'Alpha');

  await player.goto('/');
  await player.getByLabel('Join code').fill(code.toLowerCase());
  await player.getByRole('button', { name: 'Join room' }).click();
  await player.getByLabel('Your name').fill('Bravo');
  await player.getByRole('button', { name: 'Join', exact: true }).click();

  const playerMembers = player.getByRole('list', { name: 'Members' });
  await expect(playerMembers).toContainText('Alpha');
  await expect(playerMembers).toContainText('Bravo');
  await expect(player.getByText('You are the leader')).toBeHidden();

  // The leader sees the player appear live, and drop when they leave.
  const bravoOnLeader = leader.getByRole('listitem').filter({ hasText: 'Bravo' });
  await expect(bravoOnLeader.getByLabel('online')).toBeVisible();
  await player.close();
  await expect(bravoOnLeader.getByLabel('offline')).toBeVisible();
});

test('unknown code shows an error', async ({ page }) => {
  await page.goto('/room/ZZZZZZ');
  await page.getByLabel('Your name').fill('Charlie');
  await page.getByRole('button', { name: 'Join', exact: true }).click();
  await expect(page.getByRole('alert')).toHaveText('Room not found');
});
