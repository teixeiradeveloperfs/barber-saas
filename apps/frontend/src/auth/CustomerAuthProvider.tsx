import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { authApi, getCustomerToken, handleCustomerUnauthorized, setCustomerToken, type CustomerProfile, type CustomerSession } from '../lib/api'
import { useUser } from '../user/useUser'
import { CustomerAuthContext, type CustomerAuthState } from './customer-auth-context'

/**
 * Sessão do cliente nesta barbearia. O perfil local (`UserProvider`) continua
 * guardando foto e preferências; nome, WhatsApp e e-mail passam a vir da conta.
 */
export function CustomerAuthProvider({ children }: { children: ReactNode }) {
  const { updateUser, resetUser } = useUser()
  const [status, setStatus] = useState<CustomerAuthState['status']>(() => (getCustomerToken() ? 'carregando' : 'visitante'))
  const [customer, setCustomer] = useState<CustomerProfile | null>(null)

  const syncLocal = useCallback(
    (profile: CustomerProfile) => {
      updateUser({ name: profile.name, email: profile.email ?? '', phone: profile.phoneMasked, memberSince: profile.createdAt })
    },
    [updateUser],
  )

  const enter = useCallback(
    (session: CustomerSession) => {
      setCustomerToken(session.token)
      setCustomer(session.customer)
      setStatus('logado')
      syncLocal(session.customer)
      return session.customer
    },
    [syncLocal],
  )

  const logout = useCallback(() => {
    setCustomerToken(null)
    setCustomer(null)
    setStatus('visitante')
    resetUser()
  }, [resetUser])

  useEffect(() => {
    handleCustomerUnauthorized(logout)
  }, [logout])

  // Uma validação da sessão salva ao abrir.
  useEffect(() => {
    if (!getCustomerToken()) return
    let cancelled = false
    authApi
      .me()
      .then((profile) => {
        if (cancelled) return
        setCustomer(profile)
        setStatus('logado')
        syncLocal(profile)
      })
      .catch(() => {
        if (!cancelled) logout()
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const value = useMemo<CustomerAuthState>(
    () => ({
      status,
      customer,
      requestCode: (phone, channel, purpose) => authApi.requestCode(phone, channel, purpose),
      register: async (input) => enter(await authApi.register(input)),
      loginPassword: async (email, password) => enter(await authApi.loginPassword(email, password)),
      loginCode: async (phone, code) => enter(await authApi.loginCode(phone, code)),
      recover: async (phone, code, newPassword) => enter(await authApi.recover(phone, code, newPassword)),
      updateProfile: async (input) => {
        const profile = await authApi.updateMe(input)
        setCustomer(profile)
        syncLocal(profile)
        return profile
      },
      changePassword: async (current, next) => {
        await authApi.changePassword(current, next)
        setCustomer((state) => (state ? { ...state, hasPassword: true } : state))
      },
      logout,
    }),
    [status, customer, enter, logout, syncLocal],
  )

  return <CustomerAuthContext.Provider value={value}>{children}</CustomerAuthContext.Provider>
}
