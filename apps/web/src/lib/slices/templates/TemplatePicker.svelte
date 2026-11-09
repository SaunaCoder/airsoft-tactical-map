<script lang="ts">
  import type { TemplateLoad, TemplateSummary } from '@airsoft/shared';
  import type L from 'leaflet';
  import { resolve } from '$app/paths';
  import { toLatLng } from '#lib/core/map.ts';
  import { listTemplates } from './templates.api.ts';
  import { ownerKey } from './templates.storage.ts';

  // Leader only. Loading appends the template's drawings to the room for everyone.
  let { map, onload }: { map: L.Map; onload: (load: TemplateLoad) => void } = $props();

  let templates = $state<TemplateSummary[] | null>(null);
  let error = $state('');
  listTemplates()
    .then((list) => (templates = list))
    .catch(() => (error = 'Could not load templates.'));

  function load(template: TemplateSummary) {
    onload({ templateId: template.id, ownerKey: ownerKey() });
    map.setView(toLatLng(template.center), template.zoom);
  }
</script>

<section class="flex flex-col gap-2" aria-label="Load a template">
  <h3 class="text-sm font-bold uppercase tracking-widest text-olive-400">Load a template</h3>
  {#if error}
    <p role="alert" class="text-red-400">{error}</p>
  {:else if templates?.length === 0}
    <p class="text-olive-400">
      No templates on this device yet. <a href={resolve('/templates')} class="text-accent-400 underline">Create one</a>.
    </p>
  {:else if templates}
    {#each templates as template (template.id)}
      <button
        type="button"
        class="flex min-h-12 items-center justify-between bg-olive-900 px-4 text-left text-lg active:bg-olive-800"
        onclick={() => load(template)}
      >
        <span>{template.name}</span>
        <span class="font-bold uppercase tracking-wider text-accent-400">Load</span>
      </button>
    {/each}
  {/if}
</section>
