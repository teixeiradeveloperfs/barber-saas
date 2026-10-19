import { useEffect, useState } from 'react'
import { Button } from '../../components/Button/Button'
import { CheckIcon, GiftIcon, ShareIcon } from '../../components/icons/Icons'
import { referralsApi, type ReferralMe } from '../../lib/api'
import { getTenant } from '../../tenant/active'
import styles from './refer.module.css'

const dateFormat = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'short' })

/** Indique e ganhe: link do cliente, o que cada um ganha, amigos e recompensas. */
export function Refer() {
  const [data, setData] = useState<ReferralMe | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    referralsApi.me().then(setData, (caught: unknown) => setError(caught instanceof Error ? caught.message : 'Não deu para carregar.'))
  }, [])

  const shop = getTenant().name
  const link = data ? `${window.location.origin}/cadastro?indicacao=${data.code}` : ''
  const message = data ? `Corto na ${shop} e marco tudo pelo app. Cria sua conta pelo meu link${data.friendGets ? ` e ganha ${data.friendGets} no primeiro corte` : ''}: ${link}` : ''

  async function share() {
    if (navigator.share) {
      await navigator.share({ title: shop, text: message }).catch(() => undefined)
      return
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank', 'noopener')
  }

  async function copy() {
    await navigator.clipboard?.writeText(link).catch(() => undefined)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2000)
  }

  const done = data?.referrals.filter((item) => item.status === 'CONCLUIDA').length ?? 0

  return (
    <div className={styles.page}>
      <header className={styles.head}>
        <h1 className={styles.title}>{data?.headline ?? 'Indique e ganhe'}</h1>
        <p className={styles.subtitle}>
          {data?.youGet ? `Seu amigo cria a conta pelo seu link${data.friendGets ? ` e ganha ${data.friendGets}` : ''}. Quando ele for atendido, você ganha ${data.youGet}.` : 'Mande seu link para os amigos.'}
        </p>
      </header>

      {error && <p className={styles.error}>{error}</p>}

      {data && (
        <div className={styles.layout}>
          <section className={styles.card}>
            <span className={styles.label}>Seu código</span>
            <span className={styles.code}>{data.code}</span>
            <div className={styles.actions}>
              <Button onClick={share}>
                <ShareIcon />
                Compartilhar
              </Button>
              <Button variant="ghost" onClick={copy}>
                {copied ? 'Link copiado' : 'Copiar link'}
              </Button>
            </div>
            <ol className={styles.steps}>
              <li>Mande o link para um amigo.</li>
              <li>Ele cria a conta{data.friendGets ? ` e ganha ${data.friendGets}` : ''}.</li>
              <li>Ele é atendido e você ganha {data.youGet ?? 'a recompensa'}.</li>
            </ol>
          </section>

          <section className={styles.card}>
            <h2 className={styles.cardTitle}>
              <GiftIcon />
              Suas recompensas
            </h2>
            {data.rewards.length === 0 ? (
              <p className={styles.muted}>Nenhuma por enquanto. Quando um amigo seu for atendido, ela aparece aqui e você usa ao agendar.</p>
            ) : (
              <ul className={styles.list}>
                {data.rewards.map((reward) => (
                  <li key={reward.id}>
                    <strong>{reward.label}</strong>
                    <span>{reward.source === 'INDICADO' ? 'Boas-vindas por indicação' : 'Amigo indicado'}{reward.expiresAt ? ` · vale até ${dateFormat.format(new Date(reward.expiresAt))}` : ''}</span>
                  </li>
                ))}
              </ul>
            )}
            {data.rewards.length > 0 && <p className={styles.muted}>Use na hora de agendar: escolha a recompensa antes de confirmar.</p>}
          </section>

          <section className={styles.card}>
            <h2 className={styles.cardTitle}>Amigos indicados · {done} {done === 1 ? 'atendido' : 'atendidos'}</h2>
            {data.referrals.length === 0 ? (
              <p className={styles.muted}>Ninguém ainda. O primeiro corte do seu amigo pode sair mais barato.</p>
            ) : (
              <ul className={styles.list}>
                {data.referrals.map((item, index) => (
                  <li key={`${item.name}-${index}`}>
                    <strong>
                      {item.status === 'CONCLUIDA' && <CheckIcon />} {item.name}
                    </strong>
                    <span>{item.status === 'CONCLUIDA' ? `Atendido em ${dateFormat.format(new Date(item.completedAt ?? item.createdAt))}` : item.status === 'PENDENTE' ? 'Criou a conta, falta o primeiro atendimento' : 'Cancelada'}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </div>
  )
}
