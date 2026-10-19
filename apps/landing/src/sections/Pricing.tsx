import { stagger } from '../lib/useReveal'
import { useLinks, usePlan, useBuyLink } from '../settings-context'
import { track } from '../tracking'
import { CheckIcon } from '../ui/Icons'
import styles from './Pricing.module.css'

const INCLUDED = [
  'App da barbearia com a sua marca e domínio próprio',
  'Agenda online com equipe ilimitada',
  'Clientes e agendamentos sem limite',
  'Lembrete no WhatsApp com confirmação de ida',
  'Clube de assinatura e programa de recompensas',
  'Painel para dono, gestor e barbeiros',
  'Banco de imagens, prévia ao vivo e publicação',
  'Atualizações e suporte, sem custo extra',
]

function reais(cents: number) {
  const value = cents / 100
  return value.toLocaleString('pt-BR', { minimumFractionDigits: Number.isInteger(value) ? 0 : 2, maximumFractionDigits: 2 })
}

function untilLabel(date: string) {
  return new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'long', timeZone: 'America/Sao_Paulo' }).format(new Date(`${date}T12:00:00-03:00`))
}

export function Pricing() {
  const buy = useBuyLink()
  const plan = usePlan()
  const links = useLinks()
  const founder = plan.founder.open
  const price = founder ? plan.founder.priceCents : plan.priceCents
  const limits = [
    plan.founder.slotsLeft !== null ? `${plan.founder.slotsLeft} ${plan.founder.slotsLeft === 1 ? 'vaga' : 'vagas'}` : null,
    plan.founder.until ? `até ${untilLabel(plan.founder.until)}` : null,
  ]
    .filter(Boolean)
    .join(', ')

  return (
    <section className={`section ${styles.section}`} id="preco">
      <div className={`container ${styles.grid}`}>
        <div className={styles.copy} data-reveal>
          <p className="eyebrow">Preço</p>
          <h2 className="h2">
            Um plano. <em>Tudo incluso.</em>
          </h2>
          <p className="lead">Sem pacote básico, sem cobrança por barbeiro, por cliente ou por mensagem. Você paga um valor por mês e usa tudo o que o Sua Barbearia tem.</p>
          {founder && (
            <div className={styles.founder}>
              <strong>Sócio fundador</strong>
              <p>
                Quem entra na inauguração trava R$ {reais(plan.founder.priceCents)} por mês para sempre, mesmo quando o plano subir.
                {limits ? ` Oferta com ${limits}.` : ''}
              </p>
            </div>
          )}
        </div>

        <div className={styles.card} data-reveal style={stagger(1)}>
          <div className={styles.head}>
            <span className={styles.name}>{plan.name}</span>
            {founder && <span className={styles.badge}>Preço de fundador</span>}
          </div>
          <div className={styles.price}>
            <span className={styles.currency}>R$</span>
            <span className={styles.amount}>{reais(price)}</span>
            <span className={styles.period}>por mês</span>
          </div>
          <p className={styles.guarantee}>
            <strong>7 dias de teste.</strong> Não gostou? Cancele no painel dentro de 7 dias e devolvemos 100% do valor.
          </p>
          <p className={styles.note}>Pix Automático ou cartão de crédito. Sem fidelidade: cancele quando quiser.</p>
          <ul className={styles.list}>
            {INCLUDED.map((item) => (
              <li key={item}>
                <CheckIcon />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <a className="btn btnPrimary" href={buy.href} target={buy.external ? '_blank' : undefined} rel={buy.external ? 'noreferrer' : undefined}>
            {founder ? 'Quero ser sócio fundador' : 'Assinar o Sua Barbearia'}
          </a>
          <a className={styles.whatsapp} href={links.contact} target="_blank" rel="noreferrer" onClick={() => track('contact')}>
            Prefere conversar antes? Fale no WhatsApp
          </a>
        </div>
      </div>
    </section>
  )
}
