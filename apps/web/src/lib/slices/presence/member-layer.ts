import type { LngLat, Member } from '@airsoft/shared';
import L from 'leaflet';
import { toLatLng } from '#lib/core/map.ts';

const STYLE = {
  self: { color: '#ffffff', fillColor: '#3b82f6' },
  online: { color: '#ffffff', fillColor: '#22c55e' },
  offline: { color: '#ffffff', fillColor: '#737373' },
};

/** One labelled dot per member with a known position. Offline members keep their last position, greyed out. */
export function createMemberLayer(map: L.Map) {
  const markers = new Map<string, L.CircleMarker>();

  function update(members: Member[], selfId: string, selfPosition: LngLat | null): void {
    const shown = new Set<string>();
    for (const member of members) {
      const isSelf = member.id === selfId;
      const position = isSelf ? (selfPosition ?? member.position) : member.position;
      if (!position) continue;
      shown.add(member.id);

      const style = STYLE[isSelf ? 'self' : member.online ? 'online' : 'offline'];
      const marker = markers.get(member.id);
      if (marker) {
        marker.setLatLng(toLatLng(position)).setStyle(style).setTooltipContent(member.name);
        continue;
      }
      const created = L.circleMarker(toLatLng(position), { ...style, radius: 9, weight: 3, fillOpacity: 1 })
        .bindTooltip(member.name, { permanent: true, direction: 'top', offset: [0, -10] })
        .addTo(map);
      markers.set(member.id, created);
    }
    for (const [id, marker] of markers) {
      if (shown.has(id)) continue;
      marker.remove();
      markers.delete(id);
    }
  }

  function destroy(): void {
    for (const marker of markers.values()) marker.remove();
    markers.clear();
  }

  return { update, destroy };
}
