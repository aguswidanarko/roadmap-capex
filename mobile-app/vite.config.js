import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Roadmap CAPEX Bangunan - Mobile',
        short_name: 'CAPEX Mobile',
        description: 'Offline-first field app untuk mencatat progres pekerjaan bangunan (Roadmap CAPEX)',
        theme_color: '#0f766e',
        background_color: '#0f766e',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/pwa-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/\{s\}\.tile\.openstreetmap\.org\/.*/,
            handler: 'CacheFirst',
            options: { cacheName: 'osm-tiles', expiration: { maxEntries: 200, maxAgeSeconds: 30 * 24 * 60 * 60 } },
          },
        ],
      },
    }),
  ],
})
