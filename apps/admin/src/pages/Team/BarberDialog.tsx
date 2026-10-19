import { useState } from 'react'
import { adminApi, type TeamBarber, type TeamBarberInput } from '../../api/admin'
import { ApiError } from '../../api/client'
import { ImageField } from '../../editor/fields/ImageField'
import { LinesField } from '../../editor/fields/LinesField'
import { NumberField } from '../../editor/fields/NumberField'
import { errorMessage, slugify } from '../../lib/format'
import { Button } from '../../ui/Button/Button'
import { Dialog } from '../../ui/Dialog/Dialog'
import { Select } from '../../ui/Select/Select'
import { Switch } from '../../ui/Switch/Switch'
import { TextField } from '../../ui/TextField/TextField'
import styles from './TeamPage.module.css'

type Props = {
  installationId: string
  /** Sem `barber`, cadastra; com, edita. */
  barber?: TeamBarber | null
  taken: string[]
  onClose: () => void
  onSaved: (barber: TeamBarber) => void
}

type Tier = 'Pro' | 'Novo' | ''

export function BarberDialog({ installationId, barber, taken, onClose, onSaved }: Props) {
  const editing = Boolean(barber)
  const [name, setName] = useState(barber?.name ?? '')
  const [slug, setSlug] = useState(barber?.slug ?? '')
  const [slugTouched, setSlugTouched] = useState(false)
  const [tier, setTier] = useState<Tier>(barber?.tier ?? '')
  const [image, setImage] = useState<string | undefined>(barber?.image || undefined)
  const [specialties, setSpecialties] = useState<string[]>(barber?.specialties ?? [])
  const [nextLabel, setNextLabel] = useState(barber?.nextAvailable.label ?? 'Hoje')
  const [nextToday, setNextToday] = useState(barber?.nextAvailable.today ?? true)
  const [rating, setRating] = useState(barber?.rating ?? 5)
  const [reviews, setReviews] = useState(barber?.reviews ?? 0)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  function changeName(value: string) {
    setName(value)
    if (!editing && !slugTouched) setSlug(slugify(value))
  }

  async function submit() {
    if (name.trim().length < 2) return setError('Informe o nome.')
    if (!editing && (slug.length < 2 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug))) return setError('Identificador: letras minúsculas, números e hifens.')
    if (!editing && taken.includes(slug)) return setError('Já existe um barbeiro com esse identificador.')
    setError(null)
    setSaving(true)
    const input: TeamBarberInput = {
      name: name.trim(),
      tier: tier === '' ? null : tier,
      image: image ?? '',
      specialties,
      nextAvailable: { label: nextLabel.trim() || 'Hoje', today: nextToday },
      rating,
      reviews,
    }
    try {
      const saved = barber ? await adminApi.updateBarber(installationId, barber.slug, input) : await adminApi.createBarber(installationId, { ...input, slug })
      onSaved(saved)
    } catch (caught) {
      setError(caught instanceof ApiError && caught.issues[0] ? caught.issues[0].message : errorMessage(caught))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog
      open
      onClose={onClose}
      title={editing ? `Editar ${barber?.name}` : 'Novo barbeiro'}
      actions={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={submit} loading={saving}>
            {editing ? 'Salvar' : 'Adicionar à equipe'}
          </Button>
        </>
      }
    >
      <div className={styles.form}>
        <p className={styles.muted}>O que você salvar aqui aparece no app na hora: página do barbeiro, lista da equipe e agendamento.</p>
        <TextField label="Nome" value={name} onChange={changeName} autoFocus />
        {!editing && (
          <TextField
            label="Identificador"
            value={slug}
            onChange={(value) => {
              setSlugTouched(true)
              setSlug(value.toLowerCase().replace(/[^a-z0-9-]/g, ''))
            }}
            hint="Vai na URL de agendamento. Depois de criado, não muda."
            autoCapitalize="off"
            spellCheck={false}
          />
        )}
        <div className={styles.formRow}>
          <Select<Tier>
            label="Selo"
            value={tier}
            onChange={setTier}
            options={[
              { value: '', label: 'Sem selo' },
              { value: 'Pro', label: 'Pro' },
              { value: 'Novo', label: 'Novo' },
            ]}
          />
          <TextField label="Próxima vaga (texto no app)" value={nextLabel} onChange={setNextLabel} hint="Ex.: Hoje, 14:30. Vira automático em breve." />
        </div>
        <ImageField label="Foto" value={image} onChange={setImage} aspect="square" installationId={installationId} hint="Quadrada, rosto centralizado. Escolha do banco de imagens, envie um arquivo ou cole um link." />
        <LinesField label="Especialidades" value={specialties} onChange={setSpecialties} placeholder={'Degradê\nBarba clássica'} rows={3} />
        <div className={styles.formRow}>
          <NumberField label="Nota no app" value={rating} onChange={setRating} decimals min={0} max={5} hint="De 0 a 5." />
          <NumberField label="Avaliações" value={reviews} onChange={setReviews} min={0} />
        </div>
        <Switch checked={nextToday} onChange={setNextToday} label="Tem vaga hoje" description="Destaca o barbeiro na lista do app." />
        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}
      </div>
    </Dialog>
  )
}
