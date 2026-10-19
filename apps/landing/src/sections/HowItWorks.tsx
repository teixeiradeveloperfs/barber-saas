import { stagger } from '../lib/useReveal'
import { useLinks } from '../settings-context'
import { track } from '../tracking'
import { ArrowRightIcon } from '../ui/Icons'
import { Pole } from './Pole'
import styles from './HowItWorks.module.css'

const STEPS = [
  { title: 'Criamos a sua barbearia', text: 'Você recebe o acesso de dono ao painel e um endereço para começar, já com o app no ar em modo de montagem.' },
  { title: 'Você monta e publica', text: 'Marca, serviços, equipe, horários e clube, com prévia ao vivo do app. Publica quando estiver do seu jeito.' },
  { title: 'Seus clientes agendam', text: 'Conecte o seu domínio, mande o link e acompanhe a agenda do dia no painel. A equipe confirma e conclui pelo celular.' },
]

export function HowItWorks() {
  const links = useLinks()
  return (
    <section className={`section light ${styles.section}`} id="como-funciona">
      <div className="container">
        <div className={styles.head} data-reveal>
          <div className="sectionHead" style={{ marginBottom: 0 }}>
            <p className="eyebrow">Como funciona</p>
            <h2 className="h2">
              Três passos e a sua barbearia está <em>no ar</em>.
            </h2>
          </div>
          <Pole direction="horizontal" className={styles.pole} />
        </div>
        <ol className={styles.steps}>
          {STEPS.map((step, index) => (
            <li key={step.title} className={styles.step} data-reveal style={stagger(index)}>
              <span className={styles.number} aria-hidden="true">
                {index + 1}
              </span>
              <h3 className={styles.title}>{step.title}</h3>
              <p className={styles.text}>{step.text}</p>
            </li>
          ))}
        </ol>
        <div className={styles.foot} data-reveal>
          <a className="btn btnPrimary" href={links.contact} target="_blank" rel="noreferrer" onClick={() => track('contact')}>
            Quero começar
          </a>
          <a className={styles.link} href={links.demo} target="_blank" rel="noreferrer" onClick={() => track('demo')}>
            Ver uma barbearia de exemplo
            <ArrowRightIcon />
          </a>
        </div>
      </div>
    </section>
  )
}
