import type { LevelId, Loyalty } from '@barber/tenant-config'
import { Card } from '../../../components/Card/Card'
import { Grid, Stack } from '../../../editor/fields/Grid'
import { LinesField } from '../../../editor/fields/LinesField'
import { NumberField } from '../../../editor/fields/NumberField'
import { Repeater } from '../../../editor/fields/Repeater'
import { uniqueSlug } from '../../../editor/ids'
import { useEditor } from '../../../editor/useEditor'
import { Switch } from '../../../ui/Switch/Switch'
import { TextArea } from '../../../ui/TextArea/TextArea'
import { TextField } from '../../../ui/TextField/TextField'
import styles from './editors.module.css'

const LEVEL_IDS: LevelId[] = ['bronze', 'prata', 'ouro', 'platina']

export function LoyaltyEditor() {
  const { working, patch, issue } = useEditor()
  const { loyalty } = working
  const set = (next: Partial<Loyalty>) => patch((config) => ({ ...config, loyalty: { ...config.loyalty, ...next } }))

  return (
    <>
      <Card title="Programa de recompensas" description="Selos por corte, pontos, níveis e o catálogo de recompensas que o cliente vê na tela Recompensas do app.">
        <Stack>
          <Switch checked={loyalty.enabled} onChange={(enabled) => set({ enabled })} label="Recompensas ativas" description="Desligado, o app some com a tela Recompensas, o cartão de pontos do Início, os pontos no agendamento e na avaliação e os bônus de pontos do Clube." />
          <Grid cols={4}>
            <NumberField label="Selos por cartela" value={loyalty.stampsPerCard} onChange={(stampsPerCard) => set({ stampsPerCard })} min={1} error={issue('loyalty.stampsPerCard')} />
            <NumberField label="Pontos por serviço coberto" value={loyalty.pointsPerCovered} onChange={(pointsPerCovered) => set({ pointsPerCovered })} min={0} error={issue('loyalty.pointsPerCovered')} />
            <NumberField label="Bônus de boas-vindas" value={loyalty.welcomeBonus} onChange={(welcomeBonus) => set({ welcomeBonus })} min={0} error={issue('loyalty.welcomeBonus')} />
            <NumberField label="Bônus ao renovar plano" value={loyalty.renewalBonus} onChange={(renewalBonus) => set({ renewalBonus })} min={0} error={issue('loyalty.renewalBonus')} />
          </Grid>
        </Stack>
      </Card>

      <Card title="Níveis" description="Quatro níveis fixos. Defina a partir de quantos pontos cada um começa.">
        <div className={styles.levels}>
          {LEVEL_IDS.map((id) => {
            const index = loyalty.levels.findIndex((level) => level.id === id)
            const level = loyalty.levels[index] ?? { id, name: id, min: 0, perks: [] }
            const update = (next: Partial<typeof level>) =>
              set({
                levels: index === -1 ? [...loyalty.levels, { ...level, ...next }] : loyalty.levels.map((item, i) => (i === index ? { ...item, ...next } : item)),
              })
            return (
              <div key={id} className={styles.level}>
                <Grid cols={3}>
                  <TextField label={`Nome (${id})`} value={level.name} onChange={(name) => update({ name })} error={issue(`loyalty.levels.${index}.name`)} />
                  <NumberField label="A partir de (pontos)" value={level.min} onChange={(min) => update({ min })} min={0} error={issue(`loyalty.levels.${index}.min`)} />
                  <LinesField label="Vantagens" value={level.perks} onChange={(perks) => update({ perks })} rows={2} error={issue(`loyalty.levels.${index}.perks`)} />
                </Grid>
              </div>
            )
          })}
        </div>
      </Card>

      <Card title="Recompensas" description="O que os pontos compram.">
        <Repeater
          items={loyalty.rewards}
          onChange={(rewards) => set({ rewards })}
          title={(reward) => (reward.name ? `${reward.name} · ${reward.cost} pts` : '')}
          addLabel="Adicionar recompensa"
          create={() => ({ id: uniqueSlug('nova-recompensa', loyalty.rewards.map((r) => r.id)), name: '', description: '', cost: 100 })}
        >
          {(reward, index, update) => (
            <Stack>
              <Grid>
                <TextField label="Nome" value={reward.name} onChange={(name) => update({ name, id: uniqueSlug(name, loyalty.rewards.filter((_, i) => i !== index).map((r) => r.id), reward.id) })} error={issue(`loyalty.rewards.${index}.name`)} />
                <NumberField label="Custo (pontos)" value={reward.cost} onChange={(cost) => update({ cost })} min={1} error={issue(`loyalty.rewards.${index}.cost`)} />
              </Grid>
              <TextArea label="Descrição" value={reward.description} onChange={(description) => update({ description })} rows={2} error={issue(`loyalty.rewards.${index}.description`)} />
            </Stack>
          )}
        </Repeater>
      </Card>

      <Card title="Como ganhar pontos" description="Regras mostradas ao cliente. O valor é texto livre, ex.: +15 pts.">
        <Repeater
          items={loyalty.earnRules}
          onChange={(earnRules) => set({ earnRules })}
          title={(rule) => rule.label}
          addLabel="Adicionar regra"
          create={() => ({ id: uniqueSlug('nova-regra', loyalty.earnRules.map((r) => r.id)), label: '', points: '+10 pts' })}
        >
          {(rule, index, update) => (
            <Grid>
              <TextField label="Ação" value={rule.label} onChange={(label) => update({ label, id: uniqueSlug(label, loyalty.earnRules.filter((_, i) => i !== index).map((r) => r.id), rule.id) })} error={issue(`loyalty.earnRules.${index}.label`)} />
              <TextField label="Pontos" value={rule.points} onChange={(points) => update({ points })} error={issue(`loyalty.earnRules.${index}.points`)} />
            </Grid>
          )}
        </Repeater>
      </Card>

      <Card title="Conquistas" description="Metas com barra de progresso na página de recompensas.">
        <Repeater
          items={loyalty.achievements}
          onChange={(achievements) => set({ achievements })}
          title={(item) => item.name}
          addLabel="Adicionar conquista"
          create={() => ({ id: uniqueSlug('nova-conquista', loyalty.achievements.map((a) => a.id)), name: '', description: '', target: 5 })}
        >
          {(item, index, update) => (
            <Stack>
              <Grid>
                <TextField label="Nome" value={item.name} onChange={(name) => update({ name, id: uniqueSlug(name, loyalty.achievements.filter((_, i) => i !== index).map((a) => a.id), item.id) })} error={issue(`loyalty.achievements.${index}.name`)} />
                <NumberField label="Meta" value={item.target} onChange={(target) => update({ target })} min={1} error={issue(`loyalty.achievements.${index}.target`)} hint="Quantidade para completar." />
              </Grid>
              <TextArea label="Descrição" value={item.description} onChange={(description) => update({ description })} rows={2} error={issue(`loyalty.achievements.${index}.description`)} />
            </Stack>
          )}
        </Repeater>
      </Card>
    </>
  )
}
