import type { NotificationEvent } from '../generated/prisma/enums.js';

/** Minutos antes do horário para o lembrete, quando a barbearia não mudou. */
export const DEFAULT_REMINDER_MIN = 180;
export const REMINDER_OPTIONS_MIN = [60, 120, 180, 360, 720, 1440];

export type TemplateDefault = { enabled: boolean; text: string; offsetMin?: number };

/**
 * Avisos que existem. Reserva feita e confirmação saíram de propósito: a
 * reserva já vale ao ser feita, e cada mensagem a mais é risco para o número.
 */
export type ActiveEvent = Exclude<NotificationEvent, 'AGENDADO' | 'CONFIRMADO'>;

/** Ordem em que o painel mostra os avisos. */
export const EVENTS: ActiveEvent[] = ['LEMBRETE', 'CLIENTE_CONFIRMOU', 'CANCELADO', 'CONCLUIDO', 'FALTOU'];

export const DEFAULTS: Record<ActiveEvent, TemplateDefault> = {
  LEMBRETE: {
    enabled: true,
    offsetMin: DEFAULT_REMINDER_MIN,
    text: 'Oi, {nome}! Lembrete do seu horário {quando} com {barbeiro} na *{barbearia}*.\n\nVocê vem?\nResponda *1* para confirmar ou *2* para cancelar.',
  },
  CLIENTE_CONFIRMOU: {
    enabled: true,
    text: 'Combinado, {nome}! Te esperamos {quando}. 💈',
  },
  CANCELADO: {
    enabled: true,
    text: '{nome}, seu horário de {data} às {hora} na *{barbearia}* foi cancelado. Para marcar outro: {link}',
  },
  CONCLUIDO: {
    enabled: false,
    text: 'Valeu pela visita, {nome}! Quando quiser voltar, é só agendar: {link}',
  },
  FALTOU: {
    enabled: false,
    text: '{nome}, sentimos sua falta hoje às {hora}. Quer remarcar? {link}',
  },
};

/** Variáveis aceitas nos textos, com exemplo para o painel. */
export const VARIABLES: { key: string; label: string; example: string }[] = [
  { key: 'nome', label: 'Primeiro nome do cliente', example: 'Rafael' },
  { key: 'barbearia', label: 'Nome da barbearia', example: 'Luxe Cuts' },
  { key: 'barbeiro', label: 'Barbeiro', example: 'Diego' },
  { key: 'servicos', label: 'Serviços', example: 'Corte e barba' },
  { key: 'data', label: 'Data', example: 'sex, 19/09' },
  { key: 'hora', label: 'Hora', example: '15:00' },
  { key: 'quando', label: 'Hoje, amanhã ou a data, com a hora', example: 'hoje às 15:00' },
  { key: 'valor', label: 'Valor a pagar', example: 'R$ 75,00' },
  { key: 'codigo', label: 'Código da reserva', example: 'K7Q2M9XA' },
  { key: 'endereco', label: 'Endereço', example: 'Rua Augusta, 1200 - Consolação' },
  { key: 'link', label: 'Link do app', example: 'https://luxe-cuts.barberosbr.com' },
];

export type TemplateValues = Record<string, string>;

/** Troca {variavel} pelo valor. Variável desconhecida fica como está. */
export function render(text: string, values: TemplateValues) {
  return text.replace(/\{(\w+)\}/g, (match, key: string) => (key in values ? values[key] : match));
}

export function exampleValues(): TemplateValues {
  return Object.fromEntries(VARIABLES.map((variable) => [variable.key, variable.example]));
}
