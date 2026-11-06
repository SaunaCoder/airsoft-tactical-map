import L from 'leaflet';

// Leaflet-Geoman patches the global `L` when it loads. ES imports are hoisted, so this has to be its
// own module, imported before Geoman.
(globalThis as unknown as { L: typeof L }).L = L;
