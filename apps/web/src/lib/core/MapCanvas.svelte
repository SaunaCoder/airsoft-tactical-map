<script lang="ts">
  import type L from 'leaflet';
  import { createMap } from './map.ts';

  let { map = $bindable() }: { map?: L.Map } = $props();

  function mount(el: HTMLElement) {
    const created = createMap(el);
    map = created;
    return () => {
      map = undefined;
      // Sibling components (markers, drawings, Geoman controls) clean up their layers in the same
      // synchronous teardown; removing the map first would make their cleanup hit a dead map.
      queueMicrotask(() => created.remove());
    };
  }
</script>

<div {@attach mount} class="absolute inset-0" data-testid="map"></div>
