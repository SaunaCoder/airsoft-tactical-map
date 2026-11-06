import { Events, type FeatureRef, type MapFeature } from '@airsoft/shared';
import type { RoomSession } from '#lib/slices/rooms/index.ts';

/** Applies feature:added/updated/deleted to the session's snapshot. Returns an unsubscribe function. */
export function trackDrawings(session: RoomSession): () => void {
  const onAdded = (feature: MapFeature) => {
    const features = session.state?.features.features;
    if (features && !features.some((f) => f.id === feature.id)) features.push(feature);
  };
  const onUpdated = (feature: MapFeature) => {
    const features = session.state?.features.features;
    const index = features?.findIndex((f) => f.id === feature.id) ?? -1;
    if (features && index >= 0) features[index] = feature;
  };
  const onDeleted = ({ id }: FeatureRef) => {
    if (!session.state) return;
    session.state.features.features = session.state.features.features.filter((f) => f.id !== id);
  };

  session.socket.on(Events.featureAdded, onAdded);
  session.socket.on(Events.featureUpdated, onUpdated);
  session.socket.on(Events.featureDeleted, onDeleted);
  return () => {
    session.socket.off(Events.featureAdded, onAdded);
    session.socket.off(Events.featureUpdated, onUpdated);
    session.socket.off(Events.featureDeleted, onDeleted);
  };
}
