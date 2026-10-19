import { useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { adminApi, assetUrl, type BarberAgendaState, type TeamBarber, type TenantMember } from '../../api/admin'
import { isManagerRole, isOwnerRole, useTenantRole } from '../../auth/useTenantRole'
import { Badge } from '../../components/Badge/Badge'
import { Card } from '../../components/Card/Card'
import { CredentialsDialog, type Credentials } from '../../components/CredentialsDialog/CredentialsDialog'
import { ErrorState, Loading } from '../../components/Loading/Loading'
import { PageHeader } from '../../components/PageHeader/PageHeader'
import { useToast } from '../../components/Toast/useToast'
import { errorMessage, formatDateTime, todayKey } from '../../lib/format'
import { useResource } from '../../lib/useResource'
import { Button } from '../../ui/Button/Button'
import { Dialog } from '../../ui/Dialog/Dialog'
import { TextField } from '../../ui/TextField/TextField'
import { CalendarIcon, PlusSquareIcon } from '../../ui/icons/Icons'
import { BarberDialog } from './BarberDialog'
import { rememberAgendaTenant } from '../Agenda/last-tenant'
import { TenantPicker } from '../Agenda/TenantPicker'
import styles from './TeamPage.module.css'

/** Equipe da barbearia como operação: agenda de cada um, acesso ao painel, atalho para a grade. */
export function TeamPage() {
  const { installationId = '' } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const role = useTenantRole(installationId)
  const manager = isManagerRole(role)
  const owner = isOwnerRole(role)

  const tenant = useResource(() => adminApi.getTenant(installationId), [installationId])
  const team = useResource(() => adminApi.listTeam(installationId), [installationId])
  const barbers = useResource(() => adminApi.agendaBarbers(installationId), [installationId])
  const members = useResource(() => (manager ? adminApi.listMembers(installationId) : Promise.resolve([] as TenantMember[])), [installationId, manager])
  const today = todayKey()
  const todayAppointments = useResource(() => adminApi.listAppointments(installationId, { from: today, to: today }), [installationId, today])

  const [linking, setLinking] = useState<BarberAgendaState | null>(null)
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState<string | undefined>()
  const [saving, setSaving] = useState(false)
  const [credentials, setCredentials] = useState<Credentials | null>(null)
  const [closing, setClosing] = useState<BarberAgendaState | null>(null)
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [editing, setEditing] = useState<{ key: number; barber: TeamBarber | null } | null>(null)
  const [removing, setRemoving] = useState<TeamBarber | null>(null)

  const config = tenant.data ? (tenant.data.configs.published ?? tenant.data.configs.draft)?.config : undefined

  async function toggle(barber: BarberAgendaState, open: boolean, why?: string) {
    setBusy(true)
    try {
      const result = await adminApi.setBarberAgenda(installationId, barber.id, { open, reason: why })
      barbers.mutate((list) => list.map((item) => (item.id === barber.id ? { ...item, open: result.open, closedReason: result.closedReason } : item)))
      toast({ kind: 'ok', title: open ? `Agenda de ${barber.name} aberta` : `Agenda de ${barber.name} fechada` })
      setClosing(null)
    } catch (caught) {
      toast({ kind: 'erro', title: 'Não foi possível alterar a agenda', detail: errorMessage(caught) })
    } finally {
      setBusy(false)
    }
  }

  async function link(event: FormEvent) {
    event.preventDefault()
    if (!linking) return
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return setError('Informe um e-mail válido.')
    setError(undefined)
    setSaving(true)
    try {
      const result = await adminApi.addMember(installationId, { email: email.trim(), name: name.trim() || linking.name, role: 'BARBEIRO', barberId: linking.id })
      members.mutate((list) => (list.some((m) => m.id === result.id) ? list.map((m) => (m.id === result.id ? { ...m, memberRole: 'BARBEIRO', barberId: linking.id } : m)) : [...list, { ...result, lastLoginAt: null, since: new Date().toISOString() }]))
      setLinking(null)
      setEmail('')
      setName('')
      if (result.created && result.temporaryPassword) setCredentials({ name: result.name, email: result.email, temporaryPassword: result.temporaryPassword })
      else toast({ kind: 'ok', title: 'Acesso vinculado', detail: `${result.name} agora entra no painel como ${linking.name}.` })
    } catch (caught) {
      setError(errorMessage(caught))
    } finally {
      setSaving(false)
    }
  }

  function upsertBarber(saved: TeamBarber) {
    team.mutate((list) => (list.some((item) => item.slug === saved.slug) ? list.map((item) => (item.slug === saved.slug ? saved : item)) : [...list, saved]))
    barbers.reload()
  }

  async function setActive(barber: TeamBarber, active: boolean) {
    setBusy(true)
    try {
      upsertBarber(await adminApi.updateBarber(installationId, barber.slug, { active }))
      toast({ kind: 'ok', title: active ? `${barber.name} de volta à equipe` : `${barber.name} afastado`, detail: active ? 'Já aparece no app.' : 'Saiu do app e não recebe reservas. O histórico fica.' })
    } catch (caught) {
      toast({ kind: 'erro', title: 'Não foi possível alterar', detail: errorMessage(caught) })
    } finally {
      setBusy(false)
    }
  }

  async function move(barber: TeamBarber, delta: number) {
    const list = team.data ?? []
    const index = list.findIndex((item) => item.slug === barber.slug)
    const target = index + delta
    if (index < 0 || target < 0 || target >= list.length) return
    const order = list.map((item) => item.slug)
    ;[order[index], order[target]] = [order[target], order[index]]
    try {
      team.mutate(await adminApi.reorderTeam(installationId, order))
    } catch (caught) {
      toast({ kind: 'erro', title: 'Não foi possível reordenar', detail: errorMessage(caught) })
    }
  }

  async function remove(barber: TeamBarber) {
    setBusy(true)
    try {
      await adminApi.removeBarber(installationId, barber.slug)
      team.mutate((list) => list.filter((item) => item.slug !== barber.slug))
      barbers.reload()
      toast({ kind: 'ok', title: `${barber.name} removido da equipe` })
      setRemoving(null)
    } catch (caught) {
      toast({ kind: 'erro', title: 'Não foi possível remover', detail: errorMessage(caught) })
      setRemoving(null)
    } finally {
      setBusy(false)
    }
  }

  if (tenant.error && !tenant.data) return <ErrorState message={tenant.error} onRetry={tenant.reload} />
  if (!tenant.data || !barbers.data || !team.data) return <Loading label="Carregando equipe…" />
  if (!config) return <ErrorState message="Esta barbearia ainda não tem configuração." />
  rememberAgendaTenant(installationId)

  const accessFor = (barberId: string) => (members.data ?? []).filter((member) => member.memberRole === 'BARBEIRO' && member.barberId === barberId)

  return (
    <div className={styles.page}>
      <PageHeader
        title="Equipe"
        description="Cadastro da equipe, agenda de cada um e acesso ao painel. Mudanças aqui valem no app na hora."
        actions={
          <>
            <TenantPicker current={installationId} onChange={(id) => navigate(`/equipe/${id}`)} />
            {manager && (
              <Button size="sm" onClick={() => setEditing({ key: Date.now(), barber: null })}>
                <PlusSquareIcon />
                Adicionar barbeiro
              </Button>
            )}
          </>
        }
      />

      {team.data.length === 0 && (
        <Card>
          <p className={styles.muted}>Nenhum barbeiro na equipe ainda. {manager ? 'Adicione o primeiro: ele aparece no app na hora.' : 'Peça ao dono ou gestor para cadastrar.'}</p>
        </Card>
      )}

      <ul className={styles.grid}>
        {team.data.map((member, index) => {
          const state = barbers.data?.find((item) => item.id === member.slug)
          const count = (todayAppointments.data ?? []).filter((item) => item.barberId === member.slug && item.status !== 'CANCELADO').length
          const access = accessFor(member.slug)
          const barber: BarberAgendaState = state ?? { id: member.slug, name: member.name, image: member.image, open: true, closedReason: null }
          return (
            <li key={member.slug} className={[styles.card, (!member.active || !barber.open) && styles.cardClosed].filter(Boolean).join(' ')}>
              <div className={styles.head}>
                {member.image ? <img src={assetUrl(member.image)} alt="" className={styles.avatar} /> : <span className={styles.avatarFallback}>{member.name.slice(0, 1)}</span>}
                <div className={styles.identity}>
                  <span className={styles.name}>
                    {member.name}
                    {member.tier && <span className={styles.tier}>{member.tier}</span>}
                  </span>
                  <span className={styles.specialties}>{member.specialties.join(' · ') || 'Sem especialidades'}</span>
                </div>
                {!member.active ? <Badge tone="neutral">Afastado</Badge> : barber.open ? <Badge tone="ok">Aberta</Badge> : <Badge tone="danger">{barber.closedReason ? `Fechada · ${barber.closedReason}` : 'Fechada'}</Badge>}
              </div>

              <dl className={styles.stats}>
                <div>
                  <dt>Hoje</dt>
                  <dd>{count === 0 ? 'Livre' : `${count} ${count === 1 ? 'atendimento' : 'atendimentos'}`}</dd>
                </div>
                <div>
                  <dt>Nota no app</dt>
                  <dd>{`${member.rating.toFixed(1).replace('.', ',')} · ${member.reviews} avaliações`}</dd>
                </div>
                {manager && (
                  <div>
                    <dt>Acesso ao painel</dt>
                    <dd>
                      {access.length === 0
                        ? 'Sem acesso'
                        : access.map((member) => `${member.email}${member.lastLoginAt ? ` (entrou ${formatDateTime(member.lastLoginAt)})` : ' (nunca entrou)'}`).join(', ')}
                    </dd>
                  </div>
                )}
              </dl>

              <div className={styles.actions}>
                {member.active && (
                  <Button size="sm" to={`/agenda/${installationId}/${member.slug}`}>
                    <CalendarIcon />
                    Ver agenda
                  </Button>
                )}
                {manager && member.active &&
                  (barber.open ? (
                    <Button size="sm" variant="ghost" onClick={() => { setReason(''); setClosing(barber) }}>
                      Fechar agenda
                    </Button>
                  ) : (
                    <Button size="sm" variant="ghost" loading={busy} onClick={() => toggle(barber, true)}>
                      Abrir agenda
                    </Button>
                  ))}
                {owner && member.active && access.length === 0 && (
                  <Button size="sm" variant="ghost" onClick={() => { setEmail(''); setName(member.name); setError(undefined); setLinking(barber) }}>
                    Dar acesso ao painel
                  </Button>
                )}
              </div>
              {manager && (
                <div className={styles.manage}>
                  <Button size="sm" variant="ghost" onClick={() => setEditing({ key: Date.now(), barber: member })}>
                    Editar
                  </Button>
                  <Button size="sm" variant="ghost" disabled={busy} onClick={() => setActive(member, !member.active)}>
                    {member.active ? 'Afastar' : 'Reativar'}
                  </Button>
                  <Button size="sm" variant="ghost" className={styles.dangerButton} disabled={busy} onClick={() => setRemoving(member)}>
                    Remover
                  </Button>
                  <span className={styles.order}>
                    <button type="button" className={styles.orderButton} onClick={() => move(member, -1)} disabled={index === 0} aria-label={`Subir ${member.name}`}>
                      ↑
                    </button>
                    <button type="button" className={styles.orderButton} onClick={() => move(member, 1)} disabled={index === team.data!.length - 1} aria-label={`Descer ${member.name}`}>
                      ↓
                    </button>
                  </span>
                </div>
              )}
            </li>
          )
        })}
      </ul>

      <Dialog
        open={linking !== null}
        onClose={() => setLinking(null)}
        title={linking ? `Acesso ao painel para ${linking.name}` : ''}
        actions={
          <>
            <Button variant="ghost" onClick={() => setLinking(null)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={(event) => link(event as unknown as FormEvent)} loading={saving}>
              Criar acesso
            </Button>
          </>
        }
      >
        <form className={styles.form} onSubmit={link} noValidate>
          <p className={styles.muted}>A pessoa entra no painel e vê só a própria agenda: confirma, marca presença ou falta. Se o e-mail ainda não tiver acesso, criamos com senha temporária.</p>
          <TextField label="E-mail" type="email" value={email} onChange={(value) => { setEmail(value); setError(undefined) }} error={error} placeholder="barbeiro@exemplo.com" autoFocus />
          <TextField label="Nome" value={name} onChange={setName} />
        </form>
      </Dialog>

      <Dialog
        open={closing !== null}
        onClose={() => setClosing(null)}
        title={closing ? `Fechar a agenda de ${closing.name}?` : ''}
        actions={
          <>
            <Button variant="ghost" onClick={() => setClosing(null)} disabled={busy}>
              Voltar
            </Button>
            <Button variant="danger" loading={busy} onClick={() => closing && toggle(closing, false, reason.trim() || undefined)}>
              Fechar agenda
            </Button>
          </>
        }
      >
        <div className={styles.form}>
          <p className={styles.muted}>Ninguém consegue marcar com este barbeiro até você abrir de novo. Atendimentos já marcados continuam.</p>
          <TextField label="Motivo (opcional)" value={reason} onChange={setReason} placeholder="Férias, curso, folga…" hint="Aparece para o cliente no app." />
        </div>
      </Dialog>

      {editing && (
        <BarberDialog
          key={editing.key}
          installationId={installationId}
          barber={editing.barber}
          taken={team.data.map((item) => item.slug)}
          onClose={() => setEditing(null)}
          onSaved={(saved) => {
            upsertBarber(saved)
            setEditing(null)
            toast({ kind: 'ok', title: editing.barber ? 'Barbeiro atualizado' : `${saved.name} entrou na equipe`, detail: 'Já vale no app.' })
          }}
        />
      )}

      <Dialog
        open={removing !== null}
        onClose={() => setRemoving(null)}
        title={removing ? `Remover ${removing.name} da equipe?` : ''}
        actions={
          <>
            <Button variant="ghost" onClick={() => setRemoving(null)} disabled={busy}>
              Cancelar
            </Button>
            <Button variant="danger" loading={busy} onClick={() => removing && remove(removing)}>
              Remover
            </Button>
          </>
        }
      >
        <p className={styles.muted}>Remove de vez. Se a pessoa tem atendimentos registrados ou acesso ao painel, prefira "Afastar": some do app e o histórico fica.</p>
      </Dialog>

      <CredentialsDialog credentials={credentials} onClose={() => setCredentials(null)} context="Acesso de barbeiro criado" />
    </div>
  )
}
