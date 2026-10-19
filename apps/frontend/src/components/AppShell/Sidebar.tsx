import { useEffect, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useUser } from '../../user/useUser'
import { isSubscriptionActive } from '../../gamification/plan'
import { useGamification } from '../../gamification/useGamification'
import { Avatar } from '../Avatar/Avatar'
import { Logo } from '../Logo/Logo'
import { ThemeToggle } from '../ThemeToggle/ThemeToggle'
import { ChevronsLeftIcon, LogOutIcon } from '../icons/Icons'
import { availableNavItems } from './nav'
import styles from './Sidebar.module.css'

const STORAGE_KEY = 'luxe-cuts:sidebar'

function readCollapsed() {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'collapsed'
  } catch {
    return false
  }
}

export function Sidebar() {
  const navigate = useNavigate()
  const { user } = useUser()
  const { state: loyalty } = useGamification()
  const isMember = isSubscriptionActive(loyalty.subscription)
  const [collapsed, setCollapsed] = useState(readCollapsed)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, collapsed ? 'collapsed' : 'expanded')
    } catch {
      // sem persistência, segue só em memória
    }
  }, [collapsed])

  return (
    <aside className={[styles.sidebar, collapsed && styles.collapsed].filter(Boolean).join(' ')}>
      <NavLink to="/home" className={styles.logo} aria-label="Início">
        <Logo />
      </NavLink>

      <nav className={styles.nav} aria-label="Principal">
        {availableNavItems()
          .map(({ to, label, icon: Icon }) => {
          // Quem já paga não é "vendido" de novo: o item vira gestão do plano.
          const text = to === '/clube' && isMember ? 'Meu plano' : label
          return (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                [styles.item, isActive && styles.active].filter(Boolean).join(' ')
              }
              title={collapsed ? text : undefined}
            >
              <Icon className={styles.icon} />
              <span className={styles.label}>{text}</span>
            </NavLink>
          )
        })}
      </nav>

      <div className={styles.footer}>
        <NavLink to="/perfil" className={styles.user} title={collapsed ? user.name : undefined}>
          <Avatar name={user.name} src={user.avatar} size={38} />
          <span className={styles.userText}>
            <span className={styles.userName}>{user.name}</span>
            <span className={styles.userHint}>Ver perfil</span>
          </span>
        </NavLink>

        <div className={styles.tools}>
          <ThemeToggle className={styles.tool} />
          <button
            type="button"
            className={styles.tool}
            onClick={() => navigate('/')}
            aria-label="Sair da conta"
            title="Sair"
          >
            <LogOutIcon />
          </button>
          <button
            type="button"
            className={[styles.tool, styles.collapse].filter(Boolean).join(' ')}
            onClick={() => setCollapsed((state) => !state)}
            aria-pressed={collapsed}
            aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
            title={collapsed ? 'Expandir' : 'Recolher'}
          >
            <ChevronsLeftIcon />
          </button>
        </div>
      </div>
    </aside>
  )
}
