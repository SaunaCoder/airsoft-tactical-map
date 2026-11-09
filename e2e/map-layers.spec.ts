import { expect, test } from './fixtures.ts';

test('the chosen base layer loads Land Board tiles and is remembered after a reload', async ({ page }) => {
  await page.goto('/templates/new');
  const layers = page.getByRole('button', { name: 'Layers' });
  await layers.tap();
  await expect(page.getByRole('radio', { name: 'Map' })).toBeChecked();

  // The fixture aborts tile requests, but the request itself proves the layer is live.
  const tile = page.waitForRequest(/tiles\.maaamet\.ee\/tm\/tms\/1\.0\.0\/foto@GMC\//);
  await page.getByRole('radio', { name: 'Photo (EE)' }).check();
  await tile;

  await page.reload();
  await layers.tap();
  await expect(page.getByRole('radio', { name: 'Photo (EE)' })).toBeChecked();
});
