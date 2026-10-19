import { useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { adminApi } from '../../api/admin'
import { isOwnerRole, useTenantRole } from '../../auth/useTenantRole'
import { Badge } from '../../components/Badge/Badge'
import { Card } from '../../components/Card/Card'
import { ErrorState, Loading } from '../../components/Loading/Loading'
import { PageHeader } from '../../components/PageHeader/PageHeader'
import { formatDateTime, formatPhone } from '../../lib/format'
import { useResource } from '../../lib/useResource'
import { Button } from '../../ui/Button/Button'
import { rememberAgendaTenant } from '../Agenda/last-tenant'
import { TenantPicker } from '../Agenda/TenantPicker'
import { ConnectionCard } from './ConnectionCard'
import { TemplateCard } from './TemplateCard'
import { EVENT_INFO, MESSAGE_STATUS } from './whatsapp'
import styles from './WhatsAppPage.module.css'

/**
 * WhatsApp da barbearia: conectar o número (dono), avisos automáticos com
 * texto editável (dono e gestor) e o histórico do que saiu.
 */
export function WhatsAppPage() {
  const { installationId = '' } = useParams()
  const navigate = useNavigate()
  const owner = isOwnerRole(useTenantRole(installationId))
  const connection = useResource(() => adminApi.whatsapp(installationId), [installationId])
  const templates = useResource(() => adminApi.whatsappTemplates(installationId), [installationId])
  const messages = useResource(() => adminApi.whatsappMessages(installationId), [installationId])
  const reloadConnection = connection.reload
  const refresh = useCallback(() => reloadConnection(), [reloadConnection])

  if (connection.error && !connection.data) return <ErrorState message={connection.error} onRetry={connection.reload} />
  if (!connection.data || !templates.data) return <Loading label="Carregando WhatsApp…" />
  rememberAgendaTenant(installationId)

  const live = connection.data.status === 'CONECTADO'

  return (
    <div className={styles.page}>
      <PageHeader
        title="WhatsApp"
        description="Avisos automáticos no WhatsApp de cada cliente: lembrete com confirmação de ida e cancelamento. Reserva feita não gera mensagem: poupa o número."
        actions={<TenantPicker current={installationId} onChange={(id) => navigate(`/whatsapp/${id}`)} />}
      />

      <div className={styles.layout}>
        <div className={styles.side}>
          <ConnectionCard installationId={installationId} connection={connection.data} owner={owner} onChange={(next) => connection.mutate(() => next)} onReload={refresh} />

          <Card
            title="Últimas mensagens"
            actions={
              <Button size="sm" variant="ghost" onClick={messages.reload}>
                Atualizar
              </Button>
            }
            flush
          >
            {(messages.data ?? []).length === 0 ? (
              <p className={[styles.muted, styles.pad].join(' ')}>{live ? 'Nada enviado ainda. O primeiro lembrete sai antes do próximo horário.' : 'Conecte o número para os avisos começarem.'}</p>
            ) : (
              <ul className={styles.history}>
                {(messages.data ?? []).map((message) => {
                  const status = MESSAGE_STATUS[message.status]
                  return (
                    <li key={message.id} className={styles.historyItem}>
                      <div className={styles.historyHead}>
                        <span className={styles.historyTitle}>{message.event ? (EVENT_INFO[message.event as keyof typeof EVENT_INFO]?.title ?? 'Aviso antigo') : 'Teste'}</span>
                        <Badge tone={status.tone}>{status.label}</Badge>
                      </div>
                      <span className={styles.muted}>
                        {formatPhone(message.phone)} · {formatDateTime(message.createdAt)}
                      </span>
                      {message.error && <span className={styles.historyError}>{message.error}</span>}
                      <p className={styles.historyText}>{message.text.replace(/[*_~]/g, '')}</p>
                    </li>
                  )
                })}
              </ul>
            )}
          </Card>
        </div>

        <Card title="Avisos automáticos" description={live ? 'Cada aviso sai sozinho no momento certo. Desligue o que não quiser mandar.' : 'Já dá para ajustar os textos. Eles começam a sair quando o número estiver conectado.'}>
          <div className={styles.templates}>
            {templates.data.items.map((template) => (
              <TemplateCard
                key={`${template.event}-${template.custom}-${template.enabled}`}
                installationId={installationId}
                template={template}
                variables={templates.data!.variables}
                reminderOptions={templates.data!.reminderOptions}
                onSaved={(saved) => templates.mutate((data) => ({ ...data, items: data.items.map((item) => (item.event === saved.event ? saved : item)) }))}
              />
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
