import type { AppConfig } from '@barber/tenant-config'
import { useState } from 'react'
import { adminApi, type AgendaBlock } from '../../api/admin'
import { ApiError } from '../../api/client'
import { errorMessage } from '../../lib/format'
import { Button } from '../../ui/Button/Button'
import { Dialog } from '../../ui/Dialog/Dialog'
import { Select } from '../../ui/Select/Select'
import { TextField } from '../../ui/TextField/TextField'
import styles from './dialogs.module.css'

type Props = {
  installationId: string
  config: AppConfig
  date: string
  defaultBarberId: string | null
  onClose: () => void
  onCreated: (block: AgendaBlock) => void
}

const ALL = '__todos__'

/** Bloqueia um período do dia: almoço, folga, feriado, manutenção. */
export function BlockDialog({ installationId, config, date: initialDate, defaultBarberId, onClose, onCreated }: Props) {
  const [barberId, setBarberId] = useState(defaultBarberId ?? ALL)
  const [date, setDate] = useState(initialDate)
  const [from, setFrom] = useState('12:00')
  const [to, setTo] = useState('13:00')
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function submit() {
    if (!from || !to || to <= from) return setError('O fim precisa ser depois do início.')
    setError(null)
    setSaving(true)
    try {
      onCreated(await adminApi.addBlock(installationId, { barberId: barberId === ALL ? null : barberId, date, from, to, reason: reason.trim() || undefined }))
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
      title="Bloquear período"
      actions={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={submit} loading={saving}>
            Bloquear
          </Button>
        </>
      }
    >
      <div className={styles.form}>
        <Select<string>
          label="Quem"
          value={barberId}
          onChange={setBarberId}
          options={[{ value: ALL, label: 'Toda a barbearia' }, ...config.barbers.map((barber) => ({ value: barber.id, label: barber.name }))]}
        />
        <div className={styles.row3}>
          <label className={styles.field}>
            <span className={styles.label}>Dia</span>
            <input type="date" className={styles.input} value={date} onChange={(event) => event.target.value && setDate(event.target.value)} />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>Das</span>
            <input type="time" className={styles.input} value={from} onChange={(event) => setFrom(event.target.value)} step={900} />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>Até</span>
            <input type="time" className={styles.input} value={to} onChange={(event) => setTo(event.target.value)} step={900} />
          </label>
        </div>
        <TextField label="Motivo (opcional)" value={reason} onChange={setReason} placeholder="Almoço, curso, feriado…" hint="O cliente vê o motivo se tentar marcar nesse horário." />
        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}
      </div>
    </Dialog>
  )
}
