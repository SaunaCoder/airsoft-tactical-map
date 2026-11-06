<script lang="ts">
  import { page } from '$app/state';
  import { resolve } from '$app/paths';
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

  $effect(() => {
    if (!name) return;
    const current = new RoomSession(code, name);
    session = current;
    return () => current.leave();
  });
</script>

<svelte:head>
  <title>Room {code}</title>
</svelte:head>

<main class="mx-auto flex min-h-dvh max-w-md flex-col items-center gap-6 bg-neutral-950 p-4 pt-10 text-neutral-100">
  <div class="text-center">
    <p class="text-neutral-400">Join code</p>
    <h1 class="font-mono text-5xl font-bold tracking-widest" data-testid="join-code">{code}</h1>
  </div>

  {#if session?.error && !session.state}
    <p role="alert" class="text-center text-lg text-red-400">{session.error}</p>
    <a href={resolve('/')} class="flex min-h-12 items-center text-lg text-amber-400 underline">Back to start</a>
  {:else if !name}
    <NameForm onjoin={(n) => (name = n)} />
  {:else if session?.state}
    {#if session.state.isLeader}
      <p class="text-center text-amber-400">You are the leader. Share this code with your team.</p>
    {/if}
    <InviteQr {code} />
    {#if session.error}
      <p role="alert" class="text-center text-red-400">{session.error}</p>
    {/if}
    <MemberList members={session.state.members} you={session.state.memberId} />
  {:else}
    <p class="text-neutral-400">Connecting...</p>
  {/if}
</main>
