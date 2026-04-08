import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['logo.png', 'robots.txt'],
        manifest: {
          name: env.VITE_APP_NAME || 'Cartina',
          short_name: 'Tinables',
          description: 'Offline-first grocery trip planning with Google Apps Script backend.',
          theme_color: '#0d47a1',
          background_color: '#f5f7fb',
          display: 'standalone',
          start_url: '/',
          icons: [
            {
              src: '/logo.png',
              sizes: '512x512',
              type: 'image/png'
            },
            {
              src: '/logo.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable'
            }
          ]
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
          runtimeCaching: [
            {
              urlPattern: ({ url }) => url.origin === self.location.origin,
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'app-shell-cache'
              }
            },
            {
              urlPattern: ({ url }) =>
                env.VITE_GAS_BASE_URL && url.href.startsWith(env.VITE_GAS_BASE_URL),
              handler: 'NetworkFirst',
              options: {
                cacheName: 'gas-api-cache',
                networkTimeoutSeconds: 5,
                expiration: {
                  maxEntries: 30,
                  maxAgeSeconds: 60 * 60 * 24
                }
              }
            }
          ]
        }
      })
    ],
    server: {
      port: 5173
    }
  };
});
