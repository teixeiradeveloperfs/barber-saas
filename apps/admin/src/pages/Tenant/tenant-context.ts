import { useOutletContext } from 'react-router-dom'
import type { TenantDetail } from '../../api/admin'
import type { TenantRole } from '../../auth/useTenantRole'

export type TenantOutlet = {
  tenant: TenantDetail
  role: TenantRole
  reload: () => void
  mutate: (updater: TenantDetail | ((current: TenantDetail) => TenantDetail)) => void
}

export function useTenantOutlet() {
  return useOutletContext<TenantOutlet>()
}
