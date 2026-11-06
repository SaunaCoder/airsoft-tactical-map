<script lang="ts">
  import { Events, type MapFeature } from '@airsoft/shared';
  import type L from 'leaflet';
  import type { AppSocket } from '#lib/core/socket.ts';
  import { createDrawingLayer } from './drawing-layer.ts';

  let {
    map,
    features,
    editable,
    socket,
  }: { map: L.Map; features: MapFeature[]; editable: boolean; socket: AppSocket } = $props();

  let layer = $state.raw<ReturnType<typeof createDrawingLayer>>();
  $effect(() => {
    const created = createDrawingLayer(map, editable, {
      onEdit: (feature) => socket.emit(Events.featureUpdate, feature),
      onRemove: (id) => socket.emit(Events.featureDelete, { id }),
    });
    layer = created;
    return () => created.destroy();
  });

  $effect(() => {
    layer?.update(features);
  });
</script>
