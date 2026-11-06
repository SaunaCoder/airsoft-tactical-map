<script lang="ts">
  import type L from 'leaflet';
  import { createMap } from './map.ts';

  let { map = $bindable() }: { map?: L.Map } = $props();

  function mount(el: HTMLElement) {
    const created = createMap(el);
    map = created;
    return () => {
      created.remove();
      map = undefined;
    };
  }
</script>

<div {@attach mount} class="absolute inset-0" data-testid="map"></div>
