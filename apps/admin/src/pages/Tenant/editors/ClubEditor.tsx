import type { Credits, Plan } from '@barber/tenant-config'
import { Link } from 'react-router-dom'
import { Card } from '../../../components/Card/Card'
import { Grid, Stack, Subheading } from '../../../editor/fields/Grid'
import { LinesField } from '../../../editor/fields/LinesField'
import { NumberField } from '../../../editor/fields/NumberField'
import { Repeater } from '../../../editor/fields/Repeater'
import { uniqueSlug } from '../../../editor/ids'
import { useEditor } from '../../../editor/useEditor'
import { Switch } from '../../../ui/Switch/Switch'
import { TextArea } from '../../../ui/TextArea/TextArea'
import { TextField } from '../../../ui/TextField/TextField'
import styles from './editors.module.css'

function CreditsField({ label, value, onChange, error }: { label: string; value: Credits; onChange: (value: Credits) => void; error?: string }) {
  const unlimited = value === 'ilimitado'
  return (
    <Stack>
      {unlimited ? (
        <TextField label={label} value="Ilimitado" onChange={() => undefined} readOnly error={error} />
      ) : (
        <NumberField label={label} value={value} onChange={onChange} min={0} error={error} hint="Créditos por mês." />
      )}
      <Switch checked={unlimited} onChange={(checked) => onChange(checked ? 'ilimitado' : 2)} label="Ilimitado" />
    </Stack>
  )
}

export function ClubEditor() {
  const { working, patch, issue } = useEditor()
  const { club } = working
  const set = (next: Partial<typeof club>) => patch((config) => ({ ...config, club: { ...config.club, ...next } }))
  const setPlans = (plans: Plan[]) => set({ plans })
  // Com Recompensas desligadas, texto do dono que ainda fala de pontos ou selos confunde o cliente.
  const mentions = working.loyalty.enabled
    ? []
    : [
        ...club.plans.flatMap((plan) => [plan.tagline, ...plan.includes].filter((text) => /pont|selo/i.test(text)).map((text) => `Plano ${plan.name}: “${text}”`)),
        ...club.perks.flatMap((perk) => [perk.title, perk.text].filter((text) => /pont|selo/i.test(text)).map((text) => `Vantagem: “${text}”`)),
      ]

  return (
    <>
      {mentions.length > 0 && (
        <div className={styles.notice} role="status">
          <strong>Recompensas estão desligadas, mas estes textos do Clube ainda falam de pontos ou selos:</strong>
          <ul>
            {mentions.map((mention) => (
              <li key={mention}>{mention}</li>
            ))}
          </ul>
          <span>
            Ajuste nos planos e vantagens abaixo, ou religue em <Link to="../fidelidade">Recompensas</Link>.
          </span>
        </div>
      )}
      <Card title="Clube de assinatura" description="Planos mensais com créditos por tipo de serviço. Assinantes veem serviços cobertos como incluídos.">
        <Stack>
          <Switch checked={club.enabled} onChange={(enabled) => set({ enabled })} label="Clube ativo" description="Desligado, o app esconde planos, assinatura e menu do Clube." />
          <TextField label="Nome do clube" value={club.name} onChange={(name) => set({ name })} error={issue('club.name')} />
        </Stack>
      </Card>

      <Card title="Planos">
        <Repeater
          items={club.plans}
          onChange={setPlans}
          title={(plan) => (plan.name ? `${plan.name} · R$ ${plan.price.toFixed(2).replace('.', ',')}/mês` : '')}
          addLabel="Adicionar plano"
          empty="Sem planos. Cadastre pelo menos um para o Clube fazer sentido."
          create={() => ({
            id: uniqueSlug('novo-plano', club.plans.map((p) => p.id)),
            name: '',
            tagline: '',
            price: 0,
            covers: { cabelo: 2, barba: 0, extras: [] },
            includes: [],
          })}
        >
          {(plan, index, update) => (
            <Stack>
              <Grid>
                <TextField label="Nome" value={plan.name} onChange={(name) => update({ name, id: uniqueSlug(name, club.plans.filter((_, i) => i !== index).map((p) => p.id), plan.id) })} error={issue(`club.plans.${index}.name`)} />
                <NumberField label="Preço mensal (R$)" value={plan.price} onChange={(price) => update({ price })} decimals min={0} error={issue(`club.plans.${index}.price`)} />
              </Grid>
              <TextField label="Frase do plano" value={plan.tagline} onChange={(tagline) => update({ tagline })} error={issue(`club.plans.${index}.tagline`)} hint="Ex.: Para quem corta toda semana." />
              <Subheading hint="Quantos serviços de cada tipo o plano cobre por mês.">Cobertura</Subheading>
              <Grid>
                <CreditsField label="Cortes" value={plan.covers.cabelo} onChange={(cabelo) => update({ covers: { ...plan.covers, cabelo } })} error={issue(`club.plans.${index}.covers.cabelo`)} />
                <CreditsField label="Barbas" value={plan.covers.barba} onChange={(barba) => update({ covers: { ...plan.covers, barba } })} error={issue(`club.plans.${index}.covers.barba`)} />
              </Grid>
              <LinesField label="Extras cobertos" value={plan.covers.extras} onChange={(extras) => update({ covers: { ...plan.covers, extras } })} hint="Identificadores de serviços da categoria extras, um por linha. Ex.: sobrancelha" error={issue(`club.plans.${index}.covers.extras`)} />
              <LinesField label="O que está incluso" value={plan.includes} onChange={(includes) => update({ includes })} placeholder={'2 cortes por mês\nAgendamento prioritário'} error={issue(`club.plans.${index}.includes`)} />
              <Switch checked={Boolean(plan.highlight)} onChange={(highlight) => update({ highlight: highlight || undefined })} label="Plano em destaque" description="Recebe a marcação de recomendado." />
            </Stack>
          )}
        </Repeater>
      </Card>

      <Card title="Vantagens" description="Argumentos curtos mostrados na página do Clube para quem ainda não assina.">
        <Repeater
          items={club.perks}
          onChange={(perks) => set({ perks })}
          title={(perk) => perk.title}
          addLabel="Adicionar vantagem"
          create={() => ({ title: '', text: '' })}
        >
          {(perk, index, update) => (
            <Stack>
              <TextField label="Título" value={perk.title} onChange={(title) => update({ title })} error={issue(`club.perks.${index}.title`)} />
              <TextArea label="Texto" value={perk.text} onChange={(text) => update({ text })} rows={2} error={issue(`club.perks.${index}.text`)} />
            </Stack>
          )}
        </Repeater>
      </Card>
    </>
  )
}
