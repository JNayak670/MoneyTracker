import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Terminal Event Logger Plugin for Vite (logs device / page requests with timestamp)
const terminalEventLogger = () => ({
  name: 'terminal-event-logger',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      const isStatic = req.url.startsWith('/@') || req.url.startsWith('/node_modules') || req.url.includes('.vite') || req.url.startsWith('/src/');
      if (!isStatic && !req.url.startsWith('/api')) {
        const rawIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
        const firstIp = rawIp.split(',')[0].trim();
        const cleanIp = firstIp.replace(/^.*:/, '');
        const isLocal = cleanIp === '1' || cleanIp === '127.0.0.1' || cleanIp === 'unknown';
        const deviceTag = isLocal ? '💻 Localhost' : `📱 ${cleanIp}`;
        const timestamp = new Date().toLocaleTimeString('en-US', { hour12: true });
        console.log(`[${timestamp}] 🌐 ${req.method} ${req.url} • ${deviceTag}`);
      }
      next();
    });
  }
});

export default defineConfig({
  plugins: [react(), terminalEventLogger()],
  build: {
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom', 'react-router-dom', 'axios'],
          'charts': ['recharts'],
          'icons': ['lucide-react']
        }
      }
    }
  },
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true
      }
    }
  }
});

