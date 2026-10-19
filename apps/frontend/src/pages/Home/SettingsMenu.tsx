import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Popover } from '../../components/Popover/Popover'
import { Segmented } from '../../components/Segmented/Segmented'
import {
  BellIcon,
  CrownIcon,
  DownloadIcon,
  GiftIcon,
  LogOutIcon,
  PinIcon,
  SettingsIcon,
  SparklesIcon,
  UserIcon,
} from '../../components/icons/Icons'
import { isClubEnabled } from '../../data/gamification'
import { getTenant } from '../../tenant/active'
import type { Theme } from '../../theme/theme-context'
import { useTheme } from '../../theme/useTheme'
import styles from './HeaderMenus.module.css'

const THEME_OPTIONS: { value: Theme; label: string }[] = [
  { value: 'light', label: 'Claro' },
  { value: 'dark', label: 'Escuro' },
  { value: 'system', label: 'Sistema' },
]

const LINKS = [
  { to: '/perfil', label: 'Meu perfil', hint: 'Dados, foto e segurança', icon: UserIcon },
  { to: '/perfil', label: 'Notificações', hint: 'Lembretes e novidades', icon: BellIcon },
  { to: '/clube', label: 'Meu plano', hint: 'Créditos, renovação e Clube', icon: CrownIcon },
  { to: '/indicar', label: 'Indique e ganhe', hint: 'Seu link para amigos', icon: GiftIcon },
  { to: '/como-chegar', label: 'Como chegar', hint: 'Rota, horários e contato', icon: PinIcon },
  { to: '/instalar', label: 'Instalar o app', hint: 'Ícone na tela inicial', icon: DownloadIcon },
  { to: '/bem-vindo', label: 'Tour do app', hint: 'Rever a apresentação', icon: SparklesIcon },
]

export function SettingsMenu({ className }: { className?: string }) {
  const navigate = useNavigate()
  const { theme, setTheme } = useTheme()
  const [open, setOpen] = useState(false)

  return (
    <Popover
      open={open}
      onClose={() => setOpen(false)}
      title="Configurações"
      width={320}
      trigger={(aria) => (
        <button
          type="button"
          className={[styles.iconButton, className].filter(Boolean).join(' ')}
          onClick={() => setOpen((state) => !state)}
          aria-label="Configurações"
          {...aria}
        >
          <SettingsIcon />
        </button>
      )}
    >
      <header className={styles.panelHead}>
        <h2 className={styles.panelTitle}>Configurações</h2>
      </header>

      <div className={styles.block}>
        <span className={styles.blockLabel}>Aparência</span>
        <Segmented aria-label="Aparência" options={THEME_OPTIONS} value={theme} onChange={setTheme} />
      </div>

      <ul className={styles.menu}>
        {LINKS.filter((item) => (item.to !== '/clube' || isClubEnabled()) && (item.to !== '/indicar' || getTenant().referral.enabled)).map(({ to, label, hint, icon: Icon }) => (
          <li key={label}>
            <Link to={to} className={styles.menuItem} onClick={() => setOpen(false)}>
              <Icon />
              <span>
                <span className={styles.menuLabel}>{label}</span>
                <span className={styles.menuHint}>{hint}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <footer className={styles.panelFoot}>
        <button
          type="button"
          className={styles.signOut}
          onClick={() => {
            setOpen(false)
            navigate('/')
          }}
        >
          <LogOutIcon />
          Sair da conta
        </button>
        <span className={styles.legal}>
          <Link to="/termos">Termos</Link> · <Link to="/privacidade">Privacidade</Link>
        </span>
      </footer>
    </Popover>
  )
}
