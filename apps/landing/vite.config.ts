import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Carrega .env, .env.[mode] e .env.[mode].local — sem filtro de prefixo,
  // para ler PORT (que não é exposta ao client por não ter prefixo VITE_).
  const env = loadEnv(mode, process.cwd(), '')
  const port = Number(env.PORT) || 5173

  return {
    plugins: [react()],
    server: {
      port,
      strictPort: true,
    },
    preview: {
      port,
      strictPort: true,
    },
  }
})
