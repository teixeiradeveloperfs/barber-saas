import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { adminApi, type AdminProfile } from '../api/admin'
import { getToken, handleUnauthorized, setToken } from '../api/client'
import { AuthContext } from './auth-context'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(getToken)
  const [admin, setAdminState] = useState<AdminProfile | null>(null)
  const [checking, setChecking] = useState(Boolean(getToken()))
  const [ready, setReady] = useState(false)

  const logout = useCallback(() => {
    setToken(null)
    setTokenState(null)
    setAdminState(null)
    setReady(false)
  }, [])

  useEffect(() => {
    handleUnauthorized(logout)
  }, [logout])

  // Valida a sessão salva e carrega o perfil uma vez ao abrir.
  useEffect(() => {
    if (!token) return
    let cancelled = false
    adminApi
      .me()
      .then((profile) => {
        if (cancelled) return
        setAdminState(profile)
        setReady(true)
      })
      .catch(() => {
        if (!cancelled) logout()
      })
      .finally(() => {
        if (!cancelled) setChecking(false)
      })
    return () => {
      cancelled = true
    }
  }, [token, logout])

  const login = useCallback(async (email: string, password: string) => {
    const result = await adminApi.login(email, password)
    setToken(result.token)
    setTokenState(result.token)
    setAdminState({ ...result.admin, tenants: [] })
    setReady(false)
    setChecking(false)
  }, [])

  /** Sessão que já veio pronta (primeiro acesso pelo link do e-mail). */
  const startSession = useCallback((sessionToken: string, profile: Omit<AdminProfile, 'tenants'>) => {
    setToken(sessionToken)
    setTokenState(sessionToken)
    setAdminState({ ...profile, tenants: [] })
    setReady(false)
    setChecking(false)
  }, [])

  const refresh = useCallback(async () => {
    const profile = await adminApi.me()
    setAdminState(profile)
  }, [])

  const setAdmin = useCallback((updater: (current: AdminProfile) => AdminProfile) => {
    setAdminState((current) => (current ? updater(current) : current))
  }, [])

  const value = useMemo(
    // Platform/multi-tenant mode is intentionally disabled in the course edition.
    () => ({ token, admin, isPlatform: false, checking, ready, login, startSession, logout, refresh, setAdmin }),
    [token, admin, checking, ready, login, startSession, logout, refresh, setAdmin],
  )
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
