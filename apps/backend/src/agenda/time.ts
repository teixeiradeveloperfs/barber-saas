/** Fuso da barbearia. Vai para o config do tenant quando precisar variar por loja. */
export const DEFAULT_TIMEZONE = 'America/Sao_Paulo';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^\d{2}:\d{2}$/;

export function isDateString(value: string) {
  if (!DATE_RE.test(value)) return false;
  const [y, m, d] = value.split('-').map(Number);
  const probe = new Date(Date.UTC(y, m - 1, d));
  return probe.getUTCFullYear() === y && probe.getUTCMonth() === m - 1 && probe.getUTCDate() === d;
}

export function isTimeString(value: string) {
  if (!TIME_RE.test(value)) return false;
  const [h, m] = value.split(':').map(Number);
  return h >= 0 && h < 24 && m >= 0 && m < 60;
}

/** Deslocamento do fuso (ms) no instante dado; positivo quando à frente do UTC. */
function offsetAt(at: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(at);
  const get = (type: string) => Number(parts.find((part) => part.type === type)?.value ?? 0);
  const asUtc = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second'));
  return asUtc - Math.floor(at.getTime() / 1000) * 1000;
}

/** "2026-09-20" + "14:30" no fuso → instante UTC. Trata horário de verão pelo segundo passo. */
export function zonedToUtc(date: string, time: string, timeZone = DEFAULT_TIMEZONE) {
  const [y, m, d] = date.split('-').map(Number);
  const [h, mi] = time.split(':').map(Number);
  const guess = Date.UTC(y, m - 1, d, h, mi);
  let utc = guess - offsetAt(new Date(guess), timeZone);
  const second = offsetAt(new Date(utc), timeZone);
  if (guess - second !== utc) utc = guess - second;
  return new Date(utc);
}

export type LocalParts = { date: string; time: string; weekday: number };

/** Instante UTC → data, hora e dia da semana (0 = domingo) no fuso. */
export function toLocal(at: Date, timeZone = DEFAULT_TIMEZONE): LocalParts {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    weekday: 'short',
  }).formatToParts(at);
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? '';
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return {
    date: `${get('year')}-${get('month')}-${get('day')}`,
    time: `${get('hour')}:${get('minute')}`,
    weekday: weekdays.indexOf(get('weekday')),
  };
}

/** Dia da semana (0 = domingo) de uma data "YYYY-MM-DD" no fuso. */
export function weekdayOf(date: string, timeZone = DEFAULT_TIMEZONE) {
  return toLocal(zonedToUtc(date, '12:00', timeZone), timeZone).weekday;
}

export function addMinutes(at: Date, minutes: number) {
  return new Date(at.getTime() + minutes * 60_000);
}

export function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) {
  return aStart < bEnd && bStart < aEnd;
}
