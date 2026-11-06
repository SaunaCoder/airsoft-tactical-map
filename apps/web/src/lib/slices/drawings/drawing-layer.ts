import { mapFeatureSchema, type MapFeature } from '@airsoft/shared';
import L from 'leaflet';
import { toLatLng } from '#lib/core/map.ts';
import { arrowHead } from './arrow.ts';

export const DRAWING_COLOR = '#f59e0b';
const ZONE_COLOR = '#ef4444';

export const markerIcon = L.divIcon({
  className: 'drawing-marker-hit',
  html: '<div class="drawing-marker"></div>',
  // 48px hit area for thumbs; the visible diamond is 26px (app.css).
  iconSize: [48, 48],
  iconAnchor: [24, 24],
});

type Callbacks = { onEdit: (feature: MapFeature) => void; onRemove: (id: string) => void };
type Entry = { json: string; layers: L.Layer[] };

/** The editable layer is first; extras (an arrowhead) are display-only. */
function createLayers(feature: MapFeature, editable: boolean): L.Layer[] {
  const pmIgnore = !editable;
  switch (feature.properties.kind) {
    case 'marker':
      if (feature.geometry.type !== 'Point') return [];
      return [L.marker(toLatLng(feature.geometry.coordinates), { icon: markerIcon, pmIgnore })];
    case 'line':
    case 'arrow': {
      if (feature.geometry.type !== 'LineString') return [];
      const coords = feature.geometry.coordinates;
      const style = { color: DRAWING_COLOR, weight: 5, className: `drawing-${feature.properties.kind}` };
      const line = L.polyline(coords.map(toLatLng), { ...style, pmIgnore });
      if (feature.properties.kind === 'line' || coords.length < 2) return [line];
      const head = arrowHead(coords.at(-2)!, coords.at(-1)!);
      return [line, L.polyline(head.map(toLatLng), { ...style, pmIgnore: true, interactive: false })];
    }
    case 'zone':
      if (feature.geometry.type !== 'Polygon') return [];
      return [
        L.polygon(
          feature.geometry.coordinates.map((ring) => ring.map(toLatLng)),
          { color: ZONE_COLOR, weight: 3, fillOpacity: 0.15, className: 'drawing-zone', pmIgnore },
        ),
      ];
  }
}

/**
 * Renders the room's drawings purely from server-confirmed state. For the leader, Geoman edits and
 * removals are reported through the callbacks; the map only changes when the server echoes them back.
 */
export function createDrawingLayer(map: L.Map, editable: boolean, callbacks: Callbacks) {
  const entries = new Map<string, Entry>();

  function add(feature: MapFeature): L.Layer[] {
    const layers = createLayers(feature, editable);
    for (const layer of layers) layer.addTo(map);
    const main = layers[0];
    if (editable && main) {
      main.on('pm:edit', () => {
        const geometry = (main as L.Polyline | L.Marker).toGeoJSON().geometry;
        const edited = mapFeatureSchema.safeParse({ ...feature, geometry });
        if (edited.success) callbacks.onEdit(edited.data);
      });
      main.on('pm:remove', () => callbacks.onRemove(feature.id));
      // Recreated layers must rejoin a global edit session that is still running.
      if (map.pm.globalEditModeEnabled()) (main as L.Polyline).pm.enable();
    }
    return layers;
  }

  function remove(entry: Entry): void {
    for (const layer of entry.layers) layer.remove();
  }

  function update(features: MapFeature[]): void {
    const seen = new Set<string>();
    for (const feature of features) {
      seen.add(feature.id);
      const json = JSON.stringify(feature);
      const entry = entries.get(feature.id);
      // Unchanged and still on the map (a rejected local removal is re-added here).
      if (entry && entry.json === json && entry.layers.every((l) => map.hasLayer(l))) continue;
      if (entry) remove(entry);
      // Keep a plain copy: `feature` may be a Svelte state proxy.
      entries.set(feature.id, { json, layers: add(JSON.parse(json) as MapFeature) });
    }
    for (const [id, entry] of entries) {
      if (seen.has(id)) continue;
      remove(entry);
      entries.delete(id);
    }
  }

  function destroy(): void {
    for (const entry of entries.values()) remove(entry);
    entries.clear();
  }

  return { update, destroy };
}
