<script lang="ts">
  import type { Member } from '@airsoft/shared';
  import { lastSeenLabel, sortMembers } from './last-seen.ts';

  let { members, you }: { members: Member[]; you: string } = $props();

  // Re-renders "last seen" labels while the sheet is open.
  let now = $state(Date.now());
  $effect(() => {
    const timer = setInterval(() => (now = Date.now()), 15_000);
    return () => clearInterval(timer);
  });
</script>

<ul class="flex w-full flex-col gap-2" aria-label="Members">
  {#each sortMembers(members) as member (member.id)}
    <li
      class={[
        // Wraps so a long name and "Last seen 59 min ago" fit on a narrow phone.
        'flex min-h-12 flex-wrap items-center gap-x-3 border-l-4 bg-olive-900 px-4 py-2',
        member.online ? 'border-olive-700' : 'border-red-500',
      ]}
    >
      <span
        class={['size-3 shrink-0', member.online ? 'bg-accent-400' : 'bg-olive-600']}
        aria-label={member.online ? 'online' : 'offline'}
      ></span>
      <span class="text-lg">{member.name}</span>
      {#if member.id === you}
        <span class="text-olive-400">(you)</span>
      {/if}
      {#if !member.online}
        <span class="ml-auto text-right text-olive-300">Last seen {lastSeenLabel(member.lastSeen, now)}</span>
      {/if}
    </li>
  {/each}
</ul>
