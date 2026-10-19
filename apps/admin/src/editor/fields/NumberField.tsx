import { useState } from 'react'
import { TextField } from '../../ui/TextField/TextField'

type NumberFieldProps = {
  label: string
  value: number
  onChange: (value: number) => void
  hint?: string
  error?: string
  /** Aceita vírgula ou ponto como decimal. */
  decimals?: boolean
  min?: number
  max?: number
  placeholder?: string
  className?: string
}

function format(value: number, decimals: boolean) {
  const text = String(value)
  return decimals ? text.replace('.', ',') : text
}

function parse(text: string, decimals: boolean): number | null {
  const normalized = text.trim().replace(',', '.')
  if (normalized === '' || normalized === '-' || normalized.endsWith('.')) return null
  const parsed = Number(normalized)
  if (!Number.isFinite(parsed)) return null
  return decimals ? parsed : Math.trunc(parsed)
}

/** Campo numérico que tolera digitação parcial ("12," vira 12,5) sem perder o cursor. */
export function NumberField({ label, value, onChange, hint, error, decimals = false, min, max, placeholder, className }: NumberFieldProps) {
  const [text, setText] = useState(() => format(value, decimals))
  const [lastValue, setLastValue] = useState(value)

  // Valor mudou por fora (desfazer, troca de item): realinha o texto.
  if (value !== lastValue) {
    setLastValue(value)
    if (parse(text, decimals) !== value) setText(format(value, decimals))
  }

  return (
    <TextField
      label={label}
      value={text}
      inputMode={decimals ? 'decimal' : 'numeric'}
      placeholder={placeholder}
      hint={hint}
      error={error}
      className={className}
      onChange={(next) => {
        setText(next)
        const parsed = parse(next, decimals)
        if (parsed === null) return
        const clamped = Math.min(max ?? Infinity, Math.max(min ?? -Infinity, parsed))
        onChange(clamped)
      }}
      onBlur={() => setText(format(value, decimals))}
    />
  )
}
