import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
        // ESSA LINHA É A CORREÇÃO para o 404 Not Found no Render/Nginx
        // Garante que o index.html use caminhos absolutos corretos (ex: /assets/index.js)
        base: '/', 
        
        // Isso é pro 'npm run dev'
        server: {
            port: 3000,
            host: '0.0.0.0',
        },
        
        // Isso é pro 'npm run preview' (Google Cloud)
        preview: {
            port: 8080,         // A porta que o Google espera
            host: '0.0.0.0',    // Para o Google "ver" o servidor
        },
        
        plugins: [react()],
        
        define: {
            // Se você está usando VITE_xxx no seu código, a sintaxe correta do Vite é importar o env
            // A forma 'process.env.VITE_API_KEY' é usada para compatibilidade com outros sistemas.
            // Para ter certeza que a chave está sendo carregada no deploy:
            'process.env.VITE_API_KEY': JSON.stringify(env.VITE_API_KEY),
            
            // Você tinha a VITE_API_KEY duplicada aqui.
            // 'process.env.VITE_API_KEY': JSON.stringify(env.VITE_API_KEY) 
        },
        
        resolve: {
            alias: {
                '@': path.resolve(__dirname, '.'),
            }
        }
    };
});