import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { readFileSync } from 'node:fs';

// Exercise the same security policy in the local production preview.
const securityBlock = readFileSync(new URL('./netlify.toml', import.meta.url), 'utf8').split('[[headers]]')[1];
const securityHeaders = Object.fromEntries([...securityBlock.matchAll(/^\s+([\w-]+) = "([^"]+)"/gm)].map(([, key, value]) => [key, value]));

export default defineConfig({
  plugins: [react()],
  preview: { host: '127.0.0.1', headers: securityHeaders },
  server: {
    host: '127.0.0.1',
    open: false,
  },
  build: {
    target: 'es2020',
    cssCodeSplit: true,
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (/node_modules[\\/](react|react-dom|scheduler)[\\/]/.test(id)) return 'react';
            if (id.includes('gsap') || id.includes('lenis')) return 'motion';
          }
        },
      },
    },
  },
});
