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
    <span class="text-sm font-bold uppercase tracking-widest text-olive-400">Your name</span>
    <input
      bind:value={name}
      class="min-h-14 border-2 border-olive-700 bg-olive-900 px-4 text-xl focus:border-accent-500 focus:outline-none"
      maxlength="24"
      autocomplete="nickname"
      aria-invalid={error !== ''}
    />
  </label>
  {#if error}
    <p role="alert" class="text-red-400">{error}</p>
  {/if}
  <button type="submit" class="min-h-14 bg-accent-500 px-6 text-lg font-bold text-olive-950 uppercase tracking-wider active:bg-accent-600">
    Join
  </button>
</form>
