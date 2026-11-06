<script lang="ts">
  import type { TemplateSummary } from '@airsoft/shared';
  import { resolve } from '$app/paths';
  import { deleteTemplate, listTemplates } from './templates.api.ts';

  let templates = $state<TemplateSummary[] | null>(null);
  let error = $state('');

  async function load() {
    try {
      templates = await listTemplates();
    } catch {
      error = 'Could not load templates. Check your connection.';
    }
  }
  load();

  async function remove(template: TemplateSummary) {
    if (!confirm(`Delete "${template.name}"?`)) return;
    try {
      await deleteTemplate(template.id);
      templates = templates?.filter((t) => t.id !== template.id) ?? null;
    } catch {
      error = 'Could not delete the template.';
    }
  }
</script>

<a
  href={resolve('/templates/[id]', { id: 'new' })}
  class="flex min-h-14 items-center justify-center rounded-xl bg-amber-400 px-6 text-lg font-bold text-neutral-950 active:bg-amber-500"
>
  New template
</a>

{#if error}
  <p role="alert" class="text-red-400">{error}</p>
{/if}

{#if templates === null && !error}
  <p class="text-neutral-400">Loading...</p>
{:else if templates?.length === 0}
  <p class="text-neutral-400">
    No templates yet. Outline the game zone and points of interest before the game, then load it into a room.
  </p>
{:else if templates}
  <ul class="flex flex-col gap-2" aria-label="Templates">
    {#each templates as template (template.id)}
      <li class="flex items-center gap-2 rounded-xl bg-neutral-900 p-2 pl-4">
        <a href={resolve('/templates/[id]', { id: template.id })} class="flex min-h-12 flex-1 flex-col justify-center">
          <span class="text-lg">{template.name}</span>
          <span class="text-sm text-neutral-400">{new Date(template.updatedAt).toLocaleString()}</span>
        </a>
        <button
          type="button"
          class="min-h-12 rounded-lg px-4 text-red-400 active:bg-neutral-800"
          aria-label="Delete {template.name}"
          onclick={() => remove(template)}
        >
          Delete
        </button>
      </li>
    {/each}
  </ul>
{/if}
