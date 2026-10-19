import { createContext } from 'react'
import type { AppConfig } from '@barber/tenant-config'

export const TenantContext = createContext<AppConfig | null>(null)
