import { createRoomAsLeader, expect, openTeam, test } from './fixtures.ts';

test('anyone can create a room and becomes its leader', async ({ page }) => {
  const code = await createRoomAsLeader(page, 'Alpha');

  expect(page.url()).toMatch(new RegExp(`/room/${code}$`));
  const members = await openTeam(page);
  await expect(page.getByText('You are the leader')).toBeVisible();
  await expect(members.getByRole('listitem').filter({ hasText: 'Alpha' })).toContainText('(you)');
});

test('the leader stays leader after a reload', async ({ page }) => {
  await createRoomAsLeader(page, 'Alpha');
  await page.reload();

  // Returning member: no name prompt, same member, still leader (token from localStorage).
  await expect(page.getByText('Leader', { exact: true })).toBeVisible();
  const members = await openTeam(page);
  await expect(members.getByRole('listitem')).toHaveCount(1);
});
