import { referralRewardLabel, type Referral, type ReferralReward } from '@barber/tenant-config'
import { adminApi } from '../../../api/admin'
import { Card } from '../../../components/Card/Card'
import { Grid, Stack } from '../../../editor/fields/Grid'
import { NumberField } from '../../../editor/fields/NumberField'
import { useEditor } from '../../../editor/useEditor'
import { useResource } from '../../../lib/useResource'
import { Select } from '../../../ui/Select/Select'
import { Switch } from '../../../ui/Switch/Switch'
import { TextField } from '../../../ui/TextField/TextField'
import { useTenantOutlet } from '../tenant-context'
import styles from './editors.module.css'

const KINDS: { value: ReferralReward['kind']; label: string }[] = [
  { value: 'nenhum', label: 'Nada' },
  { value: 'desconto_percentual', label: 'Desconto em %' },
  { value: 'desconto_valor', label: 'Desconto em R$' },
  { value: 'servico_gratis', label: 'Serviço grátis' },
]

const STATUS_LABEL = { PENDENTE: 'Aguardando 1º corte', CONCLUIDA: 'Concluída', CANCELADA: 'Cancelada' } as const
const dateFormat = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'short' })

export function ReferralEditor() {
  const { tenant } = useTenantOutlet()
  const { working, patch, issue } = useEditor()
  const { referral, services } = working
  const set = (next: Partial<Referral>) => patch((config) => ({ ...config, referral: { ...config.referral, ...next } }))
  const summary = useResource(() => adminApi.referralSummary(tenant.id), [tenant.id])

  return (
    <>
      <Card title="Indique e ganhe" description="Cada cliente tem um link próprio no app. O amigo cria a conta por ele e os dois ganham o que você definir aqui. As recompensas viram desconto real no agendamento.">
        <Stack>
          <Switch checked={referral.enabled} onChange={(enabled) => set({ enabled })} label="Indicação ativa" description="Desligada, some do menu do app e novos cadastros por link não ganham nada. Recompensas já ganhas continuam valendo." />
          <Grid>
            <TextField label="Chamada no app" value={referral.headline} onChange={(headline) => set({ headline })} error={issue('referral.headline')} />
            <NumberField label="Limite por mês para quem indica" value={referral.monthlyLimit} onChange={(monthlyLimit) => set({ monthlyLimit })} min={0} hint="0 = sem limite." error={issue('referral.monthlyLimit')} />
          </Grid>
        </Stack>
      </Card>

      <RewardCard
        title="Quem indica ganha"
        description="Liberado quando o amigo conclui o primeiro atendimento. Uma vez por amigo."
        path="referral.referrer"
        reward={referral.referrer}
        services={services}
        issue={issue}
        onChange={(referrer) => set({ referrer })}
      />

      <RewardCard
        title="O amigo ganha"
        description="Liberado ao criar a conta pelo link. Dá para usar já no primeiro agendamento."
        path="referral.referred"
        reward={referral.referred}
        services={services}
        issue={issue}
        onChange={(referred) => set({ referred })}
      />

      <Card title="Resultados" description="Indicações feitas pelos clientes desta barbearia.">
        {summary.error ? (
          <p className={styles.note}>Não deu para carregar os resultados.</p>
        ) : !summary.data ? (
          <p className={styles.note}>Carregando…</p>
        ) : (
          <Stack>
            <div className={styles.stats}>
              <Stat label="Indicações" value={summary.data.total} />
              <Stat label="Viraram clientes" value={summary.data.done} />
              <Stat label="Recompensas usadas" value={summary.data.rewardsUsed} />
            </div>
            {summary.data.recent.length === 0 ? (
              <p className={styles.note}>Nenhuma indicação ainda. Com a indicação ativa, o cliente acha o link em "Indique e ganhe" no menu do app.</p>
            ) : (
              <ul className={styles.referrals}>
                {summary.data.recent.map((row) => (
                  <li key={row.id}>
                    <span>
                      <strong>{row.referrer}</strong> indicou <strong>{row.referred}</strong>
                    </span>
                    <span className={styles.referralMeta}>
                      {STATUS_LABEL[row.status]} · {dateFormat.format(new Date(row.createdAt))}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Stack>
        )}
      </Card>
    </>
  )
}

type RewardCardProps = {
  title: string
  description: string
  path: string
  reward: ReferralReward
  services: { id: string; name: string; price: number }[]
  issue: (path: string) => string | undefined
  onChange: (reward: ReferralReward) => void
}

function RewardCard({ title, description, path, reward, services, issue, onChange }: RewardCardProps) {
  const update = (next: Partial<ReferralReward>) => onChange({ ...reward, ...next })
  const label = referralRewardLabel(reward, services)

  function changeKind(kind: ReferralReward['kind']) {
    if (kind === 'servico_gratis') update({ kind, serviceId: reward.serviceId ?? services[0]?.id })
    else if (kind === 'desconto_percentual') update({ kind, value: reward.value > 0 && reward.value <= 100 ? reward.value : 10 })
    else if (kind === 'desconto_valor') update({ kind, value: reward.value > 0 ? reward.value : 10 })
    else update({ kind })
  }

  return (
    <Card title={title} description={description}>
      <Stack>
        <Grid cols={3}>
          <Select label="Recompensa" value={reward.kind} onChange={changeKind} options={KINDS} error={issue(`${path}.kind`)} />
          {reward.kind === 'desconto_percentual' && <NumberField label="Desconto (%)" value={reward.value} onChange={(value) => update({ value })} min={1} max={100} error={issue(`${path}.value`)} />}
          {reward.kind === 'desconto_valor' && <NumberField label="Desconto (R$)" value={reward.value} onChange={(value) => update({ value })} decimals min={1} error={issue(`${path}.value`)} />}
          {reward.kind === 'servico_gratis' && (
            <Select
              label="Serviço"
              value={reward.serviceId ?? ''}
              onChange={(serviceId) => update({ serviceId })}
              options={services.length > 0 ? services.map((service) => ({ value: service.id, label: service.name })) : [{ value: '', label: 'Cadastre um serviço' }]}
              error={issue(`${path}.serviceId`)}
            />
          )}
          {reward.kind !== 'nenhum' && <NumberField label="Validade (dias)" value={reward.validDays} onChange={(validDays) => update({ validDays })} min={0} hint="0 = não expira." error={issue(`${path}.validDays`)} />}
        </Grid>
        <p className={styles.note}>{label ? `No app aparece como: ${label}.` : 'Ninguém ganha nada deste lado.'}</p>
      </Stack>
    </Card>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className={styles.stat}>
      <span className={styles.statValue}>{value}</span>
      <span className={styles.statLabel}>{label}</span>
    </div>
  )
}
