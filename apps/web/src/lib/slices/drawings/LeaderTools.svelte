<script lang="ts">
  import { drawingSchema, type Drawing, type DrawingKind } from '@airsoft/shared';
  import type L from 'leaflet';
  import { DRAWING_COLOR, markerIcon } from './drawing-layer.ts';

  // In a room it is rendered for the leader only. That is cosmetic: the server rejects drawing events from members.
  let { map, oncreate }: { map: L.Map; oncreate: (drawing: Drawing) => void } = $props();

  const KIND_BY_SHAPE: Record<string, DrawingKind> = { Marker: 'marker', Line: 'line', Arrow: 'arrow', Polygon: 'zone' };

  // Geoman's private draw API, the same calls its own Finish / Remove Last Vertex actions make.
  type PathDraw = { _layer: L.Polyline; _markers: L.Marker[]; _finishShape(): void; _removeLastVertex(): void };
  const pathDraw = (target: L.Map, shape: string) => (target.pm.Draw as unknown as Record<string, PathDraw>)[shape];

  /** The path shape being drawn (Undo applies), or null. */
  let pathShape = $state<string | null>(null);

  function undo() {
    if (!pathShape) return;
    const draw = pathDraw(map, pathShape);
    if (draw._markers.length > 1) return draw._removeLastVertex();
    // Geoman's own undo would leave the tool on the last vertex; start the shape over instead.
    const shape = pathShape;
    map.pm.disableDraw();
    map.pm.enableDraw(shape);
  }

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
    // No Finish / Cancel strips: re-tapping the tool finishes a line (below), tapping it with nothing
    // drawn turns it off, and Undo is its own button.
    for (const name of ['Marker', 'Line', 'Polygon', 'Arrow', 'Edit', 'Removal']) target.pm.Toolbar.changeActionsOfControl(name, []);
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

    const onDrawStart = ({ shape }: { shape: string }) => (pathShape = shape === 'Marker' ? null : shape);
    const onDrawEnd = () => (pathShape = null);
    target.on('pm:drawstart', onDrawStart);
    target.on('pm:drawend', onDrawEnd);

    // Re-tapping the active Line / Arrow tool saves the line instead of discarding it. Capture phase, so
    // this runs before Geoman's own click handler on the button, which would toggle the tool off.
    // Polygons close by tapping their first vertex, so their tool keeps Geoman's plain toggle.
    const onToolTap = (e: MouseEvent) => {
      const shape = target.pm.Draw.getActiveShape();
      if (shape !== 'Line' && shape !== 'Arrow') return;
      if (!(e.target as Element).closest('.button-container.active')) return;
      const draw = pathDraw(target, shape);
      if (draw._layer.getLatLngs().length < 2) return;
      e.stopPropagation();
      draw._finishShape();
    };
    target.getContainer().addEventListener('click', onToolTap, true);

    return () => {
      target.off('pm:create', onCreate);
      target.off('pm:drawstart', onDrawStart);
      target.off('pm:drawend', onDrawEnd);
      target.getContainer().removeEventListener('click', onToolTap, true);
      // Also end any mode in progress, e.g. when the tools hide because the connection dropped.
      // (Geoman warns when disabling a mode that isn't on, hence the checks.)
      target.pm.disableDraw();
      if (target.pm.globalEditModeEnabled()) target.pm.disableGlobalEditMode();
      if (target.pm.globalRemovalModeEnabled()) target.pm.disableGlobalRemovalMode();
      target.pm.removeControls();
    };
  });
</script>

{#if pathShape}
  <!-- Above the Center on me button (room page); thumb reach, and clear of Geoman's toolbar. -->
  <button
    type="button"
    class="absolute bottom-[calc(max(1.5rem,env(safe-area-inset-bottom))+4.5rem)] left-3 z-[1100] flex size-14 items-center justify-center border-2 border-olive-700 bg-olive-950/90 text-accent-400 shadow-lg active:bg-olive-800"
    aria-label="Undo last point"
    onclick={undo}
  >
    <svg viewBox="0 0 24 24" class="size-8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M9 14 4 9l5-5" />
      <path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" />
    </svg>
  </button>
{/if}
