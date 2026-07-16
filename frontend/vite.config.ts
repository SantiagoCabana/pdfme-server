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
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (id.includes('@pdfme') || id.includes('clawpdf')) return 'pdfme-vendor';
          if (id.includes('@mui') || id.includes('@emotion')) return 'mui-vendor';
          if (id.includes('@ant-design/icons')) return 'icons-vendor';
          if (id.includes('gridjs')) return 'table-vendor';
          if (id.includes('react')) return 'react-vendor';
          return undefined;
        },
      },
    },
  },
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
