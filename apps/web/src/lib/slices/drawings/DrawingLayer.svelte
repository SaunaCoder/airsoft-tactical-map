<script lang="ts">
  import type { MapFeature } from '@airsoft/shared';
  import type L from 'leaflet';
  import { createDrawingLayer } from './drawing-layer.ts';

  let {
    map,
    features,
    editable,
    onedit = () => {},
    onremove = () => {},
  }: {
    map: L.Map;
    features: MapFeature[];
    editable: boolean;
    onedit?: (feature: MapFeature) => void;
    onremove?: (id: string) => void;
  } = $props();

  let layer = $state.raw<ReturnType<typeof createDrawingLayer>>();
  $effect(() => {
    const created = createDrawingLayer(map, editable, {
      onEdit: (feature) => onedit(feature),
      onRemove: (id) => onremove(id),
    });
    layer = created;
    return () => created.destroy();
  });

  $effect(() => {
    layer?.update(features);
  });
</script>
