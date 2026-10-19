import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Logo } from '../../components/Logo/Logo'
import { ScissorsIcon } from '../../components/ScissorsIcon/ScissorsIcon'
import { ThemeToggle } from '../../components/ThemeToggle/ThemeToggle'
import { useTenant } from '../../tenant/useTenant'
import styles from './Splash.module.css'

/**
 * Foto de fundo vem do tenant. Sem foto, o fundo cai num charcoal com luz
 * quente de luminária, então a tela continua inteira.
 */
export function Splash() {
  const { brand, copy } = useTenant()
  const heroSrc = brand.photos.hero
  const [hasPhoto, setHasPhoto] = useState(Boolean(heroSrc))

  return (
    <section className={styles.splash}>
      <div className={styles.hero} aria-hidden="true">
        {hasPhoto && (
          <img
            className={styles.photo}
            src={heroSrc}
            alt=""
            decoding="async"
            fetchPriority="high"
            onError={() => setHasPhoto(false)}
          />
        )}
      </div>

      <header className={styles.header}>
        <Logo />
        <nav className={styles.nav} aria-label="Conta">
          <ThemeToggle className={styles.navToggle} />
          <span className={styles.navHint}>Já tem conta?</span>
          <Link to="/login" className={styles.navLink}>
            Entrar
          </Link>
        </nav>
      </header>

      <div className={styles.bottom}>
        <h1 className={styles.headline}>{copy.splashHeadline}</h1>

        <Link to="/cadastro" className={styles.cta}>
          <span className={styles.ctaLabel}>{copy.splashCta}</span>
          <span className={styles.cut} aria-hidden="true">
            <ScissorsIcon className={styles.scissors} />
            <span className={styles.line} />
          </span>
        </Link>
      </div>
    </section>
  )
}
