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
    <span class="text-neutral-300">Join code</span>
    <input
      bind:value={code}
      class="min-h-14 rounded-xl border-2 border-neutral-700 bg-neutral-900 px-4 text-center font-mono text-2xl uppercase tracking-widest focus:border-amber-400 focus:outline-none"
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
    class="min-h-14 rounded-xl border-2 border-amber-400 px-6 text-lg font-bold text-amber-400 active:bg-amber-400/10 disabled:opacity-60"
    disabled={!hydrated}
  >
    Join room
  </button>
</form>
