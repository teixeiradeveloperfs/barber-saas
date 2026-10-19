const weekdayLong = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
const weekdayShort = new Intl.DateTimeFormat('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' })
const time = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' })

function cap(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1)
}

export function formatDateLong(iso: string) {
  return cap(weekdayLong.format(new Date(iso)))
}

/** "Sáb, 20 set" */
export function formatDateShort(iso: string) {
  return cap(weekdayShort.format(new Date(iso)).replaceAll('.', '').replace(' de ', ' '))
}

export function formatTime(iso: string) {
  return time.format(new Date(iso))
}

/** "hoje", "amanhã", "em 3 dias", "há 2 dias" */
export function relativeDay(iso: string, now = new Date()) {
  const target = new Date(iso)
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const targetStart = new Date(target.getFullYear(), target.getMonth(), target.getDate())
  const days = Math.round((targetStart.getTime() - start.getTime()) / 86_400_000)
  if (days === 0) return 'hoje'
  if (days === 1) return 'amanhã'
  if (days === -1) return 'ontem'
  if (days > 1) return `em ${days} dias`
  return `há ${Math.abs(days)} dias`
}

/** Cancelamento grátis até 2 horas antes. */
export function canCancelFree(iso: string, now = Date.now()) {
  return new Date(iso).getTime() - now >= 2 * 60 * 60 * 1000
}
