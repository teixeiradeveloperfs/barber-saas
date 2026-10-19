import { useState } from 'react'
import { TextArea } from '../../ui/TextArea/TextArea'

type LinesFieldProps = {
  label: string
  value: string[]
  onChange: (value: string[]) => void
  hint?: string
  error?: string
  placeholder?: string
  rows?: number
}

/** Lista de textos editada como "um por linha". Linhas vazias somem ao salvar. */
export function LinesField({ label, value, onChange, hint, error, placeholder, rows = 3 }: LinesFieldProps) {
  const joined = value.join('\n')
  const [text, setText] = useState(joined)
  const [lastJoined, setLastJoined] = useState(joined)

  if (joined !== lastJoined) {
    setLastJoined(joined)
    if (text.split('\n').filter((line) => line.trim() !== '').join('\n') !== joined) setText(joined)
  }

  return (
    <TextArea
      label={label}
      value={text}
      rows={rows}
      placeholder={placeholder}
      hint={hint ?? 'Um item por linha.'}
      error={error}
      onChange={(next) => {
        setText(next)
        onChange(next.split('\n').map((line) => line.trim()).filter(Boolean))
      }}
    />
  )
}
