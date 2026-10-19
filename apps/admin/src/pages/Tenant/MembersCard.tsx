import { useState, type FormEvent } from 'react'
import { adminApi, type MemberRole, type TenantDetail, type TenantMember } from '../../api/admin'
import { Select } from '../../ui/Select/Select'
import { ApiError } from '../../api/client'
import { useAuth } from '../../auth/useAuth'
import { isOwnerRole, useTenantRole } from '../../auth/useTenantRole'
import { Badge } from '../../components/Badge/Badge'
import { Card } from '../../components/Card/Card'
import { CredentialsDialog, type Credentials } from '../../components/CredentialsDialog/CredentialsDialog'
import { Loading } from '../../components/Loading/Loading'
import { useToast } from '../../components/Toast/useToast'
import { errorMessage, formatDateTime, memberRoleLabel } from '../../lib/format'
import { useResource } from '../../lib/useResource'
import { Button } from '../../ui/Button/Button'
import { Link } from 'react-router-dom'
import { Dialog } from '../../ui/Dialog/Dialog'
import { TextField } from '../../ui/TextField/TextField'
import { TrashIcon } from '../../ui/icons/Icons'
import styles from './MembersCard.module.css'

export function MembersCard({ tenant }: { tenant: TenantDetail }) {
  const { admin } = useAuth()
  const canManage = isOwnerRole(useTenantRole(tenant.id))
  const toast = useToast()
  const members = useResource(() => adminApi.listMembers(tenant.id), [tenant.id])
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [role, setRole] = useState<MemberRole>('DONO')
  const [barberId, setBarberId] = useState('')
  const barbers = (tenant.configs.published ?? tenant.configs.draft)?.config.barbers ?? []
  const [error, setError] = useState<string | undefined>()
  const [adding, setAdding] = useState(false)
  const [credentials, setCredentials] = useState<Credentials | null>(null)
  const [removing, setRemoving] = useState<TenantMember | null>(null)
  const [busy, setBusy] = useState(false)

  async function add(event: FormEvent) {
    event.preventDefault()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return setError('Informe um e-mail válido.')
    setError(undefined)
    setAdding(true)
    try {
      if (role === 'BARBEIRO' && !barberId) return setError('Escolha qual barbeiro da equipe essa pessoa é.')
      const result = await adminApi.addMember(tenant.id, { email: email.trim(), name: name.trim() || undefined, role, barberId: role === 'BARBEIRO' ? barberId : null })
      members.mutate((list) => (list.some((m) => m.id === result.id) ? list.map((m) => (m.id === result.id ? { ...m, memberRole: result.memberRole, barberId: result.barberId } : m)) : [...list, { ...result, lastLoginAt: null, since: new Date().toISOString() }]))
      setEmail('')
      setName('')
      if (result.created && result.temporaryPassword) setCredentials({ name: result.name, email: result.email, temporaryPassword: result.temporaryPassword })
      else toast({ kind: 'ok', title: 'Acesso vinculado', detail: `${result.name} agora é ${memberRoleLabel[result.memberRole].toLowerCase()} desta barbearia.` })
    } catch (caught) {
      if (caught instanceof ApiError && caught.issues.length) setError(caught.issues[0]?.message)
      else toast({ kind: 'erro', title: 'Não foi possível vincular', detail: errorMessage(caught) })
    } finally {
      setAdding(false)
    }
  }

  async function remove(member: TenantMember) {
    setBusy(true)
    try {
      await adminApi.removeMember(tenant.id, member.id)
      members.mutate((list) => list.filter((m) => m.id !== member.id))
      toast({ kind: 'ok', title: 'Acesso removido' })
      setRemoving(null)
    } catch (caught) {
      toast({ kind: 'erro', title: 'Não foi possível remover', detail: errorMessage(caught) })
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <Card
        title="Acessos"
        description={canManage ? 'Dono controla tudo. Gestor monta e opera, sem mexer em acessos e domínios. Barbeiro vê só a própria agenda.' : 'Quem tem acesso a esta barbearia no painel.'}
        actions={canManage ? <Link to={`/acessos/${tenant.id}`} className={styles.manageLink}>Gerenciar acessos</Link> : undefined}
      >
        {members.loading && !members.data && <Loading label="Carregando…" />}
        {members.data && (
          <ul className={styles.list}>
            {members.data.length === 0 && <li className={styles.empty}>Nenhum acesso vinculado. Só a plataforma enxerga esta barbearia.</li>}
            {members.data.map((member) => (
              <li key={member.id} className={styles.item}>
                <div className={styles.who}>
                  <span className={styles.name}>
                    {member.name}
                    {member.id === admin?.id && <span className={styles.you}>você</span>}
                  </span>
                  <span className={styles.meta}>
                    {member.email}
                    {member.memberRole === 'BARBEIRO' && member.barberId ? ` · ${barbers.find((barber) => barber.id === member.barberId)?.name ?? member.barberId}` : ''} · {member.lastLoginAt ? `último acesso ${formatDateTime(member.lastLoginAt)}` : 'nunca entrou'}
                  </span>
                </div>
                <div className={styles.side}>
                  <Badge tone={member.status !== 'ATIVO' ? 'danger' : member.memberRole === 'DONO' ? 'ok' : 'neutral'}>
                    {member.status === 'ATIVO' ? memberRoleLabel[member.memberRole] : 'Suspenso'}
                  </Badge>
                  {canManage && (
                    <Button size="sm" variant="ghost" disabled={busy} onClick={() => setRemoving(member)} aria-label={`Remover acesso de ${member.name}`}>
                      <TrashIcon />
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}

        {canManage && (
          <form className={styles.form} onSubmit={add} noValidate>
            <div className={styles.formRow}>
              <TextField
                label="Vincular acesso"
                type="email"
                value={email}
                onChange={(value) => {
                  setEmail(value)
                  setError(undefined)
                }}
                error={error}
                placeholder="dono@barbearia.com.br"
                hint="Se a pessoa ainda não tiver acesso, criamos com senha temporária."
                className={styles.grow}
              />
              <TextField label="Nome (se for novo)" value={name} onChange={setName} placeholder="Zé da Navalha" className={styles.grow} />
            </div>
            <div className={styles.formRow}>
              <Select<MemberRole>
                label="Papel"
                value={role}
                onChange={setRole}
                options={[
                  { value: 'DONO', label: 'Dono: controla tudo' },
                  { value: 'GESTOR', label: 'Gestor: opera a agenda' },
                  { value: 'BARBEIRO', label: 'Barbeiro: só a própria agenda' },
                ]}
                className={styles.grow}
              />
              {role === 'BARBEIRO' && (
                <Select<string>
                  label="Qual barbeiro"
                  value={barberId}
                  onChange={setBarberId}
                  options={[{ value: '', label: 'Escolha na equipe' }, ...barbers.map((barber) => ({ value: barber.id, label: barber.name }))]}
                  className={styles.grow}
                />
              )}
              <Button type="submit" loading={adding} disabled={!email.trim()} className={styles.addButton}>
                Vincular
              </Button>
            </div>
          </form>
        )}
      </Card>

      <CredentialsDialog credentials={credentials} onClose={() => setCredentials(null)} context={`Dono vinculado a ${tenant.name}`} />

      <Dialog
        open={removing !== null}
        onClose={() => setRemoving(null)}
        title="Remover acesso?"
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
        <p className={styles.dialogText}>
          <strong>{removing?.name}</strong> deixa de ver e editar esta barbearia. A conta continua existindo e os outros vínculos ficam.
        </p>
      </Dialog>
    </>
  )
}
