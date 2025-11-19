import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    base: '/apps/sims/flight/',
    define: {
      // Vital: This forces the replacement of the variable in the built code
      // so the browser never sees 'import.meta.env.VITE_API_KEY'
      'import.meta.env.VITE_API_KEY': JSON.stringify(env.VITE_API_KEY),
    },
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      emptyOutDir: true,
    }
  };
});