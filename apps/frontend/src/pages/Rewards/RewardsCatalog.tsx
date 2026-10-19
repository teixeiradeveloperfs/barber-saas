import { useState } from 'react'
import { Button } from '../../components/Button/Button'
import { Dialog } from '../../components/Dialog/Dialog'
import { GiftIcon, TicketIcon } from '../../components/icons/Icons'
import { formatPoints, getRewards, type Reward } from '../../data/gamification'
import type { Voucher } from '../../gamification/gamification-context'
import { useGamification } from '../../gamification/useGamification'
import styles from './rewards.module.css'

export function RewardsCatalog() {
  const { state, redeem, markVoucherUsed } = useGamification()
  const [pending, setPending] = useState<Reward | null>(null)
  const [issued, setIssued] = useState<Voucher | null>(null)

  function confirm() {
    if (!pending) return
    const voucher = redeem(pending.id)
    setPending(null)
    if (voucher) setIssued(voucher)
  }

  const activeVouchers = state.vouchers.filter((voucher) => !voucher.used)

  return (
    <section className={styles.card} aria-labelledby="trocar">
      <header className={styles.cardHead}>
        <h2 id="trocar" className={styles.cardTitle}>
          Trocar pontos
        </h2>
        <p className={styles.cardHint}>
          Você tem <strong>{formatPoints(state.points)}</strong> pontos. O voucher aparece aqui e é
          mostrado na recepção.
        </p>
      </header>

      <ul className={styles.rewardList}>
        {getRewards().map((reward) => {
          const affordable = state.points >= reward.cost
          return (
            <li key={reward.id} className={styles.rewardRow}>
              <span className={styles.rewardIcon} aria-hidden="true">
                <GiftIcon />
              </span>
              <span className={styles.rewardText}>
                <span className={styles.rewardName}>{reward.name}</span>
                <span className={styles.rewardDesc}>{reward.description}</span>
              </span>
              <span className={styles.rewardCost}>{formatPoints(reward.cost)} pts</span>
              <Button
                size="sm"
                variant={affordable ? 'primary' : 'ghost'}
                disabled={!affordable}
                onClick={() => setPending(reward)}
                title={affordable ? undefined : `Faltam ${formatPoints(reward.cost - state.points)} pontos`}
              >
                Resgatar
              </Button>
            </li>
          )
        })}
      </ul>

      {activeVouchers.length > 0 && (
        <div className={styles.vouchers}>
          <h3 className={styles.subTitle}>Seus vouchers</h3>
          <ul className={styles.voucherList}>
            {activeVouchers.map((voucher) => (
              <li key={voucher.id} className={styles.voucher}>
                <TicketIcon className={styles.voucherIcon} />
                <span className={styles.voucherText}>
                  <span className={styles.rewardName}>{voucher.name}</span>
                  <code className={styles.voucherCode}>{voucher.code}</code>
                </span>
                <Button size="sm" variant="ghost" onClick={() => markVoucherUsed(voucher.id)}>
                  Marcar como usado
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <Dialog
        open={pending !== null}
        onClose={() => setPending(null)}
        title={pending ? `Trocar ${formatPoints(pending.cost)} pontos?` : ''}
        actions={
          <>
            <Button variant="ghost" size="lg" onClick={() => setPending(null)}>
              Cancelar
            </Button>
            <Button size="lg" onClick={confirm}>
              Confirmar troca
            </Button>
          </>
        }
      >
        <p>
          Você recebe <strong>{pending?.name.toLowerCase()}</strong> e fica com{' '}
          <strong>{pending ? formatPoints(state.points - pending.cost) : ''}</strong> pontos.
        </p>
      </Dialog>

      <Dialog
        open={issued !== null}
        onClose={() => setIssued(null)}
        title="Voucher emitido"
        actions={
          <Button size="lg" onClick={() => setIssued(null)}>
            Entendi
          </Button>
        }
      >
        <p>
          <strong>{issued?.name}</strong>. Mostre o código <code>{issued?.code}</code> na
          recepção. Ele fica salvo em "Seus vouchers".
        </p>
      </Dialog>
    </section>
  )
}
