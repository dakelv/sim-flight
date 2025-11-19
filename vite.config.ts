import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  
  console.log(env.VITE_API_KEY ? "✅ VITE_API_KEY found in build" : "⚠️ VITE_API_KEY missing in build");

  return {
    plugins: [react()],
    base: '/apps/sims/flight/',
    define: {
      // Fallback to empty string so JSON.stringify doesn't return undefined
      'import.meta.env.VITE_API_KEY': JSON.stringify(env.VITE_API_KEY || ""),
    },
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      emptyOutDir: true,
    }
  };
});