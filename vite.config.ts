import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { mongoApiPlugin } from './src/server/mongoMiddleware';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), mongoApiPlugin()],
  server: {
    port: 3000,
    open: true,
  },
});
