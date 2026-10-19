import { useEffect } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { adminApi, assetUrl, publicUrl } from '../../api/admin'
import { isOwnerRole, useTenantRole } from '../../auth/useTenantRole'
import { Badge } from '../../components/Badge/Badge'
import { Card } from '../../components/Card/Card'
import { ErrorState, Loading } from '../../components/Loading/Loading'
import { PageHeader } from '../../components/PageHeader/PageHeader'
import { appointmentStatusLabel, formatDate, formatDayLabel, formatPrice } from '../../lib/format'
import { useResource } from '../../lib/useResource'
import { Avatar } from '../../ui/Avatar/Avatar'
import { Button } from '../../ui/Button/Button'
import { ShareIcon } from '../../ui/icons/Icons'
import { rememberAgendaTenant } from '../Agenda/last-tenant'
import styles from './BarbershopHome.module.css'

function delta(current: number, previous: number) {
  if (previous === 0) return current > 0 ? 'primeiro mês com receita' : 'sem receita no mês anterior'
  const change = Math.round(((current - previous) / previous) * 100)
  return `${change >= 0 ? '+' : ''}${change}% em relação ao mês anterior`
}

/**
 * Início da barbearia: o dia, a receita dela com os clientes, próximos
 * atendimentos, equipe e publicação. Dono e gestor; barbeiro vai para a agenda.
 */
export function BarbershopHome() {
  const { installationId = '' } = useParams()
  const role = useTenantRole(installationId)
  const tenant = useResource(() => adminApi.getTenant(installationId), [installationId])
  const overview = useResource(() => adminApi.tenantOverview(installationId), [installationId])

  useEffect(() => {
    rememberAgendaTenant(installationId)
  }, [installationId])

  if (role === 'BARBEIRO') return <Navigate to={`/agenda/${installationId}`} replace />
  const data = overview.data
  const owner = isOwnerRole(role)

  return (
    <>
      <PageHeader
        title={tenant.data?.name ?? 'Início'}
        description={data ? `${formatDayLabel(data.date)}. Como está a barbearia hoje.` : 'Como está a barbearia hoje.'}
        actions={
          <>
            {tenant.data && (
              <Button size="sm" variant="ghost" onClick={() => window.open(publicUrl(tenant.data!), '_blank', 'noopener')}>
                <ShareIcon />
                Abrir app
              </Button>
            )}
            <Button size="sm" to={`/agenda/${installationId}`}>
              Agenda de hoje
            </Button>
          </>
        }
      />

      {overview.loading && !data && <Loading label="Carregando a barbearia…" />}
      {overview.error && !data && <ErrorState message={overview.error} onRetry={overview.reload} />}


      {data && !data.publication.publishedVersion && (
        <div className={styles.setup}>
          <span>
            <strong>O app ainda não está no ar.</strong> Termine o passo a passo (dados, marca, serviços, equipe e horários) e publique.
          </span>
          <Button size="sm" to={`/comecar/${installationId}/2`}>
            Continuar o passo a passo
          </Button>
        </div>
      )}


      {data && (
        <div className={styles.grid}>
          <Card title="Hoje" description="Atendimentos do dia, sem os cancelados." actions={<Link to={`/agenda/${installationId}`} className={styles.link}>Ver agenda</Link>}>
            <dl className={styles.kpis}>
              <div>
                <dt>Atendimentos</dt>
                <dd>{data.today.total - data.today.cancelados}</dd>
              </div>
              <div>
                <dt>A atender</dt>
                <dd>{data.today.confirmados}</dd>
              </div>
              <div>
                <dt>Atendidos</dt>
                <dd>{data.today.concluidos}</dd>
                <span>{data.today.faltas} {data.today.faltas === 1 ? 'falta' : 'faltas'}</span>
              </div>
              <div>
                <dt>Previsto hoje</dt>
                <dd>{formatPrice(data.today.expected)}</dd>
                <span>o que os clientes pagam no dia</span>
              </div>
            </dl>
          </Card>

          <Card title="Receita da barbearia" description="Soma dos atendimentos concluídos com os clientes. Não tem nada a ver com a mensalidade da plataforma.">
            <dl className={styles.kpis}>
              <div>
                <dt>Este mês</dt>
                <dd>{formatPrice(data.revenue.month)}</dd>
                <span>
                  {data.revenue.monthCount} {data.revenue.monthCount === 1 ? 'atendimento' : 'atendimentos'} · {delta(data.revenue.month, data.revenue.previousMonth)}
                </span>
              </div>
              <div>
                <dt>Mês anterior</dt>
                <dd>{formatPrice(data.revenue.previousMonth)}</dd>
                <span>{data.revenue.previousCount} atendimentos</span>
              </div>
              <div>
                <dt>Clientes</dt>
                <dd>{data.customers.total}</dd>
                <span>{data.customers.newThisMonth} novos este mês</span>
              </div>
            </dl>
          </Card>

          <Card
            title="Próximos atendimentos"
            description="Os próximos da fila, de toda a equipe."
            actions={<Link to={`/agenda/${installationId}`} className={styles.link}>Abrir agenda</Link>}
          >
            {data.upcoming.length === 0 ? (
              <p className={styles.muted}>Nada marcado daqui para a frente. Divulgue o app: os clientes agendam sozinhos.</p>
            ) : (
              <ul className={styles.list}>
                {data.upcoming.map((item) => (
                  <li key={item.id}>
                    <Link to={`/agenda/${installationId}/${item.barberId}?dia=${item.date}`} className={styles.row}>
                      <span className={styles.when}>
                        <strong>{item.time}</strong>
                        <span>{formatDate(item.date)}</span>
                      </span>
                      <span className={styles.rowMain}>
                        <strong>{item.customerName}</strong>
                        <span className={styles.muted}>
                          {item.barberName} · {item.services.join(', ')} · {formatPrice(item.total)}
                        </span>
                      </span>
                      <Badge tone={item.status === 'CONFIRMADO' ? 'ok' : 'neutral'}>{appointmentStatusLabel[item.status]}</Badge>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card
            title="Equipe hoje"
            description="Quem está com a agenda aberta e quantos atendimentos cada um tem hoje."
            actions={
              <span className={styles.links}>
                <Link to={`/equipe/${installationId}`} className={styles.link}>Equipe</Link>
                {owner && <Link to={`/acessos/${installationId}`} className={styles.link}>Acessos</Link>}
              </span>
            }
          >
            {data.barbers.length === 0 ? (
              <p className={styles.muted}>Nenhum barbeiro ativo. Cadastre a equipe para o app abrir a agenda.</p>
            ) : (
              <ul className={styles.list}>
                {data.barbers.map((barber) => (
                  <li key={barber.id}>
                    <Link to={`/agenda/${installationId}/${barber.id}`} className={styles.row}>
                      <Avatar name={barber.name} src={assetUrl(barber.image || undefined)} size={36} />
                      <span className={styles.rowMain}>
                        <strong>{barber.name}</strong>
                        <span className={styles.muted}>
                          {barber.today} {barber.today === 1 ? 'atendimento hoje' : 'atendimentos hoje'}
                          {barber.closedReason ? ` · ${barber.closedReason}` : ''}
                        </span>
                      </span>
                      <Badge tone={barber.open ? 'ok' : 'warn'}>{barber.open ? 'Aberta' : 'Fechada'}</Badge>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card
            title="Publicação do app"
            description="O que os clientes veem é a versão publicada."
            actions={<Link to={`/barbearias/${installationId}`} className={styles.link}>Montar app</Link>}
          >
            <div className={styles.publication}>
              <span className={styles.rowMain}>
                <strong>{data.publication.publishedVersion ? `Versão ${data.publication.publishedVersion} no ar` : 'Ainda não publicado'}</strong>
                <span className={styles.muted}>{data.publication.publishedAt ? `publicada em ${formatDate(data.publication.publishedAt)}` : 'Monte marca, serviços e horários e publique.'}</span>
              </span>
              {data.publication.hasDraft ? (
                <Button size="sm" to={`/barbearias/${installationId}/marca`}>
                  Rascunho pendente · publicar
                </Button>
              ) : (
                <Badge tone="ok">Em dia</Badge>
              )}
            </div>
          </Card>

        </div>
      )}
    </>
  )
}
