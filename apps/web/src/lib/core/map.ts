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

/** Base layers, first is the default. Factories: every map needs its own layer instances. */
export const BASE_LAYERS = {
  'Photo (EE)': () => landBoardLayer('foto'),
  'Topo (EE)': () => landBoardLayer('kaart'),
  'World Simple': () =>
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxNativeZoom: 19,
      maxZoom: MAX_ZOOM,
      attribution: OSM_ATTRIBUTION,
    }),
};
export type BaseLayerName = keyof typeof BASE_LAYERS;

/** Road and place names, drawn above whichever base layer is active. */
export const labelsLayer = () => landBoardLayer('hybriid').setZIndex(2);

export function createMap(el: HTMLElement, onLayers: () => void): L.Map {
  // With opt-in, the map itself must opt in too, or `map.pm` is never created.
  const map = L.map(el, { zoomControl: false, pmIgnore: false, maxZoom: MAX_ZOOM }).setView([20, 0], 2);

  // Bottom-right is in thumb reach for one-handed use. Bottom corners stack the newest control on top,
  // so zoom stays lowest and the layers button sits above it.
  L.control.zoom({ position: 'bottomright' }).addTo(map);
  const layersButton = new L.Control({ position: 'bottomright' });
  layersButton.onAdd = () => {
    const bar = L.DomUtil.create('div', 'leaflet-bar');
    const link = L.DomUtil.create('a', 'layers-toggle', bar);
    link.href = '#';
    link.title = 'Map layers';
    link.setAttribute('role', 'button');
    link.setAttribute('aria-label', 'Map layers');
    // Without this a tap on the button would also reach the map (and e.g. add a drawing vertex).
    L.DomEvent.disableClickPropagation(bar);
    L.DomEvent.on(link, 'click', (e) => {
      L.DomEvent.preventDefault(e);
      onLayers();
    });
    return bar;
  };
  layersButton.addTo(map);
  return map;
}
