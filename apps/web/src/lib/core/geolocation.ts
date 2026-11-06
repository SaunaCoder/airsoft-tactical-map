import type { LngLat } from '@airsoft/shared';

export type GpsStatus = 'locating' | 'ok' | 'denied' | 'unavailable' | 'unsupported';

/** Watches the device position. Returns a stop function. */
export function watchGps(onFix: (position: LngLat) => void, onStatus: (status: GpsStatus) => void): () => void {
  if (!('geolocation' in navigator)) {
    onStatus('unsupported');
    return () => {};
  }
  onStatus('locating');
  const id = navigator.geolocation.watchPosition(
    (pos) => {
      onStatus('ok');
      onFix([pos.coords.longitude, pos.coords.latitude]);
    },
    // Timeouts and lost signal keep the watch alive; it recovers on the next fix.
    (err) => onStatus(err.code === err.PERMISSION_DENIED ? 'denied' : 'unavailable'),
    { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 },
  );
  return () => navigator.geolocation.clearWatch(id);
}
