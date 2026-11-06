import type { Page } from '@playwright/test';
import { createRoomAsLeader, expect, joinRoom, newUser, test } from './fixtures.ts';

const ALPHA_GPS = { latitude: 50.45, longitude: 30.52 };
const BRAVO_GPS = { latitude: 50.4506, longitude: 30.5212 };

/** Leader and player in the same room, both zoomed to the field by their GPS fix. */
async function leaderAndPlayer(browser: import('@playwright/test').Browser) {
  const leader = await newUser(browser, ALPHA_GPS);
  const player = await newUser(browser, BRAVO_GPS);
  const code = await createRoomAsLeader(leader, 'Alpha');
  await joinRoom(player, code, 'Bravo');
  return { leader, player, code };
}

/** Taps the map at viewport pixel (x, y), away from the header and the member dots in the centre. */
const tap = (page: Page, x: number, y: number) => page.getByTestId('map').click({ position: { x, y } });

test('leader adds a marker, player sees it', async ({ browser }) => {
  const { leader, player } = await leaderAndPlayer(browser);

  await leader.getByTitle('Draw Marker').click();
  await tap(leader, 100, 600);
  await expect(player.locator('.drawing-marker')).toHaveCount(1);

  // Persisted: a reload (or a late joiner) gets it from room:state.
  await player.reload();
  await expect(player.locator('.drawing-marker')).toHaveCount(1);
});

test('leader deletes a drawing, player sees it disappear', async ({ browser }) => {
  const { leader, player } = await leaderAndPlayer(browser);
  await leader.getByTitle('Draw Marker').click();
  await tap(leader, 100, 600);
  await expect(player.locator('.drawing-marker')).toHaveCount(1);

  await leader.getByTitle('Remove Layers').click();
  await leader.locator('.drawing-marker').click();
  await expect(player.locator('.drawing-marker')).toHaveCount(0);
});

test('leader moves a marker in edit mode, player sees it move', async ({ browser }) => {
  const { leader, player } = await leaderAndPlayer(browser);
  await leader.getByTitle('Draw Marker').click();
  await tap(leader, 100, 600);
  const playerMarker = player.locator('.drawing-marker');
  await expect(playerMarker).toHaveCount(1);
  const before = (await playerMarker.boundingBox())!;

  await leader.getByTitle('Edit Layers').click();
  const box = (await leader.locator('.drawing-marker').boundingBox())!;
  await leader.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await leader.mouse.down();
  await leader.mouse.move(box.x + box.width / 2, box.y - 150, { steps: 10 });
  await leader.mouse.up();

  await expect.poll(async () => (await playerMarker.boundingBox())!.y).toBeLessThan(before.y - 100);
});

test('leader draws a zone and an arrow', async ({ browser }) => {
  const { leader, player } = await leaderAndPlayer(browser);

  await leader.getByTitle('Draw Polygons').click();
  await tap(leader, 80, 300);
  await tap(leader, 300, 300);
  await tap(leader, 300, 500);
  await tap(leader, 80, 300); // tap the first vertex to close
  await expect(player.locator('path.drawing-zone')).toHaveCount(1);

  await leader.getByTitle('Draw Arrow').click();
  await tap(leader, 80, 650);
  await tap(leader, 300, 600);
  await tap(leader, 300, 600); // tap the last vertex to finish
  await expect(player.locator('path.drawing-arrow')).toHaveCount(2); // shaft + head
});

test('members get no drawing tools', async ({ browser }) => {
  const { leader, player } = await leaderAndPlayer(browser);
  await expect(leader.getByTitle('Draw Marker')).toBeVisible();
  await expect(player.getByTitle('Draw Marker')).toHaveCount(0);
  await expect(player.getByTitle('Remove Layers')).toHaveCount(0);
});
