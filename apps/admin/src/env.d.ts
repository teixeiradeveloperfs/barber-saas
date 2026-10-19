/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_NAME: string
  readonly VITE_API_URL: string
  /** Só em dev: Vite local do app do cliente. Em produção fica vazio e cada barbearia abre no host dela. */
  readonly VITE_FRONTEND_URL?: string
  readonly VITE_LANDING_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
