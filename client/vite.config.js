import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Terminal Event Logger Plugin for Vite (logs device / page requests with timestamp)
const terminalEventLogger = () => ({
  name: 'terminal-event-logger',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      const isStatic = req.url.startsWith('/@') || req.url.startsWith('/node_modules') || req.url.includes('.vite') || req.url.startsWith('/src/');
      if (!isStatic && !req.url.startsWith('/api')) {
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
        const cleanIp = ip.replace(/^.*:/, '');
        const isLocal = cleanIp === '1' || cleanIp === '127.0.0.1';
        const deviceTag = isLocal ? '💻 Localhost' : `📱 Phone / Network (${cleanIp})`;
        
        const now = new Date();
        const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${now.toLocaleTimeString('en-US', { hour12: true })}`;
        
        console.log(`[CLIENT EVENT • ${timestamp}] 🌐 ${req.method} ${req.url} • ${deviceTag}`);
      }
      next();
    });
  }
});

export default defineConfig({
  plugins: [react(), terminalEventLogger()],
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

