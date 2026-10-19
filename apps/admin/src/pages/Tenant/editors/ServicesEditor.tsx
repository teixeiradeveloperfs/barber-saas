import type { Service, ServiceCategoryId } from '@barber/tenant-config'
import { Card } from '../../../components/Card/Card'
import { Grid, Stack } from '../../../editor/fields/Grid'
import { NumberField } from '../../../editor/fields/NumberField'
import { Repeater } from '../../../editor/fields/Repeater'
import { uniqueSlug } from '../../../editor/ids'
import { useEditor } from '../../../editor/useEditor'
import { Select } from '../../../ui/Select/Select'
import { Switch } from '../../../ui/Switch/Switch'
import { TextArea } from '../../../ui/TextArea/TextArea'
import { TextField } from '../../../ui/TextField/TextField'
import styles from './editors.module.css'

const CATEGORY_IDS: ServiceCategoryId[] = ['cabelo', 'barba', 'combos', 'extras']

export function ServicesEditor() {
  const { working, patch, issue } = useEditor()
  const { services, serviceCategories } = working
  const setServices = (next: Service[]) => patch((config) => ({ ...config, services: next }))
  const categoryOptions = CATEGORY_IDS.map((id) => ({ value: id, label: serviceCategories.find((c) => c.id === id)?.name ?? id }))

  return (
    <>
      <Card title="Categorias" description="Os quatro grupos são fixos porque o Clube cobre por tipo. Você renomeia e descreve como quiser.">
        <Stack>
          {CATEGORY_IDS.map((id) => {
            const index = serviceCategories.findIndex((c) => c.id === id)
            const category = serviceCategories[index] ?? { id, name: '', hint: '' }
            const update = (next: Partial<typeof category>) =>
              patch((config) => {
                const list = [...config.serviceCategories]
                const at = list.findIndex((c) => c.id === id)
                if (at === -1) list.push({ ...category, ...next })
                else list[at] = { ...list[at], ...next }
                return { ...config, serviceCategories: list }
              })
            return (
              <div key={id} className={styles.categoryRow}>
                <span className={styles.categoryId}>{id}</span>
                <TextField label="Nome" value={category.name} onChange={(name) => update({ name })} error={issue(`serviceCategories.${index}.name`)} />
                <TextField label="Descrição curta" value={category.hint} onChange={(hint) => update({ hint })} error={issue(`serviceCategories.${index}.hint`)} />
              </div>
            )
          })}
        </Stack>
      </Card>

      <Card title="Serviços" description="Preço em reais e duração em minutos. Marque os populares para destacar.">
        <Repeater
          items={services}
          onChange={setServices}
          title={(service) => (service.name ? `${service.name} · R$ ${service.price.toFixed(2).replace('.', ',')}` : '')}
          addLabel="Adicionar serviço"
          empty="Nenhum serviço. O agendamento fica vazio até você cadastrar."
          create={(): Service => ({
            id: uniqueSlug('novo-servico', services.map((s) => s.id)),
            name: '',
            description: '',
            category: 'cabelo',
            durationMin: 30,
            price: 0,
          })}
        >
          {(service, index, update) => (
            <Stack>
              <Grid>
                <TextField label="Nome" value={service.name} onChange={(name) => update({ name, id: uniqueSlug(name, services.filter((_, i) => i !== index).map((s) => s.id), service.id) })} error={issue(`services.${index}.name`)} />
                <Select label="Categoria" value={service.category} onChange={(category) => update({ category })} options={categoryOptions} error={issue(`services.${index}.category`)} />
              </Grid>
              <TextArea label="Descrição" value={service.description} onChange={(description) => update({ description })} rows={2} error={issue(`services.${index}.description`)} />
              <Grid cols={3}>
                <NumberField label="Preço (R$)" value={service.price} onChange={(price) => update({ price })} decimals min={0} error={issue(`services.${index}.price`)} />
                <NumberField label="Duração (min)" value={service.durationMin} onChange={(durationMin) => update({ durationMin })} min={5} error={issue(`services.${index}.durationMin`)} />
                <TextField label="Identificador" value={service.id} onChange={(id) => update({ id: id.toLowerCase().replace(/[^a-z0-9-]/g, '') })} error={issue(`services.${index}.id`)} />
              </Grid>
              <Switch checked={Boolean(service.popular)} onChange={(popular) => update({ popular: popular || undefined })} label="Popular" description="Ganha selo e sobe na lista." />
            </Stack>
          )}
        </Repeater>
      </Card>
    </>
  )
}
