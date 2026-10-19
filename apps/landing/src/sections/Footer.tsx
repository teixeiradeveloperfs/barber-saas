import { useLinks } from '../settings-context'
import { track } from '../tracking'
import { COMPANY } from '../legal/company'
import { Logo } from '../ui/Logo'
import styles from './Footer.module.css'

export function Footer() {
  const links = useLinks()
  const year = new Date().getFullYear()
  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.inner}`}>
        <div className={styles.brand}>
          <Logo className={styles.logo} />
          <p className={styles.tagline}>
            O app e o painel da sua barbearia. Desenvolvido pela{' '}
            <a href={COMPANY.instagram} target="_blank" rel="noreferrer">
              Automa Group
            </a>
            , criado por{' '}
            <a href={COMPANY.founderInstagram} target="_blank" rel="noreferrer">
              {COMPANY.founderHandle}
            </a>
            .
          </p>
        </div>
        <nav className={styles.links} aria-label="Links do rodapé">
          <a href="#produto">Produto</a>
          <a href="#recursos">Recursos</a>
          <a href="#como-funciona">Como funciona</a>
          <a href="#perguntas">Perguntas</a>
          <a href={links.demo} target="_blank" rel="noreferrer" onClick={() => track('demo')}>
            App de exemplo
          </a>
          <a href="/parceiros">Seja parceiro</a>
          <a href={links.admin}>Painel</a>
        </nav>
      </div>
      <div className={`container ${styles.bottom}`}>
        <span>
          © {year} {COMPANY.legalName} · CNPJ {COMPANY.cnpj} · {COMPANY.city}
        </span>
        <nav className={styles.legal} aria-label="Documentos legais">
          <a href="/termos">Termos de uso</a>
          <a href="/privacidade">Privacidade</a>
          <a href="/termos-parceiros">Termos de parceiros</a>
        </nav>
      </div>
    </footer>
  )
}
