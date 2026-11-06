import { test as base, expect, type Browser, type Page } from '@playwright/test';

// Tests never hit the public OSM tile servers: it's slow, flaky and against their usage policy.
const OSM_TILES = 'https://tile.openstreetmap.org/**';

export const test = base.extend({
  context: async ({ context }, use) => {
    await context.route(OSM_TILES, (route) => route.abort());
    await use(context);
  },
});

export { expect };

type Geolocation = { latitude: number; longitude: number };

/** A separate user (own browser context = own localStorage), optionally with a mocked GPS fix. */
export async function newUser(browser: Browser, geolocation?: Geolocation): Promise<Page> {
  const context = await browser.newContext(geolocation ? { geolocation, permissions: ['geolocation'] } : {});
  await context.route(OSM_TILES, (route) => route.abort());
  return context.newPage();
}

/** Creates a room from the home page, joins it under `name`, and returns the join code. */
export async function createRoomAsLeader(page: Page, name: string): Promise<string> {
  await page.goto('/');
  await page.getByRole('button', { name: 'Create room' }).click();
  await expect(page).toHaveURL(/\/room\/[A-HJKMNP-Z2-9]{6}$/);

  await enterName(page, name);
  await expect(page.getByText('Leader', { exact: true })).toBeVisible();
  return (await page.getByTestId('join-code').textContent())!;
}

/** Opens a room link directly (as after scanning the QR) and joins under `name`. */
export async function joinRoom(page: Page, code: string, name: string): Promise<void> {
  await page.goto(`/room/${code}`);
  await enterName(page, name);
}

export async function enterName(page: Page, name: string): Promise<void> {
  await page.getByLabel('Your name').fill(name);
  await page.getByRole('button', { name: 'Join', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Team' })).toBeVisible();
}

/** Opens the Team sheet and returns its member list. */
export async function openTeam(page: Page) {
  await page.getByRole('button', { name: 'Team' }).click();
  return page.getByRole('list', { name: 'Members' });
}

/** The permanent name label Leaflet renders next to a member's dot. */
export function memberLabel(page: Page, name: string) {
  return page.locator('.leaflet-tooltip', { hasText: name });
}
