import { createContext } from 'react'
import type { AdminProfile } from '../api/admin'

export type AuthState = {
  token: string | null
  /** Perfil de quem está logado; nulo até `me` responder. */
  admin: AdminProfile | null
  /** Atalho: opera a plataforma (vê tudo). */
  isPlatform: boolean
  /** true enquanto valida o token salvo na primeira carga. */
  checking: boolean
  /** Perfil completo (com barbearias e papéis) já veio de `me`. Logo após o login ainda é false. */
  ready: boolean
  login: (email: string, password: string) => Promise<void>
  /** Entra com uma sessão já emitida (primeiro acesso pelo link do e-mail). */
  startSession: (token: string, profile: Omit<AdminProfile, 'tenants'>) => void
  logout: () => void
  /** Recarrega o perfil (após trocar senha ou mudar vínculos). */
  refresh: () => Promise<void>
  /** Atualiza o perfil em memória sem ir à API. */
  setAdmin: (updater: (current: AdminProfile) => AdminProfile) => void
}

export const AuthContext = createContext<AuthState | null>(null)
