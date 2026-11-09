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
// Past the providers' native zoom Leaflet upscales the last real tiles instead of showing grey.
const MAX_ZOOM = 20;

// Geoman only touches layers that opt in with `pmIgnore: false`, so member dots can never be edited or removed.
L.PM.setOptIn(true);

const OSM_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
// Open data licence: name the source and the data's age. https://geoportaal.maaamet.ee/avaandmete-litsents
const LAND_BOARD_ATTRIBUTION = `<a href="https://geoportaal.maaamet.ee/">Estonian Land Board</a> ${new Date().getFullYear()}`;

/** Maa- ja Ruumiamet tiles in Web Mercator (`@GMC`), TMS row order, Estonia only, native up to zoom 18. */
function landBoardLayer(name: 'foto' | 'kaart' | 'hybriid'): L.TileLayer {
  return L.tileLayer(`https://tiles.maaamet.ee/tm/tms/1.0.0/${name}@GMC/{z}/{x}/{y}.png`, {
    tms: true,
    maxNativeZoom: 18,
    maxZoom: MAX_ZOOM,
    attribution: LAND_BOARD_ATTRIBUTION,
  });
}

const BASE_LAYER_KEY = 'baseLayer';

function savedBaseLayer(): string | null {
  try {
    return localStorage.getItem(BASE_LAYER_KEY);
  } catch {
    return null;
  }
}

export function createMap(el: HTMLElement): L.Map {
  // With opt-in, the map itself must opt in too, or `map.pm` is never created.
  const map = L.map(el, { zoomControl: false, pmIgnore: false, maxZoom: MAX_ZOOM }).setView([20, 0], 2);

  // OSM stays the default: it covers the whole world, the Land Board layers only Estonia.
  const baseLayers: Record<string, L.TileLayer> = {
    Map: L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxNativeZoom: 19,
      maxZoom: MAX_ZOOM,
      attribution: OSM_ATTRIBUTION,
    }),
    'Photo (EE)': landBoardLayer('foto'),
    'Topo (EE)': landBoardLayer('kaart'),
  };
  (baseLayers[savedBaseLayer() ?? ''] ?? baseLayers.Map).addTo(map);
  map.on('baselayerchange', (e: L.LayersControlEvent) => {
    try {
      localStorage.setItem(BASE_LAYER_KEY, e.name);
    } catch {
      // Storage blocked (private mode): the choice just isn't remembered.
    }
  });

  // Bottom-right is in thumb reach for one-handed use. Bottom corners stack the newest control on top,
  // so zoom stays lowest and the layer switcher sits above it.
  L.control.zoom({ position: 'bottomright' }).addTo(map);
  L.control.layers(baseLayers, { 'Labels (EE)': landBoardLayer('hybriid') }, { position: 'bottomright' }).addTo(map);
  return map;
}
