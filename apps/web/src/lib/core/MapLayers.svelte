<script lang="ts">
  import type L from 'leaflet';
  import { BASE_LAYERS, labelsLayer, type BaseLayerName } from './map.ts';

  // Owns the map's tile layers and the bottom sheet to pick them. The sheet opens from the
  // layers button in Leaflet's control stack (see createMap); any tap outside it closes it.
  let { map, open = $bindable(false) }: { map: L.Map; open?: boolean } = $props();

  const STORAGE_KEY = 'baseLayer';
  const names = Object.keys(BASE_LAYERS) as BaseLayerName[];

  let base = $state(savedBase());
  let labels = $state(false);

  function savedBase(): BaseLayerName {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && Object.hasOwn(BASE_LAYERS, saved)) return saved as BaseLayerName;
    } catch {
      // Storage blocked (private mode): fall back to the default.
    }
    return names[0];
  }

  $effect(() => {
    const layer = BASE_LAYERS[base]().addTo(map);
    try {
      localStorage.setItem(STORAGE_KEY, base);
    } catch {
      // Not remembered, still works.
    }
    return () => void layer.remove();
  });

  $effect(() => {
    if (!labels) return;
    const layer = labelsLayer().addTo(map);
    return () => void layer.remove();
  });
</script>

<svelte:window onkeydown={(e) => e.key === 'Escape' && (open = false)} />

{#if open}
  <!-- Catches the outside tap so it closes the sheet instead of reaching the map (e.g. adding a vertex). -->
  <button type="button" class="absolute inset-0 z-[1250] cursor-default bg-black/40" aria-label="Close map layers" onclick={() => (open = false)}></button>
  <section
    class="absolute inset-x-0 bottom-0 z-[1300] flex flex-col gap-2 border-t-4 border-accent-500 bg-olive-950 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] text-olive-50 shadow-2xl"
    aria-label="Map layers"
  >
    <h2 class="mb-1 text-xl font-bold uppercase tracking-wider">Map layers</h2>
    <fieldset class="flex flex-col gap-2">
      <legend class="sr-only">Base map</legend>
      {#each names as name (name)}
        <label
          class="flex min-h-12 items-center gap-3 border-2 px-4 text-lg font-semibold {base === name ? 'border-accent-500 bg-olive-900' : 'border-olive-700'}"
        >
          <input type="radio" name="base-layer" value={name} bind:group={base} class="size-5 accent-accent-500" />
          {name}
        </label>
      {/each}
    </fieldset>
    <label class="mt-2 flex min-h-12 items-center gap-3 border-2 px-4 text-lg font-semibold {labels ? 'border-accent-500 bg-olive-900' : 'border-olive-700'}">
      <input type="checkbox" bind:checked={labels} class="size-5 accent-accent-500" />
      Labels (EE)
      <span class="text-sm font-normal text-olive-400">roads and place names</span>
    </label>
  </section>
{/if}
