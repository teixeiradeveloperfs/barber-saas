import { useRef, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Logo } from '../../components/Logo/Logo'
import { ThemeToggle } from '../../components/ThemeToggle/ThemeToggle'
import { ArrowLeftIcon } from '../../components/icons/Icons'
import { useKeyboardInset } from '../../lib/useKeyboardInset'
import { useTenant } from '../../tenant/useTenant'
import styles from './AuthLayout.module.css'

type AuthLayoutProps = {
  title: string
  subtitle?: string
  children: ReactNode
  /** Linha final da tela, ex.: "Ainda não tem conta? Criar conta". */
  footer?: ReactNode
  /** Link de voltar acima do título. */
  back?: { to: string; label: string }
}

export function AuthLayout({ title, subtitle, children, footer, back }: AuthLayoutProps) {
  const { brand, copy } = useTenant()
  const photo = brand.photos.auth ?? brand.photos.hero
  const [hasPhoto, setHasPhoto] = useState(Boolean(photo))
  const mainRef = useRef<HTMLElement>(null)
  useKeyboardInset(mainRef)

  return (
    <div className={styles.auth}>
      {/* Painel de marca: só no desktop, sempre escuro porque é foto. */}
      <aside className={styles.panel} aria-hidden="true">
        <div className={styles.panelPhoto}>
          {hasPhoto && (
            <img src={photo} alt="" decoding="async" onError={() => setHasPhoto(false)} />
          )}
        </div>
        <div className={styles.panelLogo}>
          <Logo placement="destaque" />
        </div>
        <p className={styles.panelClaim}>{copy.authClaim}</p>
      </aside>

      <main ref={mainRef} className={styles.main}>
        <header className={styles.header}>
          <Link to="/" className={styles.brand} aria-label="Início">
            <Logo />
          </Link>
          <ThemeToggle />
        </header>

        <section className={styles.content}>
          {back && (
            <Link to={back.to} className={styles.back}>
              <ArrowLeftIcon />
              {back.label}
            </Link>
          )}
          <h1 className={styles.title}>{title}</h1>
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
          <div className={styles.body}>{children}</div>
        </section>

        {footer && <footer className={styles.footer}>{footer}</footer>}
      </main>
    </div>
  )
}
