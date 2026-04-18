import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [react()],
    server: {
      port: 5173,
      host: true, // Importante para Docker
      allowedHosts: true, // Permitir túneles ngrok/ssh externos
      proxy: {
        '/api': {
          // Si estamos en Docker, usamos 'http://api:5000', si no 'http://localhost:5000'
          target: process.env.VITE_API_URL_INTERNAL || 'http://localhost:5000',
          changeOrigin: true
        }
      }
    }
  };
})
