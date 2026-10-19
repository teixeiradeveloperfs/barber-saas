import { fullAddress, getShop } from '../data/shop'

type CalendarEvent = {
  title: string
  description: string
  start: Date
  durationMin: number
}

function pad(value: number) {
  return String(value).padStart(2, '0')
}

/** Data no formato do iCalendar/Google, em UTC: 20260920T130000Z */
function stamp(date: Date) {
  return (
    date.getUTCFullYear().toString() +
    pad(date.getUTCMonth() + 1) +
    pad(date.getUTCDate()) +
    'T' +
    pad(date.getUTCHours()) +
    pad(date.getUTCMinutes()) +
    '00Z'
  )
}

export function googleCalendarUrl({ title, description, start, durationMin }: CalendarEvent) {
  const end = new Date(start.getTime() + durationMin * 60_000)
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    details: description,
    location: `${getShop().name} · ${fullAddress()}`,
    dates: `${stamp(start)}/${stamp(end)}`,
  })
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

function escapeIcs(text: string) {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n')
}

/** Arquivo .ics para Apple Calendar, Outlook e outros. */
export function downloadIcs({ title, description, start, durationMin }: CalendarEvent) {
  const end = new Date(start.getTime() + durationMin * 60_000)
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Luxe Cuts//Agendamento//PT',
    'BEGIN:VEVENT',
    `UID:${Date.now()}@luxecuts`,
    `DTSTAMP:${stamp(new Date())}`,
    `DTSTART:${stamp(start)}`,
    `DTEND:${stamp(end)}`,
    `SUMMARY:${escapeIcs(title)}`,
    `DESCRIPTION:${escapeIcs(description)}`,
    `LOCATION:${escapeIcs(`${getShop().name} · ${fullAddress()}`)}`,
    'BEGIN:VALARM',
    'TRIGGER:-PT2H',
    'ACTION:DISPLAY',
    'DESCRIPTION:Seu corte é em 2 horas',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ]
  const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'luxe-cuts-agendamento.ics'
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
