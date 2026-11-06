import { expect, type Page } from '@playwright/test';

/** Creates a room from the home page, joins it under `name`, and returns the join code. */
export async function createRoomAsLeader(page: Page, name: string): Promise<string> {
  await page.goto('/');
  await page.getByRole('button', { name: 'Create room' }).click();
  await expect(page).toHaveURL(/\/room\/[A-HJKMNP-Z2-9]{6}$/);

  await page.getByLabel('Your name').fill(name);
  await page.getByRole('button', { name: 'Join', exact: true }).click();
  await expect(page.getByText('You are the leader')).toBeVisible();

  return (await page.getByTestId('join-code').textContent())!;
}
