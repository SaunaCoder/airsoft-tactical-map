<script lang="ts">
  import type { Member } from '@airsoft/shared';

  let { members, you }: { members: Member[]; you: string } = $props();
</script>

<!-- ponytail: plain list; "last seen" and the leader's drop-out view are P1-2. -->
<ul class="flex w-full flex-col gap-2" aria-label="Members">
  {#each members as member (member.id)}
    <li class="flex min-h-12 items-center gap-3 border-l-4 border-olive-700 bg-olive-900 px-4">
      <span
        class={['size-3 ', member.online ? 'bg-accent-400' : 'bg-olive-600']}
        aria-label={member.online ? 'online' : 'offline'}
      ></span>
      <span class="text-lg">{member.name}</span>
      {#if member.id === you}
        <span class="text-olive-400">(you)</span>
      {/if}
    </li>
  {/each}
</ul>
