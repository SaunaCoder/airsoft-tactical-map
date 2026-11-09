import { expect, test } from './fixtures.ts';

test('Photo (EE) is the default, and a chosen base layer is remembered after a reload', async ({ page }) => {
  // The fixture aborts tile requests, but the request itself proves the layer is live.
  const photoTile = page.waitForRequest(/tiles\.maaamet\.ee\/tm\/tms\/1\.0\.0\/foto@GMC\//);
  await page.goto('/templates/new');
  await photoTile;

  const sheet = page.getByRole('region', { name: 'Map layers' });
  await page.getByRole('button', { name: 'Map layers' }).tap();
  await expect(sheet.getByRole('radio', { name: 'Photo (EE)' })).toBeChecked();

  const osmTile = page.waitForRequest(/tile\.openstreetmap\.org\//);
  await sheet.getByRole('radio', { name: 'World Simple' }).check();
  await osmTile;

  // A tap outside the sheet closes it.
  await page.getByRole('button', { name: 'Close map layers' }).click({ position: { x: 200, y: 100 } });
  await expect(sheet).toBeHidden();

  await page.reload();
  await page.getByRole('button', { name: 'Map layers' }).tap();
  await expect(sheet.getByRole('radio', { name: 'World Simple' })).toBeChecked();
});
