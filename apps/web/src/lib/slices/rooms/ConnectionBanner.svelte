<script lang="ts">
  let { joined }: { joined: boolean } = $props();
</script>

<!-- The map stays usable offline: it shows the last known state until the fresh snapshot arrives. -->
{#if !joined}
  <p role="status" class="rounded-xl bg-neutral-700/95 px-4 py-3 font-semibold text-white shadow-lg">
    Offline. Reconnecting... Positions and drawings may be out of date.
  </p>
{/if}
