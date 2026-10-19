import type { NotificationEvent, WhatsappMessage } from '../../api/admin'

/** Nome e explicação de cada aviso no painel. */
export const EVENT_INFO: Record<NotificationEvent, { title: string; when: string }> = {
  LEMBRETE: { title: 'Lembrete e confirmação de ida', when: 'Antes do horário, pergunta se o cliente vem. Resposta 1 confirma, 2 cancela.' },
  CLIENTE_CONFIRMOU: { title: 'Resposta a quem confirmou', when: 'Quando o cliente responde 1 ao lembrete.' },
  CANCELADO: { title: 'Cancelamento', when: 'Quando o horário é cancelado pela barbearia, pelo app ou pela resposta 2.' },
  CONCLUIDO: { title: 'Depois do atendimento', when: 'Quando você marca o atendimento como feito.' },
  FALTOU: { title: 'Falta', when: 'Quando você marca que o cliente não veio.' },
}

export const MESSAGE_STATUS: Record<WhatsappMessage['status'], { label: string; tone: 'ok' | 'danger' | 'neutral' }> = {
  ENVIADO: { label: 'Enviada', tone: 'ok' },
  FALHOU: { label: 'Não enviada', tone: 'danger' },
  PENDENTE: { label: 'Na fila', tone: 'neutral' },
}

export function reminderLabel(minutes: number) {
  if (minutes < 60) return `${minutes} min antes`
  const hours = minutes / 60
  if (hours === 24) return '1 dia antes'
  return `${hours} ${hours === 1 ? 'hora' : 'horas'} antes`
}

/** Troca {variavel} pelo exemplo, como o servidor faz. */
export function renderExample(text: string, values: Record<string, string>) {
  return text.replace(/\{(\w+)\}/g, (match, key: string) => values[key] ?? match)
}
