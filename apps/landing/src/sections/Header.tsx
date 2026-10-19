import { useLinks, useBuyLink } from '../settings-context'
import { Logo } from '../ui/Logo'
import styles from './Header.module.css'

export function Header() {
  const buy = useBuyLink()
  const links = useLinks()
  return (
    <header className={styles.header}>
      <div className={`container ${styles.inner}`}>
        <a href="#topo" className={styles.brand} aria-label="Sua Barbearia, voltar ao início">
          <Logo className={styles.logo} />
        </a>
        <nav className={styles.nav} aria-label="Seções da página">
          <a href="#produto">Produto</a>
          <a href="#recursos">Recursos</a>
          <a href="#como-funciona">Como funciona</a>
          <a href="#agenda">Agenda</a>
          <a href="#preco">Preço</a>
          <a href="#perguntas">Perguntas</a>
          <a href="/parceiros" className={styles.partner}>
            Seja parceiro
          </a>
        </nav>
        <div className={styles.actions}>
          <a className={`btn btnGhost btnSm ${styles.enter}`} href={links.admin}>
            Entrar no painel
          </a>
          <a className="btn btnPrimary btnSm" href={buy.href} target={buy.external ? '_blank' : undefined} rel={buy.external ? 'noreferrer' : undefined}>
            Assinar
          </a>
        </div>
      </div>
    </header>
  )
}
