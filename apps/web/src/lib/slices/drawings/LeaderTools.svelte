<script lang="ts">
  import { drawingSchema, Events, type DrawingKind } from '@airsoft/shared';
  import type L from 'leaflet';
  import type { AppSocket } from '#lib/core/socket.ts';
  import { DRAWING_COLOR, markerIcon } from './drawing-layer.ts';

  // Rendered for the leader only. That is cosmetic: the server rejects drawing events from members.
  let { map, socket }: { map: L.Map; socket: AppSocket } = $props();

  const KIND_BY_SHAPE: Record<string, DrawingKind> = { Marker: 'marker', Line: 'line', Arrow: 'arrow', Polygon: 'zone' };

  $effect(() => {
    map.pm.addControls({
      position: 'topright',
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
    map.pm.Toolbar.copyDrawControl('Line', {
      name: 'Arrow',
      block: 'draw',
      title: 'Draw Arrow',
      className: 'control-icon leaflet-pm-icon-polyline arrow-icon',
    });
    map.pm.setGlobalOptions({
      markerStyle: { icon: markerIcon },
      pathOptions: { color: DRAWING_COLOR, weight: 5 },
      templineStyle: { color: DRAWING_COLOR },
      hintlineStyle: { color: DRAWING_COLOR, dashArray: [5, 5] },
    });

    // Geoman's shape is only a sketch: send it to the server and drop it. The confirmed feature comes
    // back as feature:added and is rendered like everyone else's.
    const onCreate = ({ shape, layer }: { shape: string; layer: L.Layer }) => {
      layer.remove();
      const drawing = drawingSchema.safeParse({
        geometry: (layer as L.Polyline | L.Marker).toGeoJSON().geometry,
        properties: { kind: KIND_BY_SHAPE[shape] },
      });
      if (drawing.success) socket.emit(Events.featureAdd, drawing.data);
    };
    map.on('pm:create', onCreate);

    return () => {
      map.off('pm:create', onCreate);
      map.pm.removeControls();
    };
  });
</script>
