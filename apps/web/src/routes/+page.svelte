<script lang="ts">
  import { resolve } from '$app/paths';
  import { CreateRoomButton, JoinRoomForm } from '#lib/slices/rooms/index.ts';
</script>

<svelte:head>
  <title>Airsoft Tactical Map</title>
</svelte:head>

<main class="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 bg-olive-950 p-4 text-olive-50">
  <h1 class="text-center text-3xl font-bold uppercase tracking-wider">
    <span class="block text-sm tracking-[0.4em] text-lime-400">Airsoft</span>
    Tactical Map
  </h1>
  <JoinRoomForm />
  <p class="flex items-center gap-3 text-sm font-bold uppercase tracking-widest text-olive-400">
    <span class="h-px flex-1 bg-olive-700"></span>or<span class="h-px flex-1 bg-olive-700"></span>
  </p>
  <CreateRoomButton />
  <a
    href={resolve('/templates')}
    class="flex min-h-12 items-center justify-center text-lg text-lime-400 underline active:text-lime-600"
  >
    Prepare a template
  </a>
</main>
