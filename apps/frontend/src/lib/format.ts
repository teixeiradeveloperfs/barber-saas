/** Máscara de telefone brasileiro enquanto digita: (11) 91234-5678. */
export function formatPhone(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (digits.length === 0) return ''
  if (digits.length <= 2) return `(${digits}`
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}

export function isCompletePhone(value: string) {
  const digits = value.replace(/\D/g, '')
  return digits.length === 10 || digits.length === 11
}

const monthYear = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' })

/** "Março de 2025" a partir de uma data ISO. */
export function formatMonthYear(iso: string) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  const text = monthYear.format(date)
  return text.charAt(0).toUpperCase() + text.slice(1)
}

const time = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' })

export function formatTime(date: Date) {
  return time.format(date)
}
