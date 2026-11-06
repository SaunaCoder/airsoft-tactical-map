<script lang="ts">
  import type L from 'leaflet';
  import { untrack } from 'svelte';
  import { page } from '$app/state';
  import { resolve } from '$app/paths';
  import MapCanvas from '#lib/core/MapCanvas.svelte';
  import { DrawingLayer, LeaderTools, trackDrawings } from '#lib/slices/drawings/index.ts';
  import { CenterOnMe, GpsBanner, MemberMarkers, PositionSharing } from '#lib/slices/presence/index.ts';
  import {
    InviteQr,
    loadLastName,
    loadMemberId,
    MemberList,
    NameForm,
    RoomSession,
  } from '#lib/slices/rooms/index.ts';

  const code = (page.params.code ?? '').toUpperCase();

  // Returning members skip the name prompt; everyone else (incl. a fresh leader) picks a name first.
  let name = $state(loadMemberId(code) ? loadLastName() : '');
  let session = $state<RoomSession | null>(null);
  let sharing = $state<PositionSharing | null>(null);
  let map = $state<L.Map>();
  let teamOpen = $state(false);

  $effect(() => {
    if (!name) return;
    const current = untrack(() => new RoomSession(code, name));
    const gps = untrack(() => new PositionSharing(current));
    const untrackDrawings = trackDrawings(current);
    session = current;
    sharing = gps;
    return () => {
      untrackDrawings();
      gps.stop();
      current.leave();
    };
  });
</script>

<svelte:head>
  <title>Room {code}</title>
</svelte:head>

{#if session?.state && sharing}
  {@const state = session.state}
  <main class="fixed inset-0 bg-neutral-950 text-neutral-100">
    <MapCanvas bind:map />
    {#if map}
      <DrawingLayer {map} features={state.features.features} editable={state.isLeader} socket={session.socket} />
      {#if state.isLeader}
        <LeaderTools {map} socket={session.socket} />
      {/if}
      <MemberMarkers {map} members={state.members} selfId={state.memberId} selfPosition={sharing.position} />
    {/if}

    <!-- Leaflet panes use z-index up to 1000; overlays sit above them. -->
    <div class="pointer-events-none absolute inset-x-0 top-0 z-[1100] flex flex-col gap-2 p-3">
      <header class="flex items-start justify-between gap-2">
        <div class="pointer-events-auto flex items-center gap-2 rounded-xl bg-neutral-950/90 px-4 py-2 shadow-lg">
          <span class="font-mono text-2xl font-bold tracking-widest" data-testid="join-code">{code}</span>
          {#if state.isLeader}
            <span class="rounded-md bg-amber-400 px-2 py-0.5 text-sm font-bold text-neutral-950">Leader</span>
          {/if}
        </div>
        <button
          type="button"
          class="pointer-events-auto min-h-12 rounded-xl bg-neutral-950/90 px-5 text-lg font-bold shadow-lg active:bg-neutral-800"
          aria-expanded={teamOpen}
          onclick={() => (teamOpen = !teamOpen)}
        >
          Team
        </button>
      </header>
      <GpsBanner status={sharing.status} />
      {#if session.error}
        <p role="alert" class="rounded-xl bg-red-900/95 px-4 py-3 font-semibold text-white shadow-lg">{session.error}</p>
      {/if}
    </div>

    {#if map}
      <div class="absolute bottom-6 left-3 z-[1100]">
        <CenterOnMe {map} position={sharing.position} />
      </div>
    {/if}

    {#if teamOpen}
      <section
        class="absolute inset-x-0 bottom-0 z-[1200] flex max-h-[75dvh] flex-col gap-4 overflow-y-auto rounded-t-2xl bg-neutral-950 p-4 shadow-2xl"
        aria-label="Team"
      >
        <div class="flex items-center justify-between">
          <h2 class="text-xl font-bold">Team</h2>
          <button type="button" class="min-h-12 px-4 text-lg text-amber-400" onclick={() => (teamOpen = false)}>
            Close
          </button>
        </div>
        {#if state.isLeader}
          <p class="text-amber-400">You are the leader. Share the code or QR with your team.</p>
        {/if}
        <InviteQr {code} />
        <MemberList members={state.members} you={state.memberId} />
      </section>
    {/if}
  </main>
{:else}
  <main class="mx-auto flex min-h-dvh max-w-md flex-col items-center gap-6 bg-neutral-950 p-4 pt-10 text-neutral-100">
    <div class="text-center">
      <p class="text-neutral-400">Join code</p>
      <h1 class="font-mono text-5xl font-bold tracking-widest" data-testid="join-code">{code}</h1>
    </div>

    {#if session?.error}
      <p role="alert" class="text-center text-lg text-red-400">{session.error}</p>
      <a href={resolve('/')} class="flex min-h-12 items-center text-lg text-amber-400 underline">Back to start</a>
    {:else if !name}
      <NameForm onjoin={(n) => (name = n)} />
    {:else}
      <p class="text-neutral-400">Connecting...</p>
    {/if}
  </main>
{/if}
