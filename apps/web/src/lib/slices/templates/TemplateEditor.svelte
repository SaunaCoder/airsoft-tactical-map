<script lang="ts">
  import { templateInputSchema, type Drawing, type MapFeature, type Template } from '@airsoft/shared';
  import type L from 'leaflet';
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { watchGps } from '#lib/core/geolocation.ts';
  import { FIELD_ZOOM, toLatLng, toLngLat } from '#lib/core/map.ts';
  import MapCanvas from '#lib/core/MapCanvas.svelte';
  import { DrawingLayer, LeaderTools } from '#lib/slices/drawings/index.ts';
  import { saveTemplate } from './templates.api.ts';

  let { template }: { template: Template | null } = $props();

  // Editing is local until Save; the template is one document, saved whole.
  // svelte-ignore state_referenced_locally
  let id = $state(template?.id ?? null);
  // svelte-ignore state_referenced_locally
  let name = $state(template?.name ?? '');
  // svelte-ignore state_referenced_locally
  let features = $state<MapFeature[]>(template?.features.features ?? []);
  let map = $state<L.Map>();
  let status = $state<{ ok: boolean; text: string } | null>(null);
  let saving = $state(false);

  $effect(() => {
    if (!map) return;
    if (template) {
      map.setView(toLatLng(template.center), template.zoom);
      return;
    }
    // New template: start where the device is, if it will tell us. Otherwise the user pans to the field.
    const target = map;
    const stop = watchGps(
      (position) => {
        target.setView(toLatLng(position), FIELD_ZOOM);
        stop();
      },
      () => {},
    );
    return stop;
  });

  function add(drawing: Drawing) {
    features.push({ type: 'Feature', id: crypto.randomUUID(), ...drawing });
  }

  function edit(feature: MapFeature) {
    features = features.map((f) => (f.id === feature.id ? feature : f));
  }

  function remove(featureId: string) {
    features = features.filter((f) => f.id !== featureId);
  }

  async function save() {
    if (!map) return;
    const input = templateInputSchema.safeParse({
      name,
      center: toLngLat(map.getCenter()),
      zoom: map.getZoom(),
      features: { type: 'FeatureCollection', features: $state.snapshot(features) },
    });
    if (!input.success) {
      status = { ok: false, text: input.error.issues[0]?.message ?? 'Invalid template' };
      return;
    }
    saving = true;
    try {
      const saved = await saveTemplate(id, input.data);
      // Shallow: the URL now names the saved template, without reloading the editor.
      if (!id) await goto(resolve('/templates/[id]', { id: saved.id }), { shallow: true, replace: true });
      id = saved.id;
      status = { ok: true, text: 'Saved' };
    } catch (err) {
      status = { ok: false, text: err instanceof Error ? err.message : 'Could not save' };
    } finally {
      saving = false;
    }
  }
</script>

<main class="fixed inset-0 bg-olive-950 text-olive-50">
  <MapCanvas bind:map />
  {#if map}
    <DrawingLayer {map} {features} editable onedit={edit} onremove={remove} />
    <LeaderTools {map} oncreate={add} />
  {/if}

  <div
    class="pointer-events-none absolute inset-x-0 top-0 z-[1100] flex flex-col gap-2 p-3 pt-[max(0.75rem,env(safe-area-inset-top))]"
  >
    <header class="pointer-events-auto flex items-center gap-2 border border-olive-700 bg-olive-950/90 p-2 shadow-lg">
      <a
        href={resolve('/templates')}
        class="flex min-h-12 min-w-12 items-center justify-center text-2xl active:bg-olive-800"
        aria-label="Back to templates">&larr;</a
      >
      <input
        bind:value={name}
        placeholder="Template name"
        aria-label="Template name"
        maxlength="60"
        class="min-h-12 min-w-0 flex-1 border-2 border-olive-700 bg-olive-900 px-3 text-lg focus:border-accent-500 focus:outline-none"
      />
      <button
        type="button"
        class="min-h-12 bg-accent-500 px-5 text-lg font-bold text-olive-950 uppercase tracking-wider active:bg-accent-600 disabled:opacity-60"
        disabled={saving}
        onclick={save}
      >
        Save
      </button>
    </header>
    {#if status}
      <p
        role={status.ok ? 'status' : 'alert'}
        class={[
          'pointer-events-auto self-start px-4 py-2 font-semibold shadow-lg',
          status.ok ? 'bg-accent-500 text-olive-950' : 'bg-red-900/95 text-white',
        ]}
      >
        {status.text}
      </p>
    {/if}
  </div>
</main>
