import { useLinks, useBuyLink } from '../settings-context'
import { track } from '../tracking'
import { LogoMark } from '../ui/Logo'
import styles from './Cta.module.css'

export function Cta() {
  const buy = useBuyLink()
  const links = useLinks()
  return (
    <section className={`section ${styles.section}`} id="contato">
      <div className="container">
        <div className={styles.card} data-reveal>
          <LogoMark size={56} className={styles.mark} />
          <h2 className={`h2 ${styles.title}`}>
            Pronto para <em>ligar</em> a sua barbearia?
          </h2>
          <p className="lead">Assine aqui mesmo, crie sua senha e monte o app em 6 passos. Prefere conversar antes? Chame no WhatsApp.</p>
          <div className={styles.ctas}>
            <a className="btn btnPrimary" href={buy.href} target={buy.external ? '_blank' : undefined} rel={buy.external ? 'noreferrer' : undefined}>
              Assinar agora
            </a>
            <a className="btn btnGhost" href={links.contact} target="_blank" rel="noreferrer" onClick={() => track('contact')}>
              {links.contactLabel}
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
