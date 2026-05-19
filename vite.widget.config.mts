import { fileURLToPath, URL } from 'node:url'
import Vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

// Library build that produces a single IIFE bundle which registers the
// <glean-helper> custom element. Drop the result into any host app via:
//   <script src="…/glean-helper.js"></script>
//   <glean-helper app-id="my-app"></glean-helper>
export default defineConfig({
  plugins: [
    Vue({
      // Treat *.ce.vue as custom-element SFCs (Shadow DOM + isolated styles).
      customElement: /\.ce\.vue$/,
    }),
  ],
  define: { 'process.env': {} },
  resolve: {
    alias: {
      '@widget': fileURLToPath(new URL('widget', import.meta.url)),
    },
  },
  build: {
    outDir: 'dist-widget',
    emptyOutDir: true,
    lib: {
      entry: fileURLToPath(new URL('widget/index.ts', import.meta.url)),
      formats: ['iife'],
      name: 'GleanHelper',
      fileName: () => 'glean-helper.js',
    },
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
      },
    },
  },
})
