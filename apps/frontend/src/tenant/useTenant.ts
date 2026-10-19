import { useContext } from 'react'
import { TenantContext } from './tenant-context'

export function useTenant() {
  const tenant = useContext(TenantContext)
  if (!tenant) throw new Error('useTenant precisa estar dentro de <TenantProvider>')
  return tenant
}
