<script lang="ts">
  import type { LngLat, Member } from '@airsoft/shared';
  import L from 'leaflet';
  import { FIELD_ZOOM, toLatLng } from '#lib/core/map.ts';
  import { createMemberLayer } from './member-layer.ts';

  let {
    map,
    members,
    selfId,
    selfPosition,
  }: { map: L.Map; members: Member[]; selfId: string; selfPosition: LngLat | null } = $props();

  let layer: ReturnType<typeof createMemberLayer> | undefined;
  $effect(() => {
    const created = createMemberLayer(map);
    layer = created;
    return () => created.destroy();
  });

  $effect(() => {
    layer?.update(members, selfId, selfPosition);
  });

  // Frame the team on join, then jump to our own position once, on the first GPS fix. After that the user pans freely.
  let framedTeam = false;
  let centeredOnSelf = false;
  $effect(() => {
    if (centeredOnSelf) return;
    if (selfPosition) {
      map.setView(toLatLng(selfPosition), FIELD_ZOOM);
      centeredOnSelf = framedTeam = true;
      return;
    }
    const known = members.flatMap((m) => (m.position ? [toLatLng(m.position)] : []));
    if (framedTeam || known.length === 0) return;
    map.fitBounds(L.latLngBounds(known), { maxZoom: FIELD_ZOOM, padding: [48, 48] });
    framedTeam = true;
  });
</script>
