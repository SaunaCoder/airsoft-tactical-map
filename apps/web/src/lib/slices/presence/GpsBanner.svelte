<script lang="ts">
  import type { GpsStatus } from '#lib/core/geolocation.ts';

  let { status }: { status: GpsStatus } = $props();

  // The map keeps working in every state; only sharing our own position stops.
  const messages: Partial<Record<GpsStatus, string>> = {
    denied: 'Location is blocked. Allow location for this site to share your position.',
    unavailable: 'No GPS signal. Your position is not being shared right now.',
    unsupported: 'This browser cannot share your location.',
  };
  const message = $derived(messages[status]);
</script>

{#if message}
  <p role="status" class="rounded-xl bg-red-900/95 px-4 py-3 font-semibold text-white shadow-lg">{message}</p>
{/if}
