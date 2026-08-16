import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const root = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  plugins: [react()],

  // Multi-page so `/art.html` — the development contact sheet for the
  // hand-authored landmark art — is served without the SPA fallback swallowing
  // it. Only `index.html` is listed as a build input, so the contact sheet
  // never ships.
  appType: 'mpa',

  server: {
    port: 5173,
    strictPort: true,
  },

  build: {
    target: 'es2022',
    rollupOptions: {
      input: { main: `${root}index.html` },
      output: {
        // Three is by far the largest dependency; its own chunk lets the DOM
        // shell paint while the 3D bundle is still arriving.
        manualChunks: { three: ['three'] },
      },
    },
  },
})
