import type { ReactNode } from 'react'
import styles from './WhatsAppPage.module.css'

/** Formatação do WhatsApp (*negrito*, _itálico_, ~riscado~) em elementos, sem HTML cru. */
function formatLine(line: string, key: string): ReactNode[] {
  const parts: ReactNode[] = []
  const pattern = /(\*[^*\n]+\*|_[^_\n]+_|~[^~\n]+~)/g
  let last = 0
  let match: RegExpExecArray | null
  let index = 0
  while ((match = pattern.exec(line))) {
    if (match.index > last) parts.push(line.slice(last, match.index))
    const token = match[0]
    const inner = token.slice(1, -1)
    const id = `${key}-${index++}`
    if (token.startsWith('*')) parts.push(<strong key={id}>{inner}</strong>)
    else if (token.startsWith('_')) parts.push(<em key={id}>{inner}</em>)
    else parts.push(<s key={id}>{inner}</s>)
    last = match.index + token.length
  }
  if (last < line.length) parts.push(line.slice(last))
  return parts
}

/** Balão de mensagem como o cliente vê no WhatsApp. */
export function Bubble({ text, time = '15:02' }: { text: string; time?: string }) {
  const lines = text.split('\n')
  return (
    <div className={styles.chat} aria-label="Prévia da mensagem">
      <div className={styles.bubble}>
        {lines.map((line, index) => (
          <span key={index} className={styles.line}>
            {line ? formatLine(line, String(index)) : ' '}
          </span>
        ))}
        <span className={styles.bubbleTime}>{time}</span>
      </div>
    </div>
  )
}
