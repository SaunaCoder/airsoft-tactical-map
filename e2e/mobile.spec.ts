import type { Page } from '@playwright/test';
import { createRoomAsLeader, expect, joinRoom, newUser, openTeam, test } from './fixtures.ts';

const ALPHA_GPS = { latitude: 50.45, longitude: 30.52 };
const MIN_TARGET = 48;

/** Visible interactive elements smaller than 48x48 CSS px (CLAUDE.md "Mobile-first"). */
function smallTouchTargets(page: Page): Promise<string[]> {
  return page.evaluate((min) => {
    const selector = [
      'button',
      'a[href]',
      'input',
      '[role="button"]',
      '.leaflet-buttons-control-button',
      '.leaflet-pm-action',
      '.leaflet-marker-icon.leaflet-interactive',
    ].join(',');
    return [...document.querySelectorAll<HTMLElement>(selector)].flatMap((el) => {
      // A radio or checkbox inside a label is hit through the whole label row.
      const target = el.matches('input[type="radio"], input[type="checkbox"]') ? (el.closest('label') ?? el) : el;
      const box = target.getBoundingClientRect();
      if (box.width === 0 || box.height === 0 || getComputedStyle(el).visibility === 'hidden') return [];
      // Tile attribution is legally required text, not a control anyone needs to hit.
      if (el.closest('.leaflet-control-attribution')) return [];
      if (box.width >= min && box.height >= min) return [];
      const label = (el.getAttribute('aria-label') ?? el.title ?? el.textContent ?? '').trim().slice(0, 30);
      return [`<${el.tagName.toLowerCase()} class="${el.className}"> "${label}" ${Math.round(box.width)}x${Math.round(box.height)}`];
    });
  }, MIN_TARGET);
}

test('every touch target is at least 48x48 px', async ({ browser }) => {
  const leader = await newUser(browser, ALPHA_GPS);

  await leader.goto('/');
  await expect(leader.getByRole('button', { name: 'Create room' })).toBeEnabled();
  expect(await smallTouchTargets(leader), 'home').toEqual([]);

  // Template list with an item, and the editor mid-drawing (Geoman's Finish/Cancel actions visible).
  await leader.goto('/templates/new');
  await leader.getByLabel('Template name').fill('Field A');
  await leader.getByTitle('Draw Marker').click();
  await leader.getByTestId('map').click({ position: { x: 100, y: 600 } });
  await leader.getByRole('button', { name: 'Save' }).click();
  await expect(leader.getByRole('status')).toHaveText('Saved');
  await leader.getByTitle('Draw Polygons').click();
  await leader.getByTestId('map').click({ position: { x: 80, y: 300 } });
  expect(await smallTouchTargets(leader), 'template editor').toEqual([]);
  await leader.goto('/templates');
  await expect(leader.getByRole('list', { name: 'Templates' })).toBeVisible();
  expect(await smallTouchTargets(leader), 'template list').toEqual([]);

  // Room as leader: map controls, then the Team sheet with QR and template picker.
  const code = await createRoomAsLeader(leader, 'Alpha');
  await leader.getByTitle('Draw Marker').click();
  await leader.getByTestId('map').click({ position: { x: 100, y: 600 } });
  await leader.getByTitle('Draw Marker').click();
  expect(await smallTouchTargets(leader), 'room map (leader)').toEqual([]);
  await leader.getByRole('button', { name: 'Layers' }).tap();
  await expect(leader.getByRole('radio', { name: 'Photo (EE)' })).toBeVisible();
  expect(await smallTouchTargets(leader), 'layer switcher').toEqual([]);
  await openTeam(leader);
  await leader.getByRole('button', { name: 'Show QR code' }).click();
  await expect(leader.getByRole('region', { name: 'Load a template' })).toContainText('Field A');
  expect(await smallTouchTargets(leader), 'team sheet (leader)').toEqual([]);

  // Room as player, including the name prompt.
  const player = await newUser(browser, ALPHA_GPS);
  await player.goto(`/room/${code}`);
  await expect(player.getByLabel('Your name')).toBeVisible();
  expect(await smallTouchTargets(player), 'name prompt').toEqual([]);
  await joinRoom(player, code, 'Bravo');
  expect(await smallTouchTargets(player), 'room map (player)').toEqual([]);
});
