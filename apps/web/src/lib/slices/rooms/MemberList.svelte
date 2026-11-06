<script lang="ts">
  import type { Member } from '@airsoft/shared';

  let { members, you }: { members: Member[]; you: string } = $props();
</script>

<!-- ponytail: plain list; "last seen" and the leader's drop-out view are P1-2. -->
<ul class="flex w-full flex-col gap-2" aria-label="Members">
  {#each members as member (member.id)}
    <li class="flex min-h-12 items-center gap-3 rounded-xl bg-neutral-900 px-4">
      <span
        class={['size-3 rounded-full', member.online ? 'bg-green-400' : 'bg-neutral-600']}
        aria-label={member.online ? 'online' : 'offline'}
      ></span>
      <span class="text-lg">{member.name}</span>
      {#if member.id === you}
        <span class="text-neutral-400">(you)</span>
      {/if}
    </li>
  {/each}
</ul>
