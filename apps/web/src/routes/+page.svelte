<script lang="ts">
  import { resolve } from '$app/paths';
  import { CreateRoomButton, JoinRoomForm } from '#lib/slices/rooms/index.ts';
</script>

<svelte:head>
  <title>Airsoft Tactical Map</title>
</svelte:head>

<main class="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 bg-neutral-950 p-4 text-neutral-100">
  <h1 class="text-center text-3xl font-bold">Airsoft Tactical Map</h1>
  <JoinRoomForm />
  <p class="text-center text-neutral-500">or</p>
  <CreateRoomButton />
  <a
    href={resolve('/templates')}
    class="flex min-h-12 items-center justify-center text-lg text-amber-400 underline active:text-amber-500"
  >
    Prepare a template
  </a>
</main>
