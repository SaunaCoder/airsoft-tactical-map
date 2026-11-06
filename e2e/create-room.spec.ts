import { expect, test } from '@playwright/test';
import { createRoomAsLeader } from './helpers.ts';

test('anyone can create a room and becomes its leader', async ({ page }) => {
  const code = await createRoomAsLeader(page, 'Alpha');

  expect(page.url()).toMatch(new RegExp(`/room/${code}$`));
  await expect(page.getByRole('listitem').filter({ hasText: 'Alpha' })).toContainText('(you)');
});

test('the leader stays leader after a reload', async ({ page }) => {
  await createRoomAsLeader(page, 'Alpha');
  await page.reload();

  // Returning member: no name prompt, same member, still leader (token from localStorage).
  await expect(page.getByText('You are the leader')).toBeVisible();
  await expect(page.getByRole('listitem')).toHaveCount(1);
});
