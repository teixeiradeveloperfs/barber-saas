import type { OpeningHours } from '@barber/tenant-config'
import { Card } from '../../components/Card/Card'
import { useEditor } from '../../editor/useEditor'
import { Switch } from '../../ui/Switch/Switch'
import editorStyles from '../Tenant/editors/editors.module.css'

const DAYS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']

/** Passo 6: dias e horários de atendimento. Fechado não recebe agendamento. */
export function StepHours() {
  const { working, patch, issue } = useEditor()
  const setHour = (day: number, next: Partial<OpeningHours>) =>
    patch((config) => ({ ...config, hours: config.hours.map((row) => (row.day === day ? { ...row, ...next } : row)) }))
  const rows = [...working.hours].sort((a, b) => a.day - b.day)

  return (
    <Card title="Horários de atendimento" description="Os horários livres do app saem daqui, de 30 em 30 minutos.">
      <div className={editorStyles.hours}>
        {rows.map((row) => {
          const open = Boolean(row.open && row.close)
          return (
            <div key={row.day} className={editorStyles.hourRow}>
              <Switch
                checked={open}
                onChange={(checked) => setHour(row.day, checked ? { open: row.open ?? '09:00', close: row.close ?? '19:00' } : { open: undefined, close: undefined })}
                label={DAYS[row.day]}
                description={open ? undefined : 'Fechado'}
              />
              {open && (
                <div className={editorStyles.times}>
                  <label className={editorStyles.time}>
                    <span>Abre</span>
                    <input type="time" value={row.open} onChange={(event) => setHour(row.day, { open: event.target.value })} aria-invalid={issue(`hours.${row.day}.open`) ? true : undefined} />
                  </label>
                  <label className={editorStyles.time}>
                    <span>Fecha</span>
                    <input type="time" value={row.close} onChange={(event) => setHour(row.day, { close: event.target.value })} aria-invalid={issue(`hours.${row.day}.close`) ? true : undefined} />
                  </label>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </Card>
  )
}
