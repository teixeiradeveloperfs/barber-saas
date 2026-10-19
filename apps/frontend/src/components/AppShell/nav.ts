import type { ComponentType, SVGProps } from 'react'
import { isClubEnabled, isLoyaltyEnabled } from '../../data/gamification'
import { getTenant } from '../../tenant/active'
import { ScissorsIcon } from '../ScissorsIcon/ScissorsIcon'
import {
  CalendarIcon,
  CrownIcon,
  GiftIcon,
  HomeIcon,
  PinIcon,
  TrophyIcon,
  UserIcon,
  UsersIcon,
} from '../icons/Icons'

export type NavItem = {
  to: string
  /** Rótulo completo, usado na sidebar. */
  label: string
  /** Rótulo curto, usado na barra inferior do celular. */
  shortLabel?: string
  /** Vira o botão elevado no centro da barra inferior. */
  featured?: boolean
  /** false esconde da barra inferior do celular (fica só na sidebar). */
  mobile?: boolean
  icon: ComponentType<SVGProps<SVGSVGElement>>
}

export const navItems: NavItem[] = [
  { to: '/home', label: 'Início', icon: HomeIcon },
  { to: '/barbeiros', label: 'Barbeiros', icon: UsersIcon },
  { to: '/agendamentos', label: 'Agendamentos', shortLabel: 'Agenda', icon: CalendarIcon, featured: true },
  { to: '/recompensas', label: 'Recompensas', icon: TrophyIcon },
  { to: '/clube', label: 'Clube', icon: CrownIcon, mobile: false },
  { to: '/servicos', label: 'Serviços', icon: ScissorsIcon, mobile: false },
  { to: '/indicar', label: 'Indique e ganhe', icon: GiftIcon, mobile: false },
  { to: '/como-chegar', label: 'Como chegar', icon: PinIcon, mobile: false },
  { to: '/perfil', label: 'Perfil', icon: UserIcon },
]

/**
 * Itens que esta barbearia mostra: some o Clube e as Recompensas quando estão
 * desligados no painel. Sem Recompensas, Serviços entra na barra do celular
 * para ela continuar com cinco itens e a Agenda no centro.
 */
export function availableNavItems(): NavItem[] {
  const loyalty = isLoyaltyEnabled()
  return navItems
    .filter((item) => (item.to !== '/clube' || isClubEnabled()) && (item.to !== '/recompensas' || loyalty) && (item.to !== '/indicar' || getTenant().referral.enabled))
    .map((item) => (!loyalty && item.to === '/servicos' ? { ...item, mobile: true } : item))
}
