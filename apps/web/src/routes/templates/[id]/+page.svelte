<script lang="ts">
  import { TemplateEditor } from '#lib/slices/templates/index.ts';

  let { data } = $props();
</script>

<svelte:head>
  <title>{data.template?.name ?? 'New template'}</title>
</svelte:head>

<TemplateEditor template={data.template} />
