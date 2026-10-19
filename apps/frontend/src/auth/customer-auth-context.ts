import { createContext } from 'react'
import type { CustomerProfile, OtpChannel, OtpPurpose, OtpSent } from '../lib/api'

export type CustomerAuthState = {
  /** `carregando` só na primeira abertura com sessão salva. */
  status: 'carregando' | 'visitante' | 'logado'
  customer: CustomerProfile | null
  requestCode: (phone: string, channel: OtpChannel, purpose: OtpPurpose) => Promise<OtpSent>
  register: (input: { name: string; email: string; password: string; phone?: string; referralCode?: string }) => Promise<CustomerProfile>
  loginPassword: (email: string, password: string) => Promise<CustomerProfile>
  loginCode: (phone: string, code: string) => Promise<CustomerProfile>
  recover: (phone: string, code: string, newPassword: string) => Promise<CustomerProfile>
  updateProfile: (input: { name?: string; email?: string | null; phone?: string | null }) => Promise<CustomerProfile>
  changePassword: (current: string | undefined, next: string) => Promise<void>
  logout: () => void
}

export const CustomerAuthContext = createContext<CustomerAuthState | null>(null)
