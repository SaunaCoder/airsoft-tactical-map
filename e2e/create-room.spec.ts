import { expect, test } from '@playwright/test';

test('anyone can create a room and becomes its leader', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Create room' }).click();

  await expect(page).toHaveURL(/\/room\/[A-HJKMNP-Z2-9]{6}$/);
  const code = page.url().split('/').pop();
  await expect(page.getByTestId('join-code')).toHaveText(code!);
  await expect(page.getByText('You are the leader')).toBeVisible();
});
