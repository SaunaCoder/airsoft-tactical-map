<script lang="ts">
  import { resolve } from '$app/paths';

  let { code }: { code: string } = $props();

  // The QR is just the room URL: the phone's camera app opens it and the room page asks for a name.
  const url = $derived(new URL(resolve('/room/[code]', { code }), location.origin).href);
  let open = $state(false);

  // Loaded on demand so players who never show a QR don't download the encoder.
  async function qrDataUrl(text: string): Promise<string> {
    const { default: QRCode } = await import('qrcode');
    return QRCode.toDataURL(text, { width: 320, margin: 2 });
  }
</script>

<button
  type="button"
  class="min-h-12 w-full border-2 border-olive-700 px-6 text-lg font-bold uppercase tracking-wider active:bg-olive-800"
  aria-expanded={open}
  onclick={() => (open = !open)}
>
  {open ? 'Hide QR code' : 'Show QR code'}
</button>

{#if open}
  <figure class="flex w-full flex-col items-center gap-2">
    {#await qrDataUrl(url)}
      <div class="aspect-square w-full max-w-xs bg-olive-800"></div>
    {:then src}
      <!-- White quiet zone is part of the PNG, so it scans on the dark page. -->
      <img {src} alt="QR code to join room {code}" data-url={url} class="aspect-square w-full max-w-xs" />
    {:catch}
      <p role="alert" class="text-red-400">Could not draw the QR code. Share the link below.</p>
    {/await}
    <figcaption class="break-all text-center text-olive-400">{url}</figcaption>
  </figure>
{/if}
