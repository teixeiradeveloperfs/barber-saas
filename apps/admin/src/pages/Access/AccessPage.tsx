import { useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { adminApi, type MemberRole, type TenantMember } from '../../api/admin'
import { ApiError } from '../../api/client'
import { useAuth } from '../../auth/useAuth'
import { isOwnerRole, useTenantRole } from '../../auth/useTenantRole'
import { Badge } from '../../components/Badge/Badge'
import { Card } from '../../components/Card/Card'
import { CredentialsDialog, type Credentials } from '../../components/CredentialsDialog/CredentialsDialog'
import { ErrorState, Loading } from '../../components/Loading/Loading'
import { PageHeader } from '../../components/PageHeader/PageHeader'
import { useToast } from '../../components/Toast/useToast'
import { errorMessage, formatDateTime, memberRoleLabel } from '../../lib/format'
import { useResource } from '../../lib/useResource'
import { Button } from '../../ui/Button/Button'
import { Dialog } from '../../ui/Dialog/Dialog'
import { Select } from '../../ui/Select/Select'
import { TextField } from '../../ui/TextField/TextField'
import { PlusSquareIcon } from '../../ui/icons/Icons'
import { TenantPicker } from '../Agenda/TenantPicker'
import styles from './AccessPage.module.css'

type Action = { kind: 'add' } | { kind: 'edit'; member: TenantMember } | { kind: 'reset'; member: TenantMember } | { kind: 'remove'; member: TenantMember } | null

const ROLE_OPTIONS: { value: MemberRole; label: string }[] = [
  { value: 'DONO', label: 'Dono · tudo, inclusive acessos e domínios' },
  { value: 'GESTOR', label: 'Gestor · monta o app, agenda e equipe' },
  { value: 'BARBEIRO', label: 'Barbeiro · só a própria agenda' },
]

/** Quem entra no painel desta barbearia e com que papel. Só o dono. */
export function AccessPage() {
  const { installationId = '' } = useParams()
  const navigate = useNavigate()
  const { admin } = useAuth()
  const role = useTenantRole(installationId)
  const toast = useToast()
  const tenant = useResource(() => adminApi.getTenant(installationId), [installationId])
  const members = useResource(() => adminApi.listMembers(installationId), [installationId])
  const [action, setAction] = useState<Action>(null)
  const [form, setForm] = useState({ email: '', name: '', role: 'GESTOR' as MemberRole, barberId: '' })
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [credentials, setCredentials] = useState<Credentials | null>(null)

  if (!isOwnerRole(role)) return <Navigate to={`/inicio/${installationId}`} replace />
  const barbers = (tenant.data?.configs.published ?? tenant.data?.configs.draft)?.config.barbers ?? []
  const barberName = (id: string | null) => (id ? barbers.find((barber) => barber.id === id)?.name ?? id : '')

  function open(next: NonNullable<Action>) {
    setError(null)
    if (next.kind === 'add') setForm({ email: '', name: '', role: 'GESTOR', barberId: '' })
    if (next.kind === 'edit') setForm({ email: next.member.email, name: next.member.name, role: next.member.memberRole, barberId: next.member.barberId ?? '' })
    setAction(next)
  }

  function upsert(member: TenantMember) {
    members.mutate((list) => (list.some((item) => item.id === member.id) ? list.map((item) => (item.id === member.id ? member : item)) : [...list, member]))
  }

  async function run() {
    if (!action) return
    setBusy(true)
    setError(null)
    try {
      if (action.kind === 'add') {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) throw new Error('Informe um e-mail válido.')
        if (form.role === 'BARBEIRO' && !form.barberId) throw new Error('Escolha qual barbeiro da equipe essa pessoa é.')
        const result = await adminApi.addMember(installationId, { email: form.email.trim(), name: form.name.trim() || undefined, role: form.role, barberId: form.role === 'BARBEIRO' ? form.barberId : null })
        upsert({ ...result, lastLoginAt: null, since: new Date().toISOString() })
        setAction(null)
        if (result.created && result.temporaryPassword) setCredentials({ name: result.name, email: result.email, temporaryPassword: result.temporaryPassword })
        else toast({ kind: 'ok', title: 'Acesso vinculado', detail: `${result.name} agora é ${memberRoleLabel[result.memberRole].toLowerCase()} desta barbearia.` })
      } else if (action.kind === 'edit') {
        if (form.role === 'BARBEIRO' && !form.barberId) throw new Error('Escolha qual barbeiro da equipe essa pessoa é.')
        const updated = await adminApi.updateMember(installationId, action.member.id, { role: form.role, barberId: form.role === 'BARBEIRO' ? form.barberId : null })
        upsert(updated)
        setAction(null)
        toast({ kind: 'ok', title: 'Acesso atualizado', detail: `${updated.name} agora é ${memberRoleLabel[updated.memberRole].toLowerCase()}.` })
      } else if (action.kind === 'reset') {
        const result = await adminApi.resetMemberPassword(installationId, action.member.id)
        setAction(null)
        setCredentials({ name: action.member.name, email: action.member.email, temporaryPassword: result.temporaryPassword })
      } else {
        await adminApi.removeMember(installationId, action.member.id)
        members.mutate((list) => list.filter((item) => item.id !== action.member.id))
        setAction(null)
        toast({ kind: 'ok', title: 'Acesso removido', detail: `${action.member.name} não entra mais nesta barbearia.` })
      }
    } catch (caught) {
      setError(caught instanceof ApiError && caught.issues[0] ? caught.issues[0].message : errorMessage(caught))
    } finally {
      setBusy(false)
    }
  }

  const dialogTitle = action?.kind === 'add' ? 'Adicionar acesso' : action?.kind === 'edit' ? `Editar acesso de ${action.member.name}` : action?.kind === 'reset' ? 'Redefinir senha?' : action?.kind === 'remove' ? 'Remover acesso?' : ''

  return (
    <>
      <PageHeader
        title="Acessos"
        description="Quem entra no painel desta barbearia e o que cada um pode fazer."
        actions={
          <>
            <TenantPicker current={installationId} onChange={(id) => navigate(`/acessos/${id}`)} />
            <Button size="sm" onClick={() => open({ kind: 'add' })}>
              <PlusSquareIcon />
              Adicionar acesso
            </Button>
          </>
        }
      />

      <Card
        title={tenant.data ? `Quem entra em ${tenant.data.name}` : 'Quem entra'}
        description="Dono controla tudo, inclusive acessos e domínios. Gestor monta o app, publica, cuida da agenda e da equipe. Barbeiro vê só a própria agenda e marca presença."
      >
        {members.loading && !members.data && <Loading label="Carregando acessos…" />}
        {members.error && !members.data && <ErrorState message={members.error} onRetry={members.reload} />}
        {members.data && (
          <ul className={styles.list}>
            {members.data.length === 0 && <li className={styles.empty}>Nenhum acesso ainda. Adicione o gestor ou os barbeiros pelo e-mail deles.</li>}
            {members.data.map((member) => {
              const self = member.id === admin?.id
              return (
                <li key={member.id} className={styles.item} data-testid="access-row">
                  <div className={styles.who}>
                    <span className={styles.name}>
                      {member.name}
                      {self && <span className={styles.you}>você</span>}
                    </span>
                    <span className={styles.meta}>
                      {member.email}
                      {member.memberRole === 'BARBEIRO' && member.barberId ? ` · ${barberName(member.barberId)}` : ''} · {member.lastLoginAt ? `último acesso ${formatDateTime(member.lastLoginAt)}` : 'nunca entrou'}
                    </span>
                  </div>
                  <Badge tone={member.status !== 'ATIVO' ? 'danger' : member.memberRole === 'DONO' ? 'ok' : member.memberRole === 'GESTOR' ? 'accent' : 'neutral'}>
                    {member.status === 'ATIVO' ? memberRoleLabel[member.memberRole] : 'Suspenso'}
                  </Badge>
                  <div className={styles.actions}>
                    <button type="button" className={styles.textButton} onClick={() => open({ kind: 'edit', member })} disabled={self} title={self ? 'Peça a outro dono para mudar o seu papel.' : undefined}>
                      Editar
                    </button>
                    <button type="button" className={styles.textButton} onClick={() => open({ kind: 'reset', member })}>
                      Redefinir senha
                    </button>
                    <button type="button" className={`${styles.textButton} ${styles.danger}`} onClick={() => open({ kind: 'remove', member })} disabled={self} title={self ? 'Você não remove o próprio acesso.' : undefined}>
                      Remover
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </Card>

      {action && (
        <Dialog
          open
          onClose={() => setAction(null)}
          title={dialogTitle}
          actions={
            <>
              <Button variant="ghost" onClick={() => setAction(null)} disabled={busy}>
                Cancelar
              </Button>
              <Button variant={action.kind === 'remove' ? 'danger' : 'primary'} onClick={run} loading={busy}>
                {action.kind === 'add' ? 'Adicionar' : action.kind === 'edit' ? 'Salvar' : action.kind === 'reset' ? 'Gerar nova senha' : 'Remover'}
              </Button>
            </>
          }
        >
          <div className={styles.form}>
            {action.kind === 'add' && (
              <>
                <TextField label="E-mail" type="email" value={form.email} onChange={(email) => setForm({ ...form, email })} placeholder="gestor@barbearia.com.br" autoFocus autoCapitalize="off" hint="Se a pessoa ainda não tem conta, criamos uma com senha temporária." />
                <TextField label="Nome (se for conta nova)" value={form.name} onChange={(name) => setForm({ ...form, name })} placeholder="Como aparece no painel" />
              </>
            )}
            {(action.kind === 'add' || action.kind === 'edit') && (
              <>
                <Select<MemberRole> label="Papel" value={form.role} onChange={(role) => setForm({ ...form, role })} options={ROLE_OPTIONS} />
                {form.role === 'BARBEIRO' && (
                  <Select<string>
                    label="Qual barbeiro da equipe"
                    value={form.barberId}
                    onChange={(barberId) => setForm({ ...form, barberId })}
                    options={[{ value: '', label: 'Escolha…' }, ...barbers.map((barber) => ({ value: barber.id, label: barber.name }))]}
                    hint="Ele só vê e confirma a própria agenda."
                  />
                )}
              </>
            )}
            {action.kind === 'reset' && (
              <p>
                <strong>{action.member.name}</strong> recebe uma senha temporária, mostrada uma única vez para você repassar. No primeiro login, troca.
              </p>
            )}
            {action.kind === 'remove' && (
              <p>
                <strong>{action.member.name}</strong> deixa de entrar nesta barbearia. A conta continua existindo; se estiver em outras barbearias, segue lá.
              </p>
            )}
            {error && (
              <p className={styles.error} role="alert">
                {error}
              </p>
            )}
          </div>
        </Dialog>
      )}

      <CredentialsDialog credentials={credentials} onClose={() => setCredentials(null)} />
    </>
  )
}
