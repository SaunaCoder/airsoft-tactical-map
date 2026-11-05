import adapter from '@sveltejs/adapter-node';
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Explicit root so the root-level `vitest` (projects) resolves src/app.html from here, not the repo root.
  root: import.meta.dirname,
  plugins: [tailwindcss(), sveltekit({ adapter: adapter() })],
  server: {
    // Same-origin in dev, like nginx in prod: no CORS config needed.
    proxy: {
      '/api': 'http://localhost:3000',
      '/socket.io': { target: 'http://localhost:3000', ws: true },
    },
  },
  test: { include: ['src/**/*.test.ts'] },
});
