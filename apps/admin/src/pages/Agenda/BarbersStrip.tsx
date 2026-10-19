import { useState } from 'react'
import { Link } from 'react-router-dom'
import { assetUrl, type Appointment, type BarberAgendaState } from '../../api/admin'
import { Badge } from '../../components/Badge/Badge'
import { Button } from '../../ui/Button/Button'
import { Dialog } from '../../ui/Dialog/Dialog'
import { TextField } from '../../ui/TextField/TextField'
import styles from './BarbersStrip.module.css'

type Props = {
  barbers: BarberAgendaState[]
  appointments: Appointment[]
  canToggle: boolean
  /** Para onde o card leva: a agenda do barbeiro naquele dia. */
  linkTo: (barberId: string) => string
  onToggle: (barber: BarberAgendaState, open: boolean, reason?: string) => Promise<void>
}

/** Equipe do dia: quantos atendimentos cada um tem e se a agenda está aberta. Clicar abre a agenda da pessoa. */
export function BarbersStrip({ barbers, appointments, canToggle, linkTo, onToggle }: Props) {
  const [closing, setClosing] = useState<BarberAgendaState | null>(null)
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)

  if (barbers.length === 0) return null

  return (
    <>
      <ul className={styles.strip}>
        {barbers.map((barber) => {
          const count = appointments.filter((item) => item.barberId === barber.id && item.status !== 'CANCELADO').length
          return (
            <li key={barber.id} className={[styles.item, !barber.open && styles.closedItem].filter(Boolean).join(' ')}>
              <Link to={linkTo(barber.id)} className={styles.select} aria-label={`Abrir agenda de ${barber.name}`}>
                {barber.image ? <img src={assetUrl(barber.image)} alt="" className={styles.avatar} /> : <span className={styles.avatarFallback}>{barber.name.slice(0, 1)}</span>}
                <span className={styles.text}>
                  <span className={styles.name}>{barber.name}</span>
                  <span className={styles.count}>{count === 0 ? 'Livre no dia' : `${count} ${count === 1 ? 'atendimento' : 'atendimentos'}`} · ver agenda</span>
                </span>
              </Link>
              <div className={styles.state}>
                {barber.open ? <Badge tone="ok">Aberta</Badge> : <Badge tone="danger">{barber.closedReason ? `Fechada · ${barber.closedReason}` : 'Fechada'}</Badge>}
                {canToggle && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      if (barber.open) {
                        setReason('')
                        setClosing(barber)
                      } else {
                        void onToggle(barber, true)
                      }
                    }}
                  >
                    {barber.open ? 'Fechar' : 'Abrir'}
                  </Button>
                )}
              </div>
            </li>
          )
        })}
      </ul>

      <Dialog
        open={closing !== null}
        onClose={() => setClosing(null)}
        title={closing ? `Fechar a agenda de ${closing.name}?` : ''}
        actions={
          <>
            <Button variant="ghost" onClick={() => setClosing(null)} disabled={busy}>
              Voltar
            </Button>
            <Button
              variant="danger"
              loading={busy}
              onClick={async () => {
                if (!closing) return
                setBusy(true)
                await onToggle(closing, false, reason.trim() || undefined)
                setBusy(false)
                setClosing(null)
              }}
            >
              Fechar agenda
            </Button>
          </>
        }
      >
        <div className={styles.dialogBody}>
          <p>Ninguém consegue marcar com este barbeiro até você abrir de novo. Atendimentos já marcados continuam.</p>
          <TextField label="Motivo (opcional)" value={reason} onChange={setReason} placeholder="Férias, curso, folga…" hint="Aparece para o cliente no app." />
        </div>
      </Dialog>
    </>
  )
}
