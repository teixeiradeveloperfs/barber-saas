import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv, type ProxyOptions } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Carrega .env, .env.[mode] e .env.[mode].local — sem filtro de prefixo,
  // para ler PORT (que não é exposta ao client por não ter prefixo VITE_).
  const env = loadEnv(mode, process.cwd(), '')
  const port = Number(env.PORT) || 5173
  const api = env.VITE_API_URL?.replace(/\/$/, '')

  // Manifest e ícones da instalação única. Em produção o nginx do app repassa
  // para a API; em dev, este proxy faz o mesmo.
  const tenantAsset = (target: string): ProxyOptions => ({
    target: api,
    changeOrigin: true,
    rewrite: (path) => path.replace(/^\/[^?]*/, target),
  })
  const proxy = api
    ? {
        '/manifest.webmanifest': tenantAsset('/public/manifest.webmanifest'),
        '/apple-touch-icon.png': tenantAsset('/public/app-icon/apple-touch-icon.png'),
        '^/app-icon/': {
          ...tenantAsset(''),
          rewrite: (path: string) => path.replace(/^\/app-icon\//, '/public/app-icon/'),
        },
      }
    : undefined

  return {
    plugins: [react()],
    server: {
      port,
      strictPort: true,
      proxy,
    },
    preview: {
      port,
      strictPort: true,
      proxy,
    },
  }
})
