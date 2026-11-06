<script lang="ts">
  import { resolve } from '$app/paths';
  import { TemplateList } from '#lib/slices/templates/index.ts';
</script>

<svelte:head>
  <title>Templates</title>
</svelte:head>

<main class="mx-auto flex min-h-dvh max-w-md flex-col gap-4 bg-neutral-950 p-4 text-neutral-100">
  <header class="flex items-center gap-2">
    <a
      href={resolve('/')}
      class="flex min-h-12 min-w-12 items-center justify-center rounded-lg text-2xl active:bg-neutral-800"
      aria-label="Back to start">&larr;</a
    >
    <h1 class="text-2xl font-bold">Templates</h1>
  </header>
  <TemplateList />
</main>
