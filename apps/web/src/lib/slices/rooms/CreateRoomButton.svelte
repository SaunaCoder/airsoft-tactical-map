<script lang="ts">
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { createRoom } from './rooms.api.ts';
  import { onMount } from 'svelte';
  import { saveLeaderToken } from './rooms.storage.ts';

  // The SSR'd button is inert until JS hydrates; keep it disabled so early taps aren't silently lost.
  let hydrated = $state(false);
  onMount(() => (hydrated = true));

  let busy = $state(false);
  let error = $state('');

  async function create() {
    busy = true;
    error = '';
    try {
      const { code, leaderToken } = await createRoom();
      saveLeaderToken(code, leaderToken);
      await goto(resolve('/room/[code]', { code }));
    } catch {
      error = 'Could not create a room. Check your connection and try again.';
    } finally {
      busy = false;
    }
  }
</script>

<button
  type="button"
  class="min-h-14 w-full bg-lime-500 px-6 text-lg font-bold text-olive-950 uppercase tracking-wider active:bg-lime-600 disabled:opacity-60"
  disabled={busy || !hydrated}
  onclick={create}
>
  {busy ? 'Creating...' : 'Create room'}
</button>
{#if error}
  <p role="alert" class="text-red-400">{error}</p>
{/if}
