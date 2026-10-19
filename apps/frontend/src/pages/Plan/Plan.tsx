import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Button } from '../../components/Button/Button'
import { Dialog } from '../../components/Dialog/Dialog'
import { CheckIcon, CrownIcon, SparklesIcon } from '../../components/icons/Icons'
import { formatPrice } from '../../data/barbers'
import {
  formatPoints,
  getClubName,
  getClubPerks,
  getPlans,
  isClubEnabled,
  loyaltyRules,
  type Plan as PlanType,
  isLoyaltyEnabled,
} from '../../data/gamification'
import { creditsLeft, formatCredits, getPlan, isSubscriptionActive } from '../../gamification/plan'
import { useGamification } from '../../gamification/useGamification'
import styles from './plan.module.css'

const longDate = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'long' })

export function Plan() {
  const { state, renewPlan, changePlan, subscribe, cancelSubscription, reactivateSubscription } =
    useGamification()
  // Instante de referência fixo por montagem: mantém o render puro.
  const [now] = useState(() => Date.now())
  const [confirming, setConfirming] = useState(false)
  const [renewed, setRenewed] = useState(false)
  const [switching, setSwitching] = useState<string | null>(null)
  const [joining, setJoining] = useState<PlanType | null>(null)
  const [joined, setJoined] = useState<PlanType | null>(null)
  const [cancelling, setCancelling] = useState(false)
  const plans = getPlans()
  const clubPerks = getClubPerks()
  const clubName = getClubName()
  const { renewalBonus: RENEWAL_BONUS, welcomeBonus: WELCOME_BONUS } = loyaltyRules()

  const { subscription } = state
  const plan = getPlan(subscription?.planId)
  const isMember = Boolean(subscription && plan && isSubscriptionActive(subscription, now))

  // Tenant sem Clube: a rota não existe para o cliente.
  if (!isClubEnabled()) return <Navigate to="/home" replace />

  // Abre depois de assinar, já na visão de sócio.
  const welcomeDialog = (
    <Dialog
      open={joined !== null}
      onClose={() => setJoined(null)}
      title="Bem-vindo ao Clube"
      actions={
        <Button size="lg" onClick={() => setJoined(null)}>
          Ver meu plano
        </Button>
      }
    >
      <p>
        Plano <strong>{joined?.name}</strong> ativo. Seus créditos já valem no próximo agendamento
        {isLoyaltyEnabled() ? <>e o saldo agora é <strong>{formatPoints(state.points)} pontos</strong>.</> : null}
      </p>
    </Dialog>
  )

  /* ---------------- avulso: proposta do Clube ---------------- */

  if (!isMember || !subscription || !plan) {
    return (
      <div className={styles.page}>
        <header className={styles.head}>
          <span className={styles.eyebrow}>
            <CrownIcon />
            {clubName}
          </span>
          <h1 className={styles.title}>Corte todo mês. Pague um preço só.</h1>
          <p className={styles.subtitle}>
            {isLoyaltyEnabled()
              ? `Você é cliente avulso: paga por serviço e já ganha selos e pontos. No Clube, os cortes do mês vêm inclusos, a agenda abre antes para você e cada renovação vale ${RENEWAL_BONUS} pontos.`
              : 'Você é cliente avulso: paga por serviço. No Clube, os cortes do mês vêm inclusos e a agenda abre antes para você.'}
          </p>
        </header>

        <ul className={styles.perks}>
          {clubPerks.map((perk) => (
            <li key={perk.title} className={styles.perk}>
              <CheckIcon />
              <span>
                <span className={styles.perkTitle}>{perk.title}</span>
                <span className={styles.perkText}>{perk.text}</span>
              </span>
            </li>
          ))}
        </ul>

        <section aria-labelledby="planos">
          <h2 id="planos" className={styles.sectionTitle}>
            Escolha seu plano
          </h2>
          <div className={styles.planGrid}>
            {plans.map((item) => (
              <article
                key={item.id}
                className={[styles.planCard, item.highlight && styles.planHighlight].filter(Boolean).join(' ')}
              >
                <div className={styles.planCardTop}>
                  <span className={styles.planCardName}>{item.name}</span>
                  {item.highlight && <span className={styles.tag}>Mais escolhido</span>}
                </div>
                <p className={styles.planTagline}>{item.tagline}</p>
                <p className={styles.planCardPrice}>
                  {formatPrice(item.price)}
                  <span>/mês</span>
                </p>
                <ul className={styles.planCardList}>
                  {item.includes.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
                <Button block variant={item.highlight ? 'primary' : 'ghost'} onClick={() => setJoining(item)}>
                  Assinar {item.name}
                </Button>
              </article>
            ))}
          </div>
          <p className={styles.footnote}>
            Sem fidelidade. Cancele quando quiser e use até o fim do ciclo pago.
            {isLoyaltyEnabled() && (
              <>
                {' '}Ao assinar você ganha <strong>+{WELCOME_BONUS} pontos</strong> de boas-vindas.
              </>
            )}
          </p>
        </section>

        <Dialog
          open={joining !== null}
          onClose={() => setJoining(null)}
          title={joining ? `Assinar o plano ${joining.name}?` : ''}
          actions={
            <>
              <Button variant="ghost" size="lg" onClick={() => setJoining(null)}>
                Voltar
              </Button>
              <Button
                size="lg"
                onClick={() => {
                  if (!joining) return
                  subscribe(joining.id)
                  setJoined(joining)
                  setJoining(null)
                }}
              >
                Assinar por {joining ? formatPrice(joining.price) : ''}/mês
              </Button>
            </>
          }
        >
          <p>
            Cobramos {joining ? formatPrice(joining.price) : ''} agora no cartão cadastrado e todo
            mês na mesma data. Os créditos do ciclo ficam disponíveis na hora{isLoyaltyEnabled() ? ` e você ganha ${WELCOME_BONUS} pontos` : ''}.
          </p>
        </Dialog>

        {welcomeDialog}
      </div>
    )
  }

  /* ---------------- sócio: gestão do plano ---------------- */

  const renewsAt = new Date(subscription.renewsAt)
  const daysLeft = Math.max(0, Math.ceil((renewsAt.getTime() - now) / 86_400_000))
  const left = creditsLeft(subscription, plan)
  const cancelled = subscription.status === 'cancelada'

  function confirmRenew() {
    renewPlan()
    setConfirming(false)
    setRenewed(true)
  }

  return (
    <div className={styles.page}>
      <header className={styles.head}>
        <span className={styles.eyebrow}>
          <CrownIcon />
          {clubName}
        </span>
        <h1 className={styles.title}>Meu plano</h1>
        <p className={styles.subtitle}>
          {isLoyaltyEnabled() ? `Créditos do ciclo, renovação e bônus de ${RENEWAL_BONUS} pontos a cada mês renovado.` : 'Créditos do ciclo e renovação.'}
        </p>
      </header>

      {cancelled && (
        <div className={styles.notice} role="status">
          <span>
            Assinatura cancelada. Você continua sócio até <strong>{longDate.format(renewsAt)}</strong>{' '}
            e depois volta a pagar por serviço.
          </span>
          <Button size="sm" onClick={reactivateSubscription}>
            Reativar
          </Button>
        </div>
      )}

      <div className={styles.layout}>
        <section className={styles.current}>
          <div className={styles.currentTop}>
            <span className={styles.eyebrowSmall}>Plano atual</span>
            <span className={styles.renewals}>
              {subscription.renewals} {subscription.renewals === 1 ? 'renovação' : 'renovações'}
            </span>
          </div>
          <h2 className={styles.planName}>{plan.name}</h2>
          <p className={styles.price}>
            {formatPrice(plan.price)}
            <span> por mês</span>
          </p>

          <dl className={styles.facts}>
            <div>
              <dt>{cancelled ? 'Termina em' : 'Renova em'}</dt>
              <dd>
                {longDate.format(renewsAt)}
                <span className={styles.factHint}>
                  {daysLeft === 0 ? 'hoje' : `em ${daysLeft} ${daysLeft === 1 ? 'dia' : 'dias'}`}
                </span>
              </dd>
            </div>
            <div>
              <dt>Cortes restantes</dt>
              <dd>
                {formatCredits(left.cabelo)}
                <span className={styles.factHint}>
                  {plan.covers.cabelo === 'ilimitado' ? 'sem limite' : `de ${plan.covers.cabelo} no ciclo`}
                </span>
              </dd>
            </div>
            {plan.covers.barba !== 0 && (
              <div>
                <dt>Barbas restantes</dt>
                <dd>
                  {formatCredits(left.barba)}
                  <span className={styles.factHint}>
                    {plan.covers.barba === 'ilimitado' ? 'sem limite' : `de ${plan.covers.barba} no ciclo`}
                  </span>
                </dd>
              </div>
            )}
            {plan.covers.extras.length > 0 && (
              <div>
                <dt>Extras inclusos</dt>
                <dd>
                  {left.extras.length}
                  <span className={styles.factHint}>
                    {left.extras.length === 0 ? 'usados neste ciclo' : 'disponíveis'}
                  </span>
                </dd>
              </div>
            )}
          </dl>

          <ul className={styles.includes}>
            {plan.includes.map((item) => (
              <li key={item}>
                <CheckIcon />
                {item}
              </li>
            ))}
          </ul>

          {!cancelled && (
            <div className={styles.renewBox}>
              <SparklesIcon className={styles.renewIcon} />
              <p>
                Renovar agora garante o próximo ciclo e zera os créditos
                {isLoyaltyEnabled() ? (
                  <>
                    {' '}e credita <strong>+{RENEWAL_BONUS} pontos</strong> na hora.
                  </>
                ) : (
                  '.'
                )}
              </p>
            </div>
          )}

          <Button size="lg" block onClick={() => setConfirming(true)}>
            {cancelled ? 'Renovar e reativar' : 'Renovar agora'}
          </Button>

          {!cancelled && (
            <button type="button" className={styles.cancelLink} onClick={() => setCancelling(true)}>
              Cancelar assinatura
            </button>
          )}
        </section>

        <section className={styles.others} aria-labelledby="outros">
          <h2 id="outros" className={styles.sectionTitle}>
            Outros planos
          </h2>
          <div className={styles.planGrid}>
            {plans.map((item) => {
              const isCurrent = item.id === plan.id
              return (
                <article
                  key={item.id}
                  className={[styles.planCard, isCurrent && styles.planCurrent].filter(Boolean).join(' ')}
                >
                  <div className={styles.planCardTop}>
                    <span className={styles.planCardName}>{item.name}</span>
                    {isCurrent && <span className={styles.tag}>Seu plano</span>}
                  </div>
                  <p className={styles.planTagline}>{item.tagline}</p>
                  <p className={styles.planCardPrice}>
                    {formatPrice(item.price)}
                    <span>/mês</span>
                  </p>
                  <ul className={styles.planCardList}>
                    {item.includes.map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                  <Button
                    variant={isCurrent ? 'ghost' : 'primary'}
                    block
                    disabled={isCurrent}
                    onClick={() => setSwitching(item.id)}
                  >
                    {isCurrent ? 'Plano atual' : 'Trocar para este'}
                  </Button>
                </article>
              )
            })}
          </div>
        </section>
      </div>

      <Dialog
        open={confirming}
        onClose={() => setConfirming(false)}
        title={`Renovar o plano ${plan.name}?`}
        actions={
          <>
            <Button variant="ghost" size="lg" onClick={() => setConfirming(false)}>
              Cancelar
            </Button>
            <Button size="lg" onClick={confirmRenew}>
              Renovar por {formatPrice(plan.price)}
            </Button>
          </>
        }
      >
        <p>
          Cobramos {formatPrice(plan.price)} no cartão cadastrado, o ciclo estende 30 dias a partir
          de {longDate.format(renewsAt)} e os créditos voltam ao total{isLoyaltyEnabled() ? `, e você ganha ${RENEWAL_BONUS} pontos` : ''}.
        </p>
      </Dialog>

      <Dialog
        open={renewed}
        onClose={() => setRenewed(false)}
        title="Plano renovado"
        actions={
          <Button size="lg" onClick={() => setRenewed(false)}>
            Fechar
          </Button>
        }
      >
        <p>
          Próxima renovação em{' '}
          {longDate.format(new Date(state.subscription?.renewsAt ?? subscription.renewsAt))}.
          {isLoyaltyEnabled() && (
            <>
              {' '}Seu saldo agora é <strong>{formatPoints(state.points)} pontos</strong>.
            </>
          )}
        </p>
      </Dialog>

      <Dialog
        open={switching !== null}
        onClose={() => setSwitching(null)}
        title="Trocar de plano?"
        actions={
          <>
            <Button variant="ghost" size="lg" onClick={() => setSwitching(null)}>
              Cancelar
            </Button>
            <Button
              size="lg"
              onClick={() => {
                if (switching) changePlan(switching)
                setSwitching(null)
              }}
            >
              Confirmar troca
            </Button>
          </>
        }
      >
        <p>
          O novo plano vale a partir da próxima renovação.{' '}
          {isLoyaltyEnabled() ? 'Os créditos deste ciclo, selos, pontos e nível continuam iguais.' : 'Os créditos deste ciclo continuam iguais.'}
        </p>
      </Dialog>

      <Dialog
        open={cancelling}
        onClose={() => setCancelling(false)}
        title="Cancelar a assinatura?"
        actions={
          <>
            <Button variant="ghost" size="lg" onClick={() => setCancelling(false)}>
              Manter plano
            </Button>
            <Button
              variant="danger"
              size="lg"
              onClick={() => {
                cancelSubscription()
                setCancelling(false)
              }}
            >
              Cancelar assinatura
            </Button>
          </>
        }
      >
        <p>
          Você continua com os créditos e benefícios até {longDate.format(renewsAt)}. Depois volta a
          pagar por serviço, e pode reativar quando quiser.{isLoyaltyEnabled() ? ' Selos, pontos e nível ficam.' : ''}
        </p>
      </Dialog>

      {welcomeDialog}
    </div>
  )
}
