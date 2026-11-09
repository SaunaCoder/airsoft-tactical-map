<script lang="ts">
  import { joinCodeSchema } from '@airsoft/shared';
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { onMount } from 'svelte';

  // Same reason as CreateRoomButton: an SSR'd form submits natively before hydration.
  let hydrated = $state(false);
  onMount(() => (hydrated = true));

  let code = $state('');
  let error = $state('');

  async function submit(event: SubmitEvent) {
    event.preventDefault();
    const parsed = joinCodeSchema.safeParse(code);
    if (!parsed.success) {
      error = 'Codes are 6 letters or digits';
      return;
    }
    await goto(resolve('/room/[code]', { code: parsed.data }));
  }
</script>

<form class="flex flex-col gap-3" onsubmit={submit}>
  <label class="flex flex-col gap-2">
    <span class="text-sm font-bold uppercase tracking-widest text-olive-400">Join code</span>
    <input
      bind:value={code}
      class="min-h-14 border-2 border-olive-700 bg-olive-900 px-4 text-center font-mono text-2xl uppercase tracking-widest focus:border-lime-500 focus:outline-none"
      maxlength="6"
      autocomplete="off"
      autocapitalize="characters"
      spellcheck="false"
      aria-invalid={error !== ''}
    />
  </label>
  {#if error}
    <p role="alert" class="text-red-400">{error}</p>
  {/if}
  <button
    type="submit"
    class="min-h-14 border-2 border-lime-500 px-6 text-lg font-bold text-lime-400 uppercase tracking-wider active:bg-lime-500/10 disabled:opacity-60"
    disabled={!hydrated}
  >
    Join room
  </button>
</form>
