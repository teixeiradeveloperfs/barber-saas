import { stagger } from '../lib/useReveal'
import { useLinks, useBuyLink } from '../settings-context'
import { track } from '../tracking'
import { ArrowRightIcon } from '../ui/Icons'
import { Pole } from './Pole'
import styles from './Hero.module.css'

const PROOF = ['Agenda em tempo real', 'Clube de assinatura', 'Domínio próprio', 'Tema claro e escuro']

export function Hero() {
  const buy = useBuyLink()
  const links = useLinks()
  return (
    <section className={styles.hero} id="topo">
      <div className={`container ${styles.grid}`}>
        <div className={styles.copy}>
          <p className={`eyebrow ${styles.rise}`} style={stagger(0)}>
            Plataforma para barbearias
          </p>
          <h1 className={`${styles.title} ${styles.rise}`} style={stagger(1)}>
            Sua barbearia com app próprio e agenda <em>de verdade</em>.
          </h1>
          <p className={`lead ${styles.rise}`} style={stagger(2)}>
            Sua Barbearia entrega o app dos seus clientes, no seu domínio e com a sua marca, e o painel da equipe: agenda do dia, clube de assinatura e fidelidade. Sem marketplace, sem app de
            terceiros.
          </p>
          <div className={`${styles.ctas} ${styles.rise}`} style={stagger(3)}>
            <a className="btn btnPrimary" href={buy.href} target={buy.external ? '_blank' : undefined} rel={buy.external ? 'noreferrer' : undefined}>
              Quero para minha barbearia
            </a>
            <a className="btn btnGhost" href={links.demo} target="_blank" rel="noreferrer" onClick={() => track('demo')}>
              Ver o app de exemplo
              <ArrowRightIcon />
            </a>
          </div>
          <ul className={`${styles.proof} ${styles.rise}`} style={stagger(4)} aria-label="O que vem incluso">
            {PROOF.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>

        <Pole className={styles.poleDesktop} />

        <div className={`${styles.visual} ${styles.rise}`} style={stagger(2)}>
          <Pole direction="horizontal" className={styles.poleMobile} />
          <figure className={styles.panel}>
            <img src="/shots/painel-agenda.webp" alt="Painel da Sua Barbearia mostrando a agenda do dia com a equipe e os atendimentos" width={1440} height={900} loading="eager" />
          </figure>
          <figure className={styles.phone}>
            <img src="/shots/app-home.webp" alt="App da barbearia no celular: saudação, pontos de fidelidade, plano do clube e barbeiros" width={390} height={844} loading="eager" />
          </figure>
        </div>
      </div>
    </section>
  )
}
