import { useMemo, useState } from 'react'
import { adminApi, type AgendaBlock, type Appointment, type AppointmentStatus, type BarberAgendaState } from '../../api/admin'
import { isManagerRole, isOwnerRole } from '../../auth/useTenantRole'
import { useAuth } from '../../auth/useAuth'
import { Card } from '../../components/Card/Card'
import { ErrorState, Loading } from '../../components/Loading/Loading'
import { useToast } from '../../components/Toast/useToast'
import { errorMessage, formatDayLabel, shiftDay, todayKey } from '../../lib/format'
import { useResource } from '../../lib/useResource'
import { Button } from '../../ui/Button/Button'
import { Dialog } from '../../ui/Dialog/Dialog'
import { Segmented } from '../../ui/Segmented/Segmented'
import { ArrowLeftIcon, ArrowRightIcon, PlusSquareIcon } from '../../ui/icons/Icons'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { useTenantRole } from '../../auth/useTenantRole'
import { PageHeader } from '../../components/PageHeader/PageHeader'
import { TenantPicker } from './TenantPicker'
import { rememberAgendaTenant } from './last-tenant'
import { AppointmentCard } from './AppointmentCard'
import { BarbersStrip } from './BarbersStrip'
import { BlockDialog } from './BlockDialog'
import { NewAppointmentDialog } from './NewAppointmentDialog'
import { DayView } from './DayView'
import { MonthView } from './MonthView'
import { WeekView } from './WeekView'
import { type AgendaView, gridRange, loadView, monthGrid, monthLabel, saveView, shiftMonth, weekLabel, weekOf } from './calendar'
import styles from './AgendaPage.module.css'

/** Agenda de uma barbearia. Página própria: operação do dia, separada da montagem do app. */
export function AgendaPage() {
  const { installationId = '' } = useParams()
  const navigate = useNavigate()
  const resource = useResource(() => adminApi.getTenant(installationId), [installationId])
  const role = useTenantRole(installationId)
  const tenant = resource.data
  const { admin } = useAuth()
  const toast = useToast()
  const config = tenant ? (tenant.configs.published ?? tenant.configs.draft)?.config : undefined
  const manager = isManagerRole(role)
  const ownBarberId = role === 'BARBEIRO' ? (admin?.tenants.find((item) => item.id === installationId)?.barberId ?? null) : null

  const [date, setDate] = useState(() => todayKey())
  const [view, setView] = useState<AgendaView>(loadView)
  const [barberFilter, setBarberFilter] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<'ativos' | 'todos'>('ativos')
  const [creating, setCreating] = useState<{ key: number; date: string; time?: string; barberId?: string } | null>(null)
  const [blocking, setBlocking] = useState<number | null>(null)
  const [selected, setSelected] = useState<Appointment | null>(null)

  // Dia, semana (segunda a domingo) ou mês inteiro (com as pontas das semanas): a API recebe a faixa.
  const days = useMemo(() => (view === 'semana' ? weekOf(date) : view === 'mes' ? monthGrid(date).flat() : [date]), [view, date])
  const from = days[0]
  const to = days[days.length - 1]
  const appointments = useResource(() => adminApi.listAppointments(installationId, { from, to }), [installationId, from, to])
  const blocks = useResource(() => adminApi.listBlocks(installationId, from, to), [installationId, from, to])
  const barbers = useResource(() => adminApi.agendaBarbers(installationId), [installationId])

  const visible = useMemo(() => {
    const list = appointments.data ?? []
    return list
      .filter((item) => (barberFilter ? item.barberId === barberFilter : true))
      .filter((item) => (statusFilter === 'ativos' ? item.status !== 'CANCELADO' : true))
  }, [appointments.data, barberFilter, statusFilter])

  const summary = useMemo(() => {
    const list = (appointments.data ?? []).filter((item) => (barberFilter ? item.barberId === barberFilter : true))
    const count = (status: AppointmentStatus) => list.filter((item) => item.status === status).length
    return { total: list.filter((item) => item.status !== 'CANCELADO').length, abertos: count('MARCADO') + count('CONFIRMADO'), atendidos: count('CONCLUIDO'), faltas: count('FALTOU') }
  }, [appointments.data, barberFilter])

  function replaceAppointment(updated: Appointment) {
    appointments.mutate((list) => list.map((item) => (item.id === updated.id ? updated : item)))
    setSelected((current) => (current && current.id === updated.id ? updated : current))
  }

  function changeView(next: AgendaView) {
    setView(next)
    saveView(next)
  }

  function shift(delta: number) {
    if (view === 'dia') setDate(shiftDay(date, delta))
    else if (view === 'semana') setDate(shiftDay(date, delta * 7))
    else setDate(shiftMonth(date, delta))
  }

  async function changeStatus(item: Appointment, status: AppointmentStatus) {
    try {
      const updated = await adminApi.updateAppointment(installationId, item.id, { status })
      replaceAppointment(updated)
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

  async function toggleBarber(barber: BarberAgendaState, open: boolean, reason?: string) {
    try {
      const result = await adminApi.setBarberAgenda(installationId, barber.id, { open, reason })
      barbers.mutate((list) => list.map((item) => (item.id === barber.id ? { ...item, open: result.open, closedReason: result.closedReason } : item)))
      toast({ kind: 'ok', title: open ? `Agenda de ${barber.name} aberta` : `Agenda de ${barber.name} fechada` })
    } catch (caught) {
      toast({ kind: 'erro', title: 'Não foi possível alterar a agenda', detail: errorMessage(caught) })
    }
  }

  async function removeBlock(block: AgendaBlock) {
    try {
      await adminApi.removeBlock(installationId, block.id)
      blocks.mutate((list) => list.filter((item) => item.id !== block.id))
      toast({ kind: 'ok', title: 'Bloqueio removido' })
    } catch (caught) {
      toast({ kind: 'erro', title: 'Não foi possível remover', detail: errorMessage(caught) })
    }
  }

  if (resource.error && !tenant) return <ErrorState message={resource.error} onRetry={resource.reload} />
  if (!tenant) return <Loading label="Carregando agenda…" />
  if (!config) return <ErrorState message="Esta barbearia ainda não tem configuração." />
  rememberAgendaTenant(installationId)
  // Barbeiro vive na própria grade.
  if (ownBarberId) return <Navigate to={`/agenda/${installationId}/${ownBarberId}`} replace />

  const barberName = (id: string | null) => (id ? config.barbers.find((barber) => barber.id === id)?.name ?? id : 'Toda a barbearia')
  const today = todayKey()
  const dayBlocks = (blocks.data ?? []).filter((block) => !barberFilter || !block.barberId || block.barberId === barberFilter)
  const rawLabel = view === 'dia' ? (date === today ? 'Hoje' : date === shiftDay(today, 1) ? 'Amanhã' : formatDayLabel(date)) : view === 'semana' ? weekLabel(days) : monthLabel(date)
  // Só a primeira letra maiúscula: "Sexta-feira, 18 de set", "Setembro de 2026".
  const periodLabel = rawLabel.charAt(0).toUpperCase() + rawLabel.slice(1)
  const range = gridRange(config, view === 'semana' ? days : [date])

  return (
    <div className={styles.page}>
      <PageHeader
        title="Agenda"
        description={role === 'BARBEIRO' ? 'Seus atendimentos do dia. Confirme, marque presença ou falta.' : 'Atendimentos do dia, agenda da equipe e bloqueios.'}
        actions={<TenantPicker current={installationId} onChange={(id) => navigate(`/agenda/${id}`)} />}
      />
      <div className={styles.toolbar}>
        <div className={styles.dayNav}>
          <Button variant="ghost" size="sm" onClick={() => shift(-1)} aria-label={view === 'dia' ? 'Dia anterior' : view === 'semana' ? 'Semana anterior' : 'Mês anterior'}>
            <ArrowLeftIcon />
          </Button>
          <label className={styles.dateField}>
            <span className={styles.dayLabel}>{periodLabel}</span>
            <input type="date" value={date} onChange={(event) => event.target.value && setDate(event.target.value)} aria-label="Escolher dia" />
          </label>
          <Button variant="ghost" size="sm" onClick={() => shift(1)} aria-label={view === 'dia' ? 'Próximo dia' : view === 'semana' ? 'Próxima semana' : 'Próximo mês'}>
            <ArrowRightIcon />
          </Button>
          {!days.includes(today) && (
            <Button variant="ghost" size="sm" onClick={() => setDate(today)}>
              Hoje
            </Button>
          )}
          <Segmented<AgendaView>
            aria-label="Visão da agenda"
            value={view}
            onChange={changeView}
            options={[
              { value: 'dia', label: 'Dia' },
              { value: 'semana', label: 'Semana' },
              { value: 'mes', label: 'Mês' },
            ]}
          />
        </div>
        <div className={styles.filters}>
          {manager && (
            <select className={styles.select} value={barberFilter} onChange={(event) => setBarberFilter(event.target.value)} aria-label="Filtrar por barbeiro">
              <option value="">Todos os barbeiros</option>
              {config.barbers.map((barber) => (
                <option key={barber.id} value={barber.id}>
                  {barber.name}
                </option>
              ))}
            </select>
          )}
          <select className={styles.select} value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as 'ativos' | 'todos')} aria-label="Filtrar por status">
            <option value="ativos">Sem cancelados</option>
            <option value="todos">Todos</option>
          </select>
          {manager && (
            <>
              <Button variant="ghost" size="sm" onClick={() => setBlocking(Date.now())}>
                Bloquear período
              </Button>
              <Button size="sm" onClick={() => setCreating({ key: Date.now(), date })}>
                <PlusSquareIcon />
                Agendar
              </Button>
            </>
          )}
        </div>
      </div>

      <div className={styles.summary} aria-label={view === 'dia' ? 'Resumo do dia' : view === 'semana' ? 'Resumo da semana' : 'Resumo do mês'}>
        <span>
          <strong>{summary.total}</strong> {summary.total === 1 ? 'atendimento' : 'atendimentos'}
        </span>
        <span>
          <strong>{summary.abertos}</strong> a atender
        </span>
        <span>
          <strong>{summary.atendidos}</strong> atendidos
        </span>
        <span>
          <strong>{summary.faltas}</strong> faltas
        </span>
      </div>

      {appointments.loading && !appointments.data && <Loading label="Carregando agenda…" />}
      {appointments.error && !appointments.data && <ErrorState message={appointments.error} onRetry={appointments.reload} />}

      {view === 'semana' && appointments.data && (
        <WeekView
          days={days}
          appointments={visible}
          blocks={dayBlocks}
          config={config}
          range={range}
          showBarber={!barberFilter}
          canCreate={manager}
          onOpen={setSelected}
          onCreate={(day, time) => setCreating({ key: Date.now(), date: day, time })}
        />
      )}
      {view === 'mes' && appointments.data && (
        <MonthView
          date={date}
          appointments={(appointments.data ?? []).filter((item) => (barberFilter ? item.barberId === barberFilter : true))}
          config={config}
          onPickDay={(day) => {
            setDate(day)
            changeView('dia')
          }}
        />
      )}

      {view === 'dia' && appointments.data && config.barbers.length > 0 && (
        <DayView
          date={date}
          barbers={config.barbers.filter((barber) => !barberFilter || barber.id === barberFilter).map((barber) => ({ id: barber.id, name: barber.name }))}
          states={barbers.data ?? undefined}
          appointments={visible}
          blocks={dayBlocks}
          config={config}
          range={range}
          canCreate={manager}
          linkTo={(barberId) => `/agenda/${installationId}/${barberId}${date === today ? '' : `?dia=${date}`}`}
          onOpen={setSelected}
          onCreate={(barberId, time) => setCreating({ key: Date.now(), date, time, barberId })}
        />
      )}

      {view === 'dia' && barbers.data && (
        <BarbersStrip
          barbers={barbers.data}
          appointments={appointments.data ?? []}
          canToggle={manager}
          linkTo={(barberId) => `/agenda/${installationId}/${barberId}${date === todayKey() ? '' : `?dia=${date}`}`}
          onToggle={toggleBarber}
        />
      )}

      {view === 'dia' && dayBlocks.length > 0 && (
        <Card title="Bloqueios do dia" description="Períodos sem atendimento. Reservas pelo app não entram aqui.">
          <ul className={styles.blocks}>
            {dayBlocks.map((block) => (
              <li key={block.id} className={styles.block}>
                <span className={styles.blockTime}>
                  {timeOf(block.startsAt)} – {timeOf(block.endsAt)}
                </span>
                <span className={styles.blockWho}>{barberName(block.barberId)}</span>
                <span className={styles.blockReason}>{block.reason ?? 'Sem motivo informado'}</span>
                {manager && (
                  <Button variant="ghost" size="sm" onClick={() => removeBlock(block)}>
                    Remover
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </Card>
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
          <AppointmentCard appointment={selected} config={config} role={role} showBarber={!barberFilter} onStatus={(status) => changeStatus(selected, status)} onNotes={(notes) => saveNotes(selected, notes)} />
        </Dialog>
      )}
      {creating !== null && (
        <NewAppointmentDialog
          key={creating.key}
          installationId={installationId}
          config={config}
          date={creating.date}
          defaultTime={creating.time}
          defaultBarberId={creating.barberId || barberFilter || (config.barbers[0]?.id ?? '')}
          onClose={() => setCreating(null)}
          onCreated={(created) => {
            setCreating(null)
            if (days.includes(created.date)) appointments.mutate((list) => [...list, created].sort((a, b) => a.startsAt.localeCompare(b.startsAt)))
            else setDate(created.date)
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
          defaultBarberId={barberFilter || null}
          onClose={() => setBlocking(null)}
          onCreated={(block) => {
            setBlocking(null)
            blocks.mutate((list) => [...list, block])
            toast({ kind: 'ok', title: 'Período bloqueado' })
          }}
        />
      )}
      {isOwnerRole(role) && config.barbers.length === 0 && (
        <p className={styles.hint}>Sem barbeiros na equipe ainda. Cadastre em Equipe para a agenda funcionar.</p>
      )}
    </div>
  )
}

function timeOf(iso: string) {
  return new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' }).format(new Date(iso))
}
