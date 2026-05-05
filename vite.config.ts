import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(
        (() => {
          const keys = [
            process.env.GEMINI_API_KEY,
            env.GEMINI_API_KEY,
            process.env.GEMINI_KEY,
            env.GEMINI_KEY
          ];
          for (const key of keys) {
            if (key && key !== "MY_GEMINI_API_KEY" && key !== "undefined" && key !== "null" && key !== "") {
              return key;
            }
          }
          return "";
        })()
      ),
      'process.env.APP_URL': JSON.stringify(process.env.APP_URL || env.APP_URL || ''),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
