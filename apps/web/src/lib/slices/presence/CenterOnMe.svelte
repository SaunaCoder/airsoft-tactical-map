<script lang="ts">
  import type { LngLat } from '@airsoft/shared';
  import type L from 'leaflet';
  import { FIELD_ZOOM, toLatLng } from '#lib/core/map.ts';

  let { map, position }: { map: L.Map; position: LngLat | null } = $props();
</script>

<button
  type="button"
  class="flex size-14 items-center justify-center border-2 border-olive-700 bg-olive-950/90 text-lime-400 shadow-lg active:bg-olive-800 disabled:text-olive-500"
  aria-label="Center on me"
  disabled={!position}
  onclick={() => position && map.setView(toLatLng(position), Math.max(map.getZoom(), FIELD_ZOOM))}
>
  <!-- Crosshair -->
  <svg viewBox="0 0 24 24" class="size-8" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
    <circle cx="12" cy="12" r="7" />
    <path d="M12 1v6M12 17v6M1 12h6M17 12h6" />
  </svg>
</button>
