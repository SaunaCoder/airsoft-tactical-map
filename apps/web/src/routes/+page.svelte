<script lang="ts">
  import { CreateRoomButton } from '#lib/slices/rooms/index.ts';
</script>

<svelte:head>
  <title>Airsoft Tactical Map</title>
</svelte:head>

<main class="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 bg-neutral-950 p-4 text-neutral-100">
  <h1 class="text-center text-3xl font-bold">Airsoft Tactical Map</h1>
  <CreateRoomButton />
</main>
