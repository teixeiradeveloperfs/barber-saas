import type { AppConfig } from '@barber/tenant-config'
import { useEffect, useState } from 'react'
import { adminApi, type AgendaSlots, type Appointment } from '../../api/admin'
import { ApiError } from '../../api/client'
import { errorMessage, formatDayLabel, formatPrice } from '../../lib/format'
import { Button } from '../../ui/Button/Button'
import { Checkbox } from '../../ui/Checkbox/Checkbox'
import { Dialog } from '../../ui/Dialog/Dialog'
import { Select } from '../../ui/Select/Select'
import { TextField } from '../../ui/TextField/TextField'
import styles from './dialogs.module.css'

type Props = {
  installationId: string
  config: AppConfig
  date: string
  defaultBarberId: string
  /** Horário já escolhido na grade do barbeiro. */
  defaultTime?: string
  onClose: () => void
  onCreated: (appointment: Appointment) => void
}

/** Agendamento pelo painel: cliente que ligou ou chegou sem marcar. */
export function NewAppointmentDialog({ installationId, config, date: initialDate, defaultBarberId, defaultTime, onClose, onCreated }: Props) {
  const [barberId, setBarberId] = useState(defaultBarberId)
  const [serviceIds, setServiceIds] = useState<string[]>(config.services[0] ? [config.services[0].id] : [])
  const [date, setDate] = useState(initialDate)
  const [time, setTime] = useState(defaultTime ?? '')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [notes, setNotes] = useState('')
  const [slots, setSlots] = useState<AgendaSlots | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const services = serviceIds.map((id) => config.services.find((item) => item.id === id)).filter((item): item is AppConfig['services'][number] => Boolean(item))
  const durationMin = services.reduce((sum, item) => sum + item.durationMin, 0) || 30
  const total = services.reduce((sum, item) => sum + item.price, 0)

  useEffect(() => {
    if (!barberId || !date) return
    let cancelled = false
    adminApi
      .agendaSlots(installationId, barberId, date, durationMin)
      .then((result) => {
        if (!cancelled) setSlots(result)
      })
      .catch(() => {
        if (!cancelled) setSlots(null)
      })
    return () => {
      cancelled = true
    }
  }, [installationId, barberId, date, durationMin])

  const available = slots?.slots.filter((slot) => slot.available) ?? []
  const chosenValid = available.some((slot) => slot.time === time)

  async function submit() {
    if (serviceIds.length === 0) return setError('Escolha pelo menos um serviço.')
    if (!chosenValid) return setError('Escolha um horário livre.')
    if (name.trim().length < 2) return setError('Informe o nome do cliente.')
    if (phone.replace(/\D/g, '').length < 10) return setError('Informe o WhatsApp com DDD.')
    setError(null)
    setSaving(true)
    try {
      onCreated(await adminApi.createAppointment(installationId, { barberId, serviceIds, date, time, customer: { name: name.trim(), phone }, notes: notes.trim() || undefined }))
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
      title="Agendar pelo painel"
      actions={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={submit} loading={saving}>
            Agendar{total > 0 ? ` · ${formatPrice(total)}` : ''}
          </Button>
        </>
      }
    >
      <div className={styles.form}>
        <div className={styles.row}>
          <Select<string> label="Barbeiro" value={barberId} onChange={setBarberId} options={config.barbers.map((barber) => ({ value: barber.id, label: barber.name }))} />
          <label className={styles.field}>
            <span className={styles.label}>Dia</span>
            <input type="date" className={styles.input} value={date} onChange={(event) => event.target.value && setDate(event.target.value)} />
          </label>
        </div>

        <div className={styles.field}>
          <span className={styles.label}>Serviços</span>
          <div className={styles.services}>
            {config.services.map((service) => (
              <Checkbox
                key={service.id}
                checked={serviceIds.includes(service.id)}
                onChange={(checked) => setServiceIds((list) => (checked ? [...list, service.id] : list.filter((id) => id !== service.id)))}
              >
                {service.name} <span className={styles.muted}>· {service.durationMin} min · {formatPrice(service.price)}</span>
              </Checkbox>
            ))}
          </div>
        </div>

        <div className={styles.field}>
          <span className={styles.label}>
            Horário {slots ? <span className={styles.muted}>· {formatDayLabel(date)}, {durationMin} min</span> : null}
          </span>
          {slots?.closed && <p className={styles.muted}>A barbearia não abre neste dia.</p>}
          {slots && !slots.open && <p className={styles.muted}>A agenda deste barbeiro está fechada{slots.closedReason ? ` (${slots.closedReason})` : ''}.</p>}
          {slots && slots.open && !slots.closed && available.length === 0 && <p className={styles.muted}>Nenhum horário livre para essa duração.</p>}
          {available.length > 0 && (
            <div className={styles.slots} role="radiogroup" aria-label="Horários livres">
              {available.map((slot) => (
                <button key={slot.time} type="button" className={[styles.slot, slot.time === time && styles.slotActive].filter(Boolean).join(' ')} onClick={() => setTime(slot.time)} role="radio" aria-checked={slot.time === time}>
                  {slot.time}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className={styles.row}>
          <TextField label="Nome do cliente" value={name} onChange={setName} placeholder="Carlos Souza" />
          <TextField label="WhatsApp" value={phone} onChange={setPhone} placeholder="(11) 98765-4321" inputMode="tel" />
        </div>
        <TextField label="Observação (opcional)" value={notes} onChange={setNotes} placeholder="Chegou sem marcar, quer barba também" />
        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}
      </div>
    </Dialog>
  )
}
