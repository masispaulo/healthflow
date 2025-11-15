import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      // Isso é pro 'npm run dev'
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      // --- ADICIONE ISSO AQUI ---
      // Isso é pro 'npm run preview' (Google Cloud)
      preview: {
        port: 8080,        // A porta que o Google espera
        host: '0.0.0.0',   // Para o Google "ver" o servidor
      },
      // --- FIM DA ADIÇÃO ---
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.VITE_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.VITE_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});