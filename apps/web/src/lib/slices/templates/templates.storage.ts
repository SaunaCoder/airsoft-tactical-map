const OWNER_KEY = 'templateOwnerKey';

/**
 * This device's template owner key, created on first use (256 random bits, base64url).
 * It is the only way to reach these templates: clearing site data loses access to them.
 */
// ponytail: device-bound ownership; exporting templates as GeoJSON (P2-4) is the backup path.
export function ownerKey(): string {
  let key = localStorage.getItem(OWNER_KEY);
  if (!key) {
    const bytes = crypto.getRandomValues(new Uint8Array(32));
    key = btoa(String.fromCharCode(...bytes))
      .replaceAll('+', '-')
      .replaceAll('/', '_')
      .replace(/=+$/, '');
    localStorage.setItem(OWNER_KEY, key);
  }
  return key;
}
