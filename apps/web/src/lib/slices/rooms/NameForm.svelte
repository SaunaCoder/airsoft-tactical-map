<script lang="ts">
  import { displayNameSchema } from '@airsoft/shared';
  import { loadLastName } from './rooms.storage.ts';

  let { onjoin }: { onjoin: (name: string) => void } = $props();

  let name = $state(loadLastName());
  let error = $state('');

  function submit(event: SubmitEvent) {
    event.preventDefault();
    const parsed = displayNameSchema.safeParse(name);
    if (!parsed.success) {
      error = parsed.error.issues[0]?.message ?? 'Invalid name';
      return;
    }
    onjoin(parsed.data);
  }
</script>

<form class="flex w-full flex-col gap-3" onsubmit={submit}>
  <label class="flex flex-col gap-2">
    <span class="text-neutral-300">Your name</span>
    <input
      bind:value={name}
      class="min-h-14 rounded-xl border-2 border-neutral-700 bg-neutral-900 px-4 text-xl focus:border-amber-400 focus:outline-none"
      maxlength="24"
      autocomplete="nickname"
      aria-invalid={error !== ''}
    />
  </label>
  {#if error}
    <p role="alert" class="text-red-400">{error}</p>
  {/if}
  <button type="submit" class="min-h-14 rounded-xl bg-amber-400 px-6 text-lg font-bold text-neutral-950 active:bg-amber-500">
    Join
  </button>
</form>
