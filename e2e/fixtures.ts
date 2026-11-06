import { test as base, expect, type Browser, type BrowserContext, type Page } from '@playwright/test';

// Tests never hit the public OSM tile servers: it's slow, flaky and against their usage policy.
const OSM_TILES = 'https://tile.openstreetmap.org/**';

/** Contexts opened by `newUser` in the current test; closed after it so a long run can't exhaust the browser. */
const userContexts: BrowserContext[] = [];

export const test = base.extend<{ closeUsers: void }>({
  context: async ({ context }, use) => {
    await context.route(OSM_TILES, (route) => route.abort());
    await use(context);
  },
  closeUsers: [
    // eslint-disable-next-line no-empty-pattern -- Playwright fixtures must destructure their dependencies.
    async ({}, use) => {
      await use();
      await Promise.all(userContexts.splice(0).map((context) => context.close()));
    },
    { auto: true },
  ],
});

export { expect };

type Geolocation = { latitude: number; longitude: number };

/** A separate user (own browser context = own localStorage), optionally with a mocked GPS fix. */
export async function newUser(browser: Browser, geolocation?: Geolocation): Promise<Page> {
  const context = await browser.newContext(geolocation ? { geolocation, permissions: ['geolocation'] } : {});
  userContexts.push(context);
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
