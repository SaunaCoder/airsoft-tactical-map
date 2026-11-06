import { createRoomAsLeader, expect, joinRoom, newUser, openTeam, test } from './fixtures.ts';

const ALPHA_GPS = { latitude: 50.45, longitude: 30.52 };
const BRAVO_GPS = { latitude: 50.4506, longitude: 30.5212 };

test('leader prepares a template, loads it into a room, player sees it', async ({ browser }) => {
  const leader = await newUser(browser, ALPHA_GPS);

  // Prepare before the game.
  await leader.goto('/');
  await leader.getByRole('link', { name: 'Prepare a template' }).click();
  await leader.getByRole('link', { name: 'New template' }).click();
  await leader.getByLabel('Template name').fill('Field A');
  await leader.getByTitle('Draw Marker').click();
  await leader.getByTestId('map').click({ position: { x: 100, y: 600 } });
  await leader.getByRole('button', { name: 'Save' }).click();
  await expect(leader.getByRole('status')).toHaveText('Saved');
  await expect(leader).toHaveURL(/\/templates\/[a-f\d]{24}$/);

  await leader.getByRole('link', { name: 'Back to templates' }).click();
  await expect(leader.getByRole('list', { name: 'Templates' })).toContainText('Field A');

  // Game day: create a room, a player joins, the leader loads the template.
  const code = await createRoomAsLeader(leader, 'Alpha');
  const player = await newUser(browser, BRAVO_GPS);
  await joinRoom(player, code, 'Bravo');
  await expect(player.locator('.drawing-marker')).toHaveCount(0);

  await openTeam(leader);
  await leader.getByRole('button', { name: /Field A/ }).click();
  await expect(player.locator('.drawing-marker')).toHaveCount(1);
  await expect(leader.locator('.drawing-marker')).toHaveCount(1);
});

test('members cannot see the template picker', async ({ browser }) => {
  const leader = await newUser(browser, ALPHA_GPS);
  const player = await newUser(browser, BRAVO_GPS);
  const code = await createRoomAsLeader(leader, 'Alpha');
  await joinRoom(player, code, 'Bravo');

  await openTeam(leader);
  await expect(leader.getByRole('region', { name: 'Load a template' })).toBeVisible();
  await openTeam(player);
  await expect(player.getByRole('region', { name: 'Load a template' })).toHaveCount(0);
});

test('templates REST API: owner key required, input validated, scoped per owner', async ({ request }) => {
  const owner = { 'x-owner-key': 'a'.repeat(43) };
  const stranger = { 'x-owner-key': 'b'.repeat(43) };
  const body = {
    name: 'Field B',
    center: [30.52, 50.45],
    zoom: 16,
    features: {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          id: '11111111-1111-4111-8111-111111111111',
          geometry: { type: 'Point', coordinates: [30.52, 50.45] },
          properties: { kind: 'marker' },
        },
      ],
    },
  };

  expect((await request.get('/api/templates')).status()).toBe(401);
  expect((await request.post('/api/templates', { headers: owner, data: { ...body, name: '' } })).status()).toBe(400);
  expect((await request.post('/api/templates', { headers: owner, data: { ...body, center: [500, 0] } })).status()).toBe(400);

  const created = await request.post('/api/templates', { headers: owner, data: body });
  expect(created.status()).toBe(201);
  const { id } = await created.json();

  expect((await request.get(`/api/templates/${id}`, { headers: owner })).status()).toBe(200);
  expect((await request.get(`/api/templates/${id}`, { headers: stranger })).status()).toBe(404);
  expect((await request.put(`/api/templates/${id}`, { headers: stranger, data: body })).status()).toBe(404);
  expect((await request.delete(`/api/templates/${id}`, { headers: stranger })).status()).toBe(404);
  expect(await (await request.get('/api/templates', { headers: stranger })).json()).toEqual([]);
  expect((await request.get('/api/templates/not-an-id', { headers: owner })).status()).toBe(404);

  const renamed = await request.put(`/api/templates/${id}`, { headers: owner, data: { ...body, name: 'Field C' } });
  expect((await renamed.json()).name).toBe('Field C');
  expect((await request.delete(`/api/templates/${id}`, { headers: owner })).status()).toBe(204);
  expect((await request.get(`/api/templates/${id}`, { headers: owner })).status()).toBe(404);
});
