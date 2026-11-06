<script lang="ts">
  import type { LngLat } from '@airsoft/shared';
  import type L from 'leaflet';
  import { FIELD_ZOOM, toLatLng } from '#lib/core/map.ts';

  let { map, position }: { map: L.Map; position: LngLat | null } = $props();
</script>

<button
  type="button"
  class="size-14 rounded-full bg-neutral-950 text-2xl text-white shadow-lg active:bg-neutral-800 disabled:opacity-50"
  aria-label="Center on me"
  disabled={!position}
  onclick={() => position && map.setView(toLatLng(position), Math.max(map.getZoom(), FIELD_ZOOM))}
>
  ◎
</button>
