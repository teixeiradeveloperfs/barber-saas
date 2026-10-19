import type { AppConfig } from '@barber/tenant-config'
import { useState } from 'react'
import type { Appointment, AppointmentStatus } from '../../api/admin'
import { isManagerRole, type TenantRole } from '../../auth/useTenantRole'
import { Badge, type BadgeTone } from '../../components/Badge/Badge'
import { appointmentStatusLabel, formatPhone, formatPrice, whatsappLink } from '../../lib/format'
import { Button } from '../../ui/Button/Button'
import { ChatIcon, CheckIcon } from '../../ui/icons/Icons'
import styles from './AppointmentCard.module.css'

const tone: Record<AppointmentStatus, BadgeTone> = {
  MARCADO: 'ok',
  CONFIRMADO: 'ok',
  CONCLUIDO: 'accent',
  FALTOU: 'danger',
  CANCELADO: 'neutral',
}

type Props = {
  appointment: Appointment
  config: AppConfig
  role: TenantRole
  showBarber: boolean
  /** Na grade do barbeiro a hora já está na linha. */
  hideTime?: boolean
  onStatus: (status: AppointmentStatus) => void
  onNotes: (notes: string) => void
}

export function AppointmentCard({ appointment, config, role, showBarber, hideTime = false, onStatus, onNotes }: Props) {
  const manager = isManagerRole(role)
  const [editingNotes, setEditingNotes] = useState(false)
  const [notes, setNotes] = useState(appointment.notes ?? '')
  const barber = config.barbers.find((item) => item.id === appointment.barberId)
  const services = appointment.serviceIds.map((id) => config.services.find((item) => item.id === id)?.name ?? id)
  const covered = appointment.coveredServiceIds.length
  const end = appointment.endsAt ? new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' }).format(new Date(appointment.endsAt)) : ''
  const closed = appointment.status === 'CONCLUIDO' || appointment.status === 'FALTOU' || appointment.status === 'CANCELADO'

  return (
    <article className={[styles.card, closed && styles.closed, hideTime && styles.noTime].filter(Boolean).join(' ')}>
      {!hideTime && (
        <div className={styles.time}>
          <span className={styles.start}>{appointment.time}</span>
          <span className={styles.end}>até {end}</span>
        </div>
      )}

      <div className={styles.main}>
        <div className={styles.head}>
          <span className={styles.customer}>{appointment.customer.name}</span>
          <Badge tone={tone[appointment.status]}>{appointmentStatusLabel[appointment.status]}</Badge>
          {appointment.source === 'PAINEL' && <span className={styles.source}>pelo painel</span>}
          {appointment.customerConfirmedAt && (appointment.status === 'MARCADO' || appointment.status === 'CONFIRMADO') && (
            <span className={styles.confirmedByCustomer} title="O cliente respondeu 1 ao lembrete do WhatsApp">
              <CheckIcon />
              confirmou que vem
            </span>
          )}
        </div>
        <div className={styles.meta}>
          {showBarber && <span>{barber?.name ?? appointment.barberId}</span>}
          <span>{services.join(' + ')}</span>
          <span>{hideTime ? `até ${end} · ` : ''}{appointment.durationMin} min</span>
          <span>{appointment.total === 0 ? (covered ? 'Coberto pelo Clube' : 'Sem cobrança') : `${formatPrice(appointment.total)}${covered ? ' + Clube' : ''}`}</span>
          {appointment.discount ? <span>Indicação: −{formatPrice(appointment.discount)}{appointment.rewardLabel ? ` (${appointment.rewardLabel})` : ''}</span> : null}
        </div>
        <div className={styles.contact}>
          <a href={whatsappLink(appointment.customer.phone)} target="_blank" rel="noreferrer" className={styles.whatsapp}>
            <ChatIcon />
            {formatPhone(appointment.customer.phone)}
          </a>
          {!editingNotes && (
            <button type="button" className={styles.notesButton} onClick={() => setEditingNotes(true)}>
              {appointment.notes ? appointment.notes : 'Adicionar observação'}
            </button>
          )}
        </div>
        {editingNotes && (
          <div className={styles.notesEdit}>
            <input value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Ex.: prefere máquina 2 nas laterais" maxLength={280} autoFocus />
            <Button
              size="sm"
              onClick={() => {
                onNotes(notes)
                setEditingNotes(false)
              }}
            >
              Salvar
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setNotes(appointment.notes ?? '')
                setEditingNotes(false)
              }}
            >
              Cancelar
            </Button>
          </div>
        )}
      </div>

      <div className={styles.actions}>
        {(appointment.status === 'MARCADO' || appointment.status === 'CONFIRMADO') && (
          <>
            <Button size="sm" onClick={() => onStatus('CONCLUIDO')}>
              Atendido
            </Button>
            <Button size="sm" variant="ghost" onClick={() => onStatus('FALTOU')}>
              Faltou
            </Button>
            {manager && (
              <Button size="sm" variant="ghost" className={styles.danger} onClick={() => onStatus('CANCELADO')}>
                Cancelar
              </Button>
            )}
          </>
        )}
        {manager && (appointment.status === 'CONCLUIDO' || appointment.status === 'FALTOU') && (
          <Button size="sm" variant="ghost" onClick={() => onStatus('CONFIRMADO')}>
            Reabrir
          </Button>
        )}
      </div>
    </article>
  )
}
