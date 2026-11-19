import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Puerto 3000: es el origen que el backend permite por defecto en CORS (CORS_ORIGENES).
export default defineConfig({
  plugins: [react()],
  server: { port: 3000, strictPort: true },
  preview: { port: 3000, strictPort: true },
});
