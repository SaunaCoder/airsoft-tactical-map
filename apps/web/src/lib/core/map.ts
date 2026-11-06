import 'leaflet/dist/leaflet.css';
import './leaflet-global.ts';
import '@geoman-io/leaflet-geoman-free';
import '@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css';
import type { LngLat } from '@airsoft/shared';
import L from 'leaflet';

// The Leaflet boundary: the rest of the app speaks GeoJSON [lng, lat]; Leaflet speaks [lat, lng].
// ponytail: slices still touch Leaflet layers directly; a MapLibre swap (P2-2) would wrap those too.
export const toLatLng = ([lng, lat]: LngLat): L.LatLngTuple => [lat, lng];
export const toLngLat = (latLng: L.LatLng): LngLat => [latLng.lng, latLng.lat];

export const FIELD_ZOOM = 17;

// Geoman only touches layers that opt in with `pmIgnore: false`, so member dots can never be edited or removed.
L.PM.setOptIn(true);

export function createMap(el: HTMLElement): L.Map {
  // With opt-in, the map itself must opt in too, or `map.pm` is never created.
  const map = L.map(el, { zoomControl: false, pmIgnore: false }).setView([20, 0], 2);
  // Bottom-right is in thumb reach for one-handed use.
  L.control.zoom({ position: 'bottomright' }).addTo(map);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(map);
  return map;
}
