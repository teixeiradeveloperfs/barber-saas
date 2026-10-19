import { Link } from 'react-router-dom'
import { ArrowRightIcon, GiftIcon } from '../../components/icons/Icons'
import { getTenant } from '../../tenant/active'
import styles from './LocationCard.module.css'

type Reward = { kind: string; value: number; serviceId?: string }

/** Mesmo texto de `referralRewardLabel` do pacote, sem trazer o zod para o app. */
function rewardLabel(reward: Reward, services: { id: string; name: string }[]) {
  if (reward.kind === 'desconto_percentual' && reward.value > 0) return `${Math.round(reward.value)}% de desconto`
  if (reward.kind === 'desconto_valor' && reward.value > 0) return `R$ ${reward.value.toLocaleString('pt-BR', { minimumFractionDigits: Number.isInteger(reward.value) ? 0 : 2 })} de desconto`
  if (reward.kind === 'servico_gratis') return services.find((item) => item.id === reward.serviceId)?.name.concat(' grátis') ?? null
  return null
}

/** Chamada do "Indique e ganhe" no Início; no celular é a porta de entrada. */
export function ReferCard() {
  const { referral, services } = getTenant()
  if (!referral.enabled) return null
  const you = rewardLabel(referral.referrer, services)
  const friend = rewardLabel(referral.referred, services)
  const line = [friend && `Seu amigo ganha ${friend}`, you && `você ganha ${you}`].filter(Boolean).join(' e ')

  return (
    <section className={styles.card} aria-labelledby="indique">
      <div className={styles.head}>
        <span className={styles.icon} aria-hidden="true">
          <GiftIcon />
        </span>
        <div className={styles.text}>
          <h2 id="indique" className={styles.title}>
            {referral.headline}
          </h2>
          {line && <p className={styles.hint}>{line.charAt(0).toUpperCase() + line.slice(1)}.</p>}
        </div>
      </div>
      <Link to="/indicar" className={styles.more}>
        Pegar meu link <ArrowRightIcon />
      </Link>
    </section>
  )
}
