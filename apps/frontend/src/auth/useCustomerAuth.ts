import { useContext } from 'react'
import { CustomerAuthContext } from './customer-auth-context'

export function useCustomerAuth() {
  const context = useContext(CustomerAuthContext)
  if (!context) throw new Error('useCustomerAuth precisa estar dentro de <CustomerAuthProvider>')
  return context
}
