import { reais } from '../checkout/masks'
import { usePartnerTerms } from '../partners/terms'
import { usePlan } from '../settings-context'
import { ArrowRightIcon } from '../ui/Icons'
import { Pole } from './Pole'
import styles from './Partners.module.css'

const EXAMPLE_SHOPS = 5

/** Chamada do programa de parceiros na página de venda. Leva para /parceiros. */
export function Partners() {
  const terms = usePartnerTerms()
  const plan = usePlan()
  if (!terms.enabled) return null
  const share = terms.kind === 'FIXO' ? reais(terms.value) : `${terms.value}%`
  const perShop = terms.kind === 'FIXO' ? terms.value : Math.round((plan.priceCents * terms.value) / 100)

  return (
    <section className={`section ${styles.section}`} id="parceiros">
      <div className="container">
        <div className={styles.card} data-reveal>
          <Pole direction="horizontal" className={styles.pole} />
          <div className={styles.copy}>
            <p className="eyebrow">Programa de parceiros</p>
            <h2 className={`h2 ${styles.title}`}>
              Conhece dono de barbearia? Ganhe <em>{share}</em> todo mês.
            </h2>
            <p className="lead">
              Cada barbearia que assinar pelo seu link rende {share} da mensalidade para você,{' '}
              {terms.months > 0 ? `nas ${terms.months} primeiras mensalidades` : 'enquanto ela for assinante'}. Acompanhe tudo no painel e saque por Pix.
            </p>
            <a className="btn btnPrimary" href="/parceiros">
              Quero ser parceiro
              <ArrowRightIcon />
            </a>
          </div>
          <div className={styles.example} aria-label="Exemplo de ganho">
            <span className={styles.exampleLabel}>{EXAMPLE_SHOPS} barbearias indicadas</span>
            <strong className={styles.money}>{reais(perShop * EXAMPLE_SHOPS)}</strong>
            <span className={styles.exampleNote}>por mês, pagos por Pix</span>
          </div>
        </div>
      </div>
    </section>
  )
}
