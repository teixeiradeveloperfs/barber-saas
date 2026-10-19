import { startTransition, useEffect, useState, type ReactNode } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/useAuth'
import { CalendarIcon, ChatIcon, CompassIcon, HomeIcon, LockIcon, LogOutIcon, MenuIcon, UsersIcon, XIcon } from '../../ui/icons/Icons'
import { roleLabel } from '../../lib/format'
import { Logo } from '../../ui/Logo/Logo'
import { ThemeToggle } from '../../ui/ThemeToggle/ThemeToggle'
import styles from './AppShell.module.css'

const APP_NAME = import.meta.env.VITE_APP_NAME || 'Sua Barbearia'

type Item = { to: string; label: string; icon: ReactNode; show: boolean; tag?: string }
type Group = { title: string; items: Item[] }

/**
 * Casca do painel: sidebar com categorias. No desktop fica fixa à esquerda;
 * no celular vira gaveta aberta pelo botão do topo e fecha ao navegar.
 */
export function AppShell() {
  const { admin, isPlatform, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const ownsAny = isPlatform || (admin?.tenants ?? []).some((tenant) => tenant.role === 'DONO')
  const hasAgenda = isPlatform || (admin?.tenants.length ?? 0) > 0
  const managesTeam = isPlatform || (admin?.tenants ?? []).some((tenant) => tenant.role !== 'BARBEIRO')
  const managedTenant = admin?.tenants.find((tenant) => tenant.role !== 'BARBEIRO') ?? admin?.tenants[0]
  const tenantSettingsPath = managedTenant ? `/barbearias/${managedTenant.id}` : '/inicio'
  // Dono e gestor montam a barbearia e têm Início; barbeiro só opera a agenda.
  const buildsAny = managesTeam

  const groups: Group[] = [
    { title: 'Visão geral', items: [{ to: '/inicio', label: 'Início', icon: <CompassIcon />, show: buildsAny }] },
    { title: 'Configuração', items: [{ to: tenantSettingsPath, label: 'Minha barbearia', icon: <HomeIcon />, show: buildsAny }] },
    {
      title: 'Operação',
      items: [
        { to: '/agenda', label: 'Agenda', icon: <CalendarIcon />, show: hasAgenda },
        { to: '/equipe', label: 'Equipe', icon: <UsersIcon />, show: managesTeam },
        { to: '/whatsapp', label: 'WhatsApp', icon: <ChatIcon />, show: managesTeam },
        { to: '/acessos', label: 'Acessos', icon: <LockIcon />, show: ownsAny },
      ],
    },
  ]
    .map((group) => ({ ...group, items: group.items.filter((item) => item.show) }))
    .filter((group) => group.items.length > 0)

  // Esc fecha a gaveta; com ela aberta, a página de trás não rola.
  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = previous
    }
  }, [open])

  function close() {
    setOpen(false)
  }

  // Sai e vai para o login sem guardar a página atual: outro usuário pode entrar em seguida.
  // Na mesma transição, senão o RequireAuth renderiza antes e grava `from`.
  function exit() {
    startTransition(() => {
      navigate('/login', { replace: true })
      logout()
    })
  }

  const linkClass = ({ isActive }: { isActive: boolean }) => [styles.link, isActive && styles.active].filter(Boolean).join(' ')

  return (
    <div className={styles.shell}>
      <header className={styles.topbar}>
        <button type="button" className={styles.iconButton} aria-label="Abrir menu" aria-expanded={open} aria-controls="menu-lateral" onClick={() => setOpen(true)}>
          <MenuIcon />
        </button>
        <NavLink to="/" className={styles.brand} aria-label={`${APP_NAME} · início`}>
          <Logo className={styles.logo} />
        </NavLink>
        <ThemeToggle />
      </header>

      {open && <button type="button" className={styles.scrim} aria-label="Fechar menu" onClick={close} />}

      <aside id="menu-lateral" className={[styles.rail, open && styles.railOpen].filter(Boolean).join(' ')} aria-label="Menu lateral">
        <div className={styles.railHead}>
          <NavLink to="/" className={styles.brand} aria-label={`${APP_NAME} · início`} onClick={close}>
            <Logo className={styles.logo} />
          </NavLink>
          <button type="button" className={`${styles.iconButton} ${styles.closeButton}`} aria-label="Fechar menu" onClick={close}>
            <XIcon />
          </button>
        </div>

        <nav className={styles.nav} aria-label="Principal">
          {groups.map((group) => (
            <div key={group.title} className={styles.group}>
              <span className={styles.groupTitle}>{group.title}</span>
              {group.items.map((item) => (
                <NavLink key={item.to} to={item.to} className={linkClass} onClick={close}>
                  {item.icon}
                  <span>{item.label}</span>
                  {item.tag && <span className={styles.tag}>{item.tag}</span>}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className={styles.footer}>
          <NavLink to="/conta" className={({ isActive }) => [styles.account, isActive && styles.accountActive].filter(Boolean).join(' ')} title="Minha conta" onClick={close}>
            <span className={styles.avatar} aria-hidden="true">
              {(admin?.name ?? 'A').slice(0, 1).toUpperCase()}
            </span>
            <span className={styles.identity}>
              <span className={styles.name}>{admin?.name ?? 'Conta'}</span>
              <span className={styles.email}>{admin ? (admin.role !== 'PLATAFORMA' && admin.tenants.length === 0 && admin.affiliate ? 'Parceiro' : roleLabel[admin.role]) : ''}</span>
            </span>
          </NavLink>
          <div className={styles.footerActions}>
            <span className={styles.themeDesktop}>
              <ThemeToggle />
            </span>
            <button type="button" className={styles.logout} onClick={exit}>
              <LogOutIcon />
              <span>Sair</span>
            </button>
          </div>
        </div>
      </aside>

      <main className={styles.main}>
        <div className={styles.content}>
          <Outlet />
        </div>
      </main>
    </div>
  )
}
