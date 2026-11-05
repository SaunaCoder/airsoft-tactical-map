<script lang="ts">
  import { page } from '$app/state';
  import { loadLeaderToken } from '#lib/slices/rooms/index.ts';

  // ponytail: placeholder until the join flow and map land; shows the code the leader shares.
  const code = $derived(page.params.code ?? '');
  const isLeader = $derived(loadLeaderToken(code) !== null);
</script>

<svelte:head>
  <title>Room {code}</title>
</svelte:head>

<main class="flex min-h-dvh flex-col items-center justify-center gap-4 bg-neutral-950 p-4 text-neutral-100">
  <p class="text-neutral-400">Join code</p>
  <h1 class="font-mono text-5xl font-bold tracking-widest" data-testid="join-code">{code}</h1>
  {#if isLeader}
    <p class="text-center text-amber-400">You are the leader. Share this code with your team.</p>
  {/if}
</main>
