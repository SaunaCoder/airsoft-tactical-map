<script lang="ts">
  import { drawingSchema, type Drawing, type DrawingKind } from '@airsoft/shared';
  import type L from 'leaflet';
  import { DRAWING_COLOR, markerIcon } from './drawing-layer.ts';

  // In a room it is rendered for the leader only. That is cosmetic: the server rejects drawing events from members.
  let { map, oncreate }: { map: L.Map; oncreate: (drawing: Drawing) => void } = $props();

  const KIND_BY_SHAPE: Record<string, DrawingKind> = { Marker: 'marker', Line: 'line', Arrow: 'arrow', Polygon: 'zone' };

  $effect(() => {
    // Props are live getters: by cleanup time `map` may already be unset, so hold on to this one.
    const target = map;
    target.pm.addControls({
      // Bottom-right, stacked above zoom: within thumb reach.
      position: 'bottomright',
      drawMarker: true,
      drawPolyline: true,
      drawPolygon: true,
      drawCircle: false,
      drawCircleMarker: false,
      drawRectangle: false,
      drawText: false,
      cutPolygon: false,
      rotateMode: false,
      dragMode: false,
      editMode: true,
      removalMode: true,
    });
    // Geoman registers a custom control (and its draw mode) for the map's lifetime, and
    // removeControls()/addControls() hide and show it with the rest. So create it once per map.
    if (!target.pm.Toolbar.controlExists('Arrow')) {
      target.pm.Toolbar.copyDrawControl('Line', {
        name: 'Arrow',
        block: 'draw',
        title: 'Draw Arrow',
        className: 'control-icon arrow-icon',
      });
    }
    target.pm.setGlobalOptions({
      markerStyle: { icon: markerIcon },
      pathOptions: { color: DRAWING_COLOR, weight: 5 },
      templineStyle: { color: DRAWING_COLOR },
      hintlineStyle: { color: DRAWING_COLOR, dashArray: [5, 5] },
    });

    // Geoman's shape is only a sketch: hand it over and drop it. The owner of the data (the server in a
    // room, the editor for a template) adds the real feature, which DrawingLayer then renders.
    const onCreate = ({ shape, layer }: { shape: string; layer: L.Layer }) => {
      layer.remove();
      const drawing = drawingSchema.safeParse({
        geometry: (layer as L.Polyline | L.Marker).toGeoJSON().geometry,
        properties: { kind: KIND_BY_SHAPE[shape] },
      });
      if (drawing.success) oncreate(drawing.data);
    };
    target.on('pm:create', onCreate);

    return () => {
      target.off('pm:create', onCreate);
      // Also end any mode in progress, e.g. when the tools hide because the connection dropped.
      // (Geoman warns when disabling a mode that isn't on, hence the checks.)
      target.pm.disableDraw();
      if (target.pm.globalEditModeEnabled()) target.pm.disableGlobalEditMode();
      if (target.pm.globalRemovalModeEnabled()) target.pm.disableGlobalRemovalMode();
      target.pm.removeControls();
    };
  });
</script>
