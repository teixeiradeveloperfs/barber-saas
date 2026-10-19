import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../components/Button/Button'
import { Logo } from '../../components/Logo/Logo'
import { ScissorsIcon } from '../../components/ScissorsIcon/ScissorsIcon'
import {
  CheckIcon,
  CrownIcon,
  DownloadIcon,
  TrophyIcon,
} from '../../components/icons/Icons'
import { formatPrice } from '../../data/barbers'
import { getClubName, getPlans, isClubEnabled, isLoyaltyEnabled, loyaltyRules } from '../../data/gamification'
import { creditsLeft, formatCredits, getPlan, isSubscriptionActive } from '../../gamification/plan'
import { useGamification } from '../../gamification/useGamification'
import { useInstall } from '../../pwa/useInstall'
import { useUser } from '../../user/useUser'
import styles from './onboarding.module.css'

type Step = {
  id: string
  eyebrow: string
  title: string
  text: string
  visual: React.ReactNode
  /** Ação secundária opcional (link para aprofundar). */
  secondary?: { label: string; to: string }
}

function firstName(name: string) {
  return name.split(' ')[0] ?? name
}

export function Onboarding() {
  const navigate = useNavigate()
  const { user, completeOnboarding } = useUser()
  const { state: loyalty } = useGamification()
  const { installed, canPrompt, install } = useInstall()
  const [index, setIndex] = useState(0)
  const [installing, setInstalling] = useState(false)

  const subscription = loyalty.subscription
  const plan = getPlan(subscription?.planId)
  const isMember = Boolean(subscription && plan && isSubscriptionActive(subscription))
  const plans = getPlans()
  const clubName = getClubName()
  const STAMPS_PER_CARD = loyaltyRules().stampsPerCard
  const cheapest = plans.length ? Math.min(...plans.map((item) => item.price)) : 0

  const steps: Step[] = [
    {
      id: 'welcome',
      eyebrow: 'Bem-vindo',
      title: `Que bom ter você aqui, ${firstName(user.name)}.`,
      text: 'Aqui você agenda com o barbeiro que preferir, acompanha seus horários e ganha por cada corte. Leva um minuto para conhecer.',
      visual: (
        <div className={`${styles.visual} ${styles.visualHero}`}>
          <Logo placement="destaque" />
        </div>
      ),
    },
    {
      id: 'booking',
      eyebrow: 'Agendar',
      title: 'Escolha o barbeiro, o dia e o horário.',
      text: 'Veja quem está livre hoje e reserve em dois toques. Reagende ou cancele sem custo até 2 horas antes.',
      visual: (
        <div className={styles.visual}>
          <div className={styles.days} aria-hidden="true">
            {['Hoje', 'Sex', 'Sáb', 'Seg'].map((day, position) => (
              <span key={day} className={[styles.day, position === 0 && styles.dayOn].filter(Boolean).join(' ')}>
                <span>{day}</span>
                <strong>{17 + position + (position > 1 ? 1 : 0)}</strong>
              </span>
            ))}
          </div>
          <div className={styles.slots} aria-hidden="true">
            {['09:30', '10:15', '14:30'].map((slot, position) => (
              <span key={slot} className={[styles.slot, position === 1 && styles.slotOn].filter(Boolean).join(' ')}>
                {slot}
              </span>
            ))}
          </div>
        </div>
      ),
    },
    {
      id: 'rewards',
      eyebrow: 'Recompensas',
      title: 'Cada corte vale selo e pontos.',
      text: `${STAMPS_PER_CARD} selos, um corte por nossa conta. Pontos viram barba grátis, produtos e descontos. Avaliar o atendimento também pontua.`,
      visual: (
        <div className={styles.visual}>
          <div className={styles.stamps} aria-hidden="true">
            {Array.from({ length: STAMPS_PER_CARD }, (_, position) => (
              <span key={position} className={[styles.stamp, position < 4 && styles.stampOn].filter(Boolean).join(' ')}>
                <ScissorsIcon />
              </span>
            ))}
          </div>
          <div className={styles.pointsRow} aria-hidden="true">
            <TrophyIcon />
            <span>+18 pontos por um corte de R$ 18</span>
          </div>
        </div>
      ),
      secondary: { label: 'Ver recompensas', to: '/recompensas' },
    },
    isMember && subscription && plan
      ? {
          id: 'member',
          eyebrow: 'Seu plano',
          title: `Seu plano ${plan.name} já está ativo.`,
          text: `Os serviços cobertos aparecem como inclusos na hora de agendar e saem do total. Renovação automática todo mês${isLoyaltyEnabled() ? ', com bônus de pontos' : ''}.`,
          visual: (
            <div className={styles.visual}>
              <div className={styles.credits} aria-hidden="true">
                <span>
                  <strong>{formatCredits(creditsLeft(subscription, plan).cabelo)}</strong>
                  cortes
                </span>
                {plan.covers.barba !== 0 && (
                  <span>
                    <strong>{formatCredits(creditsLeft(subscription, plan).barba)}</strong>
                    barbas
                  </span>
                )}
                <span className={styles.creditsBadge}>
                  <CheckIcon />
                  Ativo
                </span>
              </div>
            </div>
          ),
          secondary: { label: 'Ver meu plano', to: '/clube' },
        }
      : {
          id: 'club',
          eyebrow: clubName,
          title: 'Prefere pagar por corte ou entrar no Clube?',
          text: `Avulso, você paga só o que usar. No Clube, os cortes do mês vêm inclusos a partir de ${formatPrice(cheapest)}/mês, sem fidelidade. Dá para decidir depois.`,
          visual: (
            <div className={styles.visual}>
              <div className={styles.compare} aria-hidden="true">
                <span className={styles.compareCol}>
                  <span className={styles.compareLabel}>Avulso</span>
                  <strong>Por corte</strong>
                  <small>{isLoyaltyEnabled() ? 'Selos e pontos normais' : 'Paga o que usar'}</small>
                </span>
                <span className={`${styles.compareCol} ${styles.compareOn}`}>
                  <CrownIcon />
                  <span className={styles.compareLabel}>{clubName}</span>
                  <strong>{formatPrice(cheapest)}/mês</strong>
                  <small>Cortes inclusos, prioridade</small>
                </span>
              </div>
            </div>
          ),
          secondary: { label: 'Conhecer o Clube', to: '/clube' },
        },
    {
      id: 'install',
      eyebrow: 'Na tela inicial',
      title: installed ? 'Você já está no app.' : 'Instale e abra como um app.',
      text: installed
        ? 'Tudo pronto. Seus agendamentos ficam a um toque.'
        : 'Ícone na tela inicial, tela cheia e mais rápido. Sem passar pela loja. Pode fazer agora ou depois pelo menu.',
      visual: (
        <div className={`${styles.visual} ${styles.visualInstall}`} aria-hidden="true">
          <span className={styles.appIcon}>
            <ScissorsIcon />
          </span>
          <span className={styles.appLabel}>Luxe Cuts</span>
        </div>
      ),
      secondary: installed ? undefined : { label: 'Ver como instalar', to: '/instalar' },
    },
  ]

  const visibleSteps = steps.filter((item) => (item.id !== 'club' || isClubEnabled()) && (item.id !== 'rewards' || isLoyaltyEnabled()))
  const step = visibleSteps[index] ?? visibleSteps[visibleSteps.length - 1]
  const last = index >= visibleSteps.length - 1

  function finish(to = '/home') {
    completeOnboarding()
    navigate(to, { replace: true })
  }

  function next() {
    if (last) finish()
    else setIndex((value) => value + 1)
  }

  async function handleInstall() {
    setInstalling(true)
    await install()
    setInstalling(false)
  }

  return (
    <main className={styles.page}>
      <header className={styles.top}>
        <span className={styles.progress} aria-label={`Passo ${index + 1} de ${visibleSteps.length}`}>
          {visibleSteps.map((item, position) => (
            <span
              key={item.id}
              className={[styles.dot, position === index && styles.dotOn, position < index && styles.dotDone]
                .filter(Boolean)
                .join(' ')}
            />
          ))}
        </span>
        {!last && (
          <button type="button" className={styles.skip} onClick={() => finish()}>
            Pular
          </button>
        )}
      </header>

      <section key={step.id} className={styles.card}>
        {step.visual}
        <div className={styles.copy}>
          <span className={styles.eyebrow}>{step.eyebrow}</span>
          <h1 className={styles.title}>{step.title}</h1>
          <p className={styles.text}>{step.text}</p>
        </div>
      </section>

      <footer className={styles.actions}>
        {step.id === 'install' && canPrompt && !installed ? (
          <Button size="lg" block onClick={handleInstall} loading={installing}>
            <DownloadIcon />
            Instalar agora
          </Button>
        ) : null}
        <Button size="lg" block variant={step.id === 'install' && canPrompt && !installed ? 'ghost' : 'primary'} onClick={next}>
          {last ? 'Começar' : 'Próximo'}
        </Button>
        {step.secondary && (
          <button type="button" className={styles.secondary} onClick={() => finish(step.secondary!.to)}>
            {step.secondary.label}
          </button>
        )}
        {index > 0 && (
          <button type="button" className={styles.back} onClick={() => setIndex((value) => value - 1)}>
            Voltar
          </button>
        )}
      </footer>
    </main>
  )
}
