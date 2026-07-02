import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

function isApiRequest(url: string) {
  return url === '/api' || url.startsWith('/api/');
}

function spaFallback() {
  return {
    name: 'pdfme-spa-fallback',
    configureServer(server) {
      server.middlewares.use((request, _response, next) => {
        if (
          request.method === 'GET' &&
          request.url &&
          !isApiRequest(request.url) &&
          !request.url.includes('.') &&
          request.headers.accept?.includes('text/html')
        ) {
          request.url = '/index.html';
        }

        next();
      });
    },
    configurePreviewServer(server) {
      server.middlewares.use((request, _response, next) => {
        if (
          request.method === 'GET' &&
          request.url &&
          !isApiRequest(request.url) &&
          !request.url.includes('.') &&
          request.headers.accept?.includes('text/html')
        ) {
          request.url = '/index.html';
        }

        next();
      });
    },
  };
}

export default defineConfig({
  appType: 'spa',
  plugins: [spaFallback(), react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    watch: {
      usePolling: true,
      interval: 1000,
    },
    proxy: {
      '^/api(/|$)': 'http://localhost:4000',
    },
  },
});
