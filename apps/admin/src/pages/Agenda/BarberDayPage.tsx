import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { adminApi, assetUrl, type AgendaBlock, type Appointment, type AppointmentStatus, type BarberAgendaState } from '../../api/admin'
import { useAuth } from '../../auth/useAuth'
import { isManagerRole, useTenantRole } from '../../auth/useTenantRole'
import { Badge } from '../../components/Badge/Badge'
import { Card } from '../../components/Card/Card'
import { ErrorState, Loading } from '../../components/Loading/Loading'
import { PageHeader } from '../../components/PageHeader/PageHeader'
import { useToast } from '../../components/Toast/useToast'
import { errorMessage, formatDayLabel, shiftDay, todayKey } from '../../lib/format'
import { useResource } from '../../lib/useResource'
import { Button } from '../../ui/Button/Button'
import { Dialog } from '../../ui/Dialog/Dialog'
import { TextField } from '../../ui/TextField/TextField'
import { ArrowLeftIcon, ArrowRightIcon } from '../../ui/icons/Icons'
import { AppointmentCard } from './AppointmentCard'
import { BlockDialog } from './BlockDialog'
import { rememberAgendaTenant } from './last-tenant'
import { NewAppointmentDialog } from './NewAppointmentDialog'
import { DayView } from './DayView'
import { gridRange } from './calendar'
import styles from './BarberDayPage.module.css'

const STEP_MIN = 30

type Row =
  | { kind: 'livre'; time: string }
  | { kind: 'passou'; time: string }
  | { kind: 'atendimento'; time: string; appointment: Appointment }
  | { kind: 'continua'; time: string; appointment: Appointment }
  | { kind: 'bloqueio'; time: string; block: AgendaBlock; first: boolean }

function minutesOf(time: string) {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

function localTime(iso: string) {
  return new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' }).format(new Date(iso))
}

/** Agenda de um barbeiro num dia: a grade inteira, meia em meia hora, com o que há em cada horário. */
export function BarberDayPage() {
  const { installationId = '', barberId = '' } = useParams()
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const toast = useToast()
  const { admin } = useAuth()
  const role = useTenantRole(installationId)
  const manager = isManagerRole(role)
  const ownBarberId = role === 'BARBEIRO' ? (admin?.tenants.find((item) => item.id === installationId)?.barberId ?? null) : null

  const date = params.get('dia') && /^\d{4}-\d{2}-\d{2}$/.test(params.get('dia') ?? '') ? (params.get('dia') as string) : todayKey()
  const setDate = (next: string) => setParams(next === todayKey() ? {} : { dia: next }, { replace: true })

  const tenant = useResource(() => adminApi.getTenant(installationId), [installationId])
  const barbers = useResource(() => adminApi.agendaBarbers(installationId), [installationId])
  const slots = useResource(() => adminApi.agendaSlots(installationId, barberId, date, STEP_MIN), [installationId, barberId, date])
  const appointments = useResource(() => adminApi.listAppointments(installationId, { from: date, to: date, barberId }), [installationId, barberId, date])
  const blocks = useResource(() => adminApi.listBlocks(installationId, date, date), [installationId, date])

  const [creating, setCreating] = useState<{ key: number; time: string } | null>(null)
  const [selected, setSelected] = useState<Appointment | null>(null)
  const [blocking, setBlocking] = useState<number | null>(null)
  const [closing, setClosing] = useState(false)
  const [closeReason, setCloseReason] = useState('')
  const [busy, setBusy] = useState(false)

  const config = tenant.data ? (tenant.data.configs.published ?? tenant.data.configs.draft)?.config : undefined
  const barber = barbers.data?.find((item) => item.id === barberId)
  const profile = config?.barbers.find((item) => item.id === barberId)

  const rows = useMemo<Row[]>(() => {
    const grid = slots.data?.slots ?? []
    const active = (appointments.data ?? []).filter((item) => item.status !== 'CANCELADO')
    const dayBlocks = (blocks.data ?? []).filter((block) => !block.barberId || block.barberId === barberId)
    return grid.map((slot) => {
      const start = minutesOf(slot.time)
      const end = start + STEP_MIN
      const starting = active.find((item) => {
        const at = minutesOf(item.time)
        return at >= start && at < end
      })
      if (starting) return { kind: 'atendimento', time: slot.time, appointment: starting }
      const covering = active.find((item) => {
        const at = minutesOf(item.time)
        return at < start && at + item.durationMin > start
      })
      if (covering) return { kind: 'continua', time: slot.time, appointment: covering }
      const block = dayBlocks.find((item) => {
        const from = minutesOf(localTime(item.startsAt))
        const to = minutesOf(localTime(item.endsAt))
        return from < end && to > start
      })
      if (block) return { kind: 'bloqueio', time: slot.time, block, first: minutesOf(localTime(block.startsAt)) >= start }
      if (slot.reason === 'passou') return { kind: 'passou', time: slot.time }
      return { kind: 'livre', time: slot.time }
    })
  }, [slots.data, appointments.data, blocks.data, barberId])

  const summary = useMemo(() => {
    const list = (appointments.data ?? []).filter((item) => item.status !== 'CANCELADO')
    const count = (status: AppointmentStatus) => list.filter((item) => item.status === status).length
    return { total: list.length, livres: rows.filter((row) => row.kind === 'livre').length, atendidos: count('CONCLUIDO'), faltas: count('FALTOU') }
  }, [appointments.data, rows])

  function replaceAppointment(updated: Appointment) {
    appointments.mutate((list) => list.map((item) => (item.id === updated.id ? updated : item)))
    setSelected((current) => (current && current.id === updated.id ? updated : current))
  }

  async function changeStatus(item: Appointment, status: AppointmentStatus) {
    try {
      replaceAppointment(await adminApi.updateAppointment(installationId, item.id, { status }))
      if (status === 'CANCELADO') slots.reload()
    } catch (caught) {
      toast({ kind: 'erro', title: 'Não foi possível atualizar', detail: errorMessage(caught) })
    }
  }

  async function saveNotes(item: Appointment, notes: string) {
    try {
      replaceAppointment(await adminApi.updateAppointment(installationId, item.id, { notes }))
      toast({ kind: 'ok', title: 'Observação salva' })
    } catch (caught) {
      toast({ kind: 'erro', title: 'Não foi possível salvar', detail: errorMessage(caught) })
    }
  }

  async function setOpen(open: boolean, reason?: string) {
    if (!barber) return
    setBusy(true)
    try {
      const result = await adminApi.setBarberAgenda(installationId, barberId, { open, reason })
      barbers.mutate((list) => list.map((item): BarberAgendaState => (item.id === barberId ? { ...item, open: result.open, closedReason: result.closedReason } : item)))
      slots.reload()
      toast({ kind: 'ok', title: open ? 'Agenda aberta' : 'Agenda fechada' })
      setClosing(false)
    } catch (caught) {
      toast({ kind: 'erro', title: 'Não foi possível alterar a agenda', detail: errorMessage(caught) })
    } finally {
      setBusy(false)
    }
  }

  async function removeBlock(block: AgendaBlock) {
    try {
      await adminApi.removeBlock(installationId, block.id)
      blocks.mutate((list) => list.filter((item) => item.id !== block.id))
      slots.reload()
      toast({ kind: 'ok', title: 'Bloqueio removido' })
    } catch (caught) {
      toast({ kind: 'erro', title: 'Não foi possível remover', detail: errorMessage(caught) })
    }
  }

  if (tenant.error && !tenant.data) return <ErrorState message={tenant.error} onRetry={tenant.reload} />
  if (!tenant.data || !barbers.data) return <Loading label="Carregando agenda…" />
  if (!config || !profile || !barber) {
    return (
      <Card title="Barbeiro não encontrado">
        <p className={styles.muted}>
          Esse barbeiro não está na equipe publicada. <Link to={`/agenda/${installationId}`}>Voltar para a agenda</Link>.
        </p>
      </Card>
    )
  }
  rememberAgendaTenant(installationId)

  const today = todayKey()
  const dayLabel = date === today ? 'Hoje' : date === shiftDay(today, 1) ? 'Amanhã' : formatDayLabel(date)
  const mine = ownBarberId === barberId

  return (
    <div className={styles.page}>
      <PageHeader
        eyebrow={
          <Link to={`/agenda/${installationId}`} className={styles.back}>
            <ArrowLeftIcon />
            Agenda da equipe
          </Link>
        }
        title={
          <span className={styles.titleRow}>
            {profile.image ? <img src={assetUrl(profile.image)} alt="" className={styles.avatar} /> : <span className={styles.avatarFallback}>{profile.name.slice(0, 1)}</span>}
            <span className={styles.titleText}>
              {mine ? 'Minha agenda' : profile.name}
              <span className={styles.subtitle}>
                {mine ? profile.name : profile.specialties.join(' · ')}
                {' · '}
                {barber.open ? <Badge tone="ok">Agenda aberta</Badge> : <Badge tone="danger">{barber.closedReason ? `Fechada · ${barber.closedReason}` : 'Fechada'}</Badge>}
              </span>
            </span>
          </span>
        }
        actions={
          manager ? (
            <>
              <Button variant="ghost" size="sm" onClick={() => setBlocking(Date.now())}>
                Bloquear período
              </Button>
              {barber.open ? (
                <Button variant="ghost" size="sm" onClick={() => setClosing(true)}>
                  Fechar agenda
                </Button>
              ) : (
                <Button size="sm" onClick={() => setOpen(true)} loading={busy}>
                  Abrir agenda
                </Button>
              )}
            </>
          ) : undefined
        }
      />

      <div className={styles.toolbar}>
        <div className={styles.dayNav}>
          <Button variant="ghost" size="sm" onClick={() => setDate(shiftDay(date, -1))} aria-label="Dia anterior">
            <ArrowLeftIcon />
          </Button>
          <label className={styles.dateField}>
            <span className={styles.dayLabel}>{dayLabel}</span>
            <input type="date" value={date} onChange={(event) => event.target.value && setDate(event.target.value)} aria-label="Escolher dia" />
          </label>
          <Button variant="ghost" size="sm" onClick={() => setDate(shiftDay(date, 1))} aria-label="Próximo dia">
            <ArrowRightIcon />
          </Button>
          {date !== today && (
            <Button variant="ghost" size="sm" onClick={() => setDate(today)}>
              Hoje
            </Button>
          )}
        </div>
        <div className={styles.summary} aria-label="Resumo do dia">
          <span>
            <strong>{summary.total}</strong> {summary.total === 1 ? 'atendimento' : 'atendimentos'}
          </span>
          <span>
            <strong>{summary.livres}</strong> livres
          </span>
          <span>
            <strong>{summary.atendidos}</strong> atendidos
          </span>
          <span>
            <strong>{summary.faltas}</strong> faltas
          </span>
        </div>
      </div>

      {slots.loading && !slots.data && <Loading label="Montando a grade…" />}
      {slots.error && !slots.data && <ErrorState message={slots.error} onRetry={slots.reload} />}

      {slots.data?.closed && (
        <Card>
          <p className={styles.muted}>A barbearia não abre neste dia. Escolha outro dia.</p>
        </Card>
      )}

      {slots.data && !slots.data.closed && !slots.data.open && (
        <div className={styles.closedBanner} role="status">
          <span>
            Agenda fechada{barber.closedReason ? ` · ${barber.closedReason}` : ''}. Ninguém consegue marcar com {profile.name} até reabrir.
          </span>
          {manager && (
            <Button size="sm" onClick={() => setOpen(true)} loading={busy}>
              Abrir agenda
            </Button>
          )}
        </div>
      )}

      {slots.data && !slots.data.closed && (
        <DayView
          date={date}
          barbers={[{ id: barberId, name: profile.name }]}
          states={barbers.data}
          appointments={(appointments.data ?? []).filter((item) => item.status !== 'CANCELADO')}
          blocks={(blocks.data ?? []).filter((block) => !block.barberId || block.barberId === barberId)}
          config={config}
          range={gridRange(config, [date])}
          canCreate={manager && Boolean(slots.data?.open)}
          onOpen={setSelected}
          onCreate={(_barber, time) => setCreating({ key: Date.now(), time })}
        />
      )}

      {selected && (
        <Dialog
          open
          onClose={() => setSelected(null)}
          title={`${selected.time} · ${selected.customer.name}`}
          actions={
            <Button variant="ghost" onClick={() => setSelected(null)}>
              Fechar
            </Button>
          }
        >
          <AppointmentCard appointment={selected} config={config} role={role} showBarber={false} onStatus={(status) => changeStatus(selected, status)} onNotes={(notes) => saveNotes(selected, notes)} />
        </Dialog>
      )}

      {(blocks.data ?? []).filter((block) => !block.barberId || block.barberId === barberId).length > 0 && (
        <Card title="Bloqueios do dia" description="Períodos sem novas reservas. Atendimentos marcados antes do bloqueio continuam na grade.">
          <ul className={styles.blocks}>
            {(blocks.data ?? [])
              .filter((block) => !block.barberId || block.barberId === barberId)
              .map((block) => (
                <li key={block.id} className={styles.blockItem}>
                  <span className={styles.blockTime}>
                    {localTime(block.startsAt)} – {localTime(block.endsAt)}
                  </span>
                  <span className={styles.blockWho}>{block.barberId ? profile.name : 'Toda a barbearia'}</span>
                  <span className={styles.blockReason}>{block.reason ?? 'Sem motivo informado'}</span>
                  {manager && (
                    <Button variant="ghost" size="sm" onClick={() => removeBlock(block)}>
                      Liberar
                    </Button>
                  )}
                </li>
              ))}
          </ul>
        </Card>
      )}

      {creating && (
        <NewAppointmentDialog
          key={creating.key}
          installationId={installationId}
          config={config}
          date={date}
          defaultBarberId={barberId}
          defaultTime={creating.time}
          onClose={() => setCreating(null)}
          onCreated={(created) => {
            setCreating(null)
            if (created.date === date && created.barberId === barberId) {
              appointments.mutate((list) => [...list, created].sort((a, b) => a.startsAt.localeCompare(b.startsAt)))
              slots.reload()
            } else {
              navigate(`/agenda/${installationId}/${created.barberId}${created.date === todayKey() ? '' : `?dia=${created.date}`}`)
            }
            toast({ kind: 'ok', title: 'Agendamento criado', detail: `${created.customer.name}, ${created.time}.` })
          }}
        />
      )}
      {blocking !== null && (
        <BlockDialog
          key={blocking}
          installationId={installationId}
          config={config}
          date={date}
          defaultBarberId={barberId}
          onClose={() => setBlocking(null)}
          onCreated={(block) => {
            setBlocking(null)
            blocks.mutate((list) => [...list, block])
            slots.reload()
            toast({ kind: 'ok', title: 'Período bloqueado' })
          }}
        />
      )}

      <Dialog
        open={closing}
        onClose={() => setClosing(false)}
        title={`Fechar a agenda de ${profile.name}?`}
        actions={
          <>
            <Button variant="ghost" onClick={() => setClosing(false)} disabled={busy}>
              Voltar
            </Button>
            <Button variant="danger" loading={busy} onClick={() => setOpen(false, closeReason.trim() || undefined)}>
              Fechar agenda
            </Button>
          </>
        }
      >
        <div className={styles.dialogBody}>
          <p className={styles.muted}>Ninguém consegue marcar com este barbeiro até você abrir de novo. Atendimentos já marcados continuam.</p>
          <TextField label="Motivo (opcional)" value={closeReason} onChange={setCloseReason} placeholder="Férias, curso, folga…" hint="Aparece para o cliente no app." />
        </div>
      </Dialog>
    </div>
  )
}
